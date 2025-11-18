import { Pool, PoolClient } from 'pg';

export interface Document {
  id?: string;
  filename: string;
  file_type: string;
  file_size: number;
  total_chunks?: number;
  status?: string;
  metadata?: Record<string, any>;
}

export interface Chunk {
  id?: string;
  document_id: string;
  chunk_index: number;
  content: string;
  embedding?: number[];
  metadata?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  metadata: Record<string, any>;
  similarity: number;
  document_filename?: string;
}

export interface QueryLog {
  query: string;
  retrieved_chunks: any[];
  answer?: string;
  latency_ms?: number;
  metadata?: Record<string, any>;
}

export class NeonDB {
  private pool: Pool;
  private initialized: boolean = false;

  constructor(connectionString?: string) {
    const dbUrl = connectionString || process.env.NEON_DB_URL;

    if (!dbUrl) {
      throw new Error('Database connection string is required (NEON_DB_URL)');
    }

    this.pool = new Pool({
      connectionString: dbUrl,
      ssl: {
        rejectUnauthorized: false
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  /**
   * Initialize the database connection
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const client = await this.pool.connect();

      // Test connection and verify pgvector extension
      const result = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_extension WHERE extname = 'vector'
        ) as has_vector;
      `);

      if (!result.rows[0].has_vector) {
        throw new Error('pgvector extension is not installed. Run migrations first.');
      }

      client.release();
      this.initialized = true;
      console.log('✅ NeonDB initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize NeonDB:', error);
      throw error;
    }
  }

  /**
   * Insert a new document
   */
  async insertDocument(doc: Document): Promise<string> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO documents (filename, file_type, file_size, metadata, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [doc.filename, doc.file_type, doc.file_size, JSON.stringify(doc.metadata || {}), doc.status || 'processing']
      );
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  /**
   * Update document status and total chunks
   */
  async updateDocument(id: string, updates: { status?: string; total_chunks?: number }): Promise<void> {
    const client = await this.pool.connect();
    try {
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.status !== undefined) {
        setClauses.push(`status = $${paramIndex++}`);
        values.push(updates.status);
      }

      if (updates.total_chunks !== undefined) {
        setClauses.push(`total_chunks = $${paramIndex++}`);
        values.push(updates.total_chunks);
      }

      if (setClauses.length === 0) return;

      values.push(id);
      await client.query(
        `UPDATE documents SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
        values
      );
    } finally {
      client.release();
    }
  }

  /**
   * Upsert chunks with embeddings
   */
  async upsertChunks(chunks: Chunk[]): Promise<void> {
    if (chunks.length === 0) return;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (const chunk of chunks) {
        const embeddingStr = chunk.embedding ? `[${chunk.embedding.join(',')}]` : null;

        await client.query(
          `INSERT INTO chunks (document_id, chunk_index, content, embedding, metadata)
           VALUES ($1, $2, $3, $4::vector, $5)
           ON CONFLICT (document_id, chunk_index)
           DO UPDATE SET
             content = EXCLUDED.content,
             embedding = EXCLUDED.embedding,
             metadata = EXCLUDED.metadata`,
          [
            chunk.document_id,
            chunk.chunk_index,
            chunk.content,
            embeddingStr,
            JSON.stringify(chunk.metadata || {})
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Query similar chunks using vector similarity
   */
  async query(embedding: number[], k: number = 5, documentIds?: string[]): Promise<SearchResult[]> {
    const client = await this.pool.connect();
    try {
      const embeddingStr = `[${embedding.join(',')}]`;

      let queryText = `
        SELECT
          c.id,
          c.document_id,
          c.chunk_index,
          c.content,
          c.metadata,
          d.filename as document_filename,
          1 - (c.embedding <=> $1::vector) as similarity
        FROM chunks c
        JOIN documents d ON c.document_id = d.id
        WHERE c.embedding IS NOT NULL
      `;

      const params: any[] = [embeddingStr];

      if (documentIds && documentIds.length > 0) {
        queryText += ` AND c.document_id = ANY($2)`;
        params.push(documentIds);
      }

      queryText += `
        ORDER BY c.embedding <=> $1::vector
        LIMIT $${params.length + 1}
      `;
      params.push(k);

      const result = await client.query(queryText, params);

      return result.rows.map(row => ({
        id: row.id,
        document_id: row.document_id,
        chunk_index: row.chunk_index,
        content: row.content,
        metadata: row.metadata,
        similarity: parseFloat(row.similarity),
        document_filename: row.document_filename
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Delete document and all its chunks
   */
  async deleteDocument(documentId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM documents WHERE id = $1', [documentId]);
    } finally {
      client.release();
    }
  }

  /**
   * Delete multiple documents
   */
  async deleteDocuments(documentIds: string[]): Promise<void> {
    if (documentIds.length === 0) return;

    const client = await this.pool.connect();
    try {
      await client.query('DELETE FROM documents WHERE id = ANY($1)', [documentIds]);
    } finally {
      client.release();
    }
  }

  /**
   * Get all documents
   */
  async listDocuments(): Promise<Document[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, filename, file_type, file_size, total_chunks, status, metadata, upload_date
        FROM documents
        ORDER BY upload_date DESC
      `);

      return result.rows.map(row => ({
        id: row.id,
        filename: row.filename,
        file_type: row.file_type,
        file_size: row.file_size,
        total_chunks: row.total_chunks,
        status: row.status,
        metadata: row.metadata
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(id: string): Promise<Document | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM documents WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.id,
        filename: row.filename,
        file_type: row.file_type,
        file_size: row.file_size,
        total_chunks: row.total_chunks,
        status: row.status,
        metadata: row.metadata
      };
    } finally {
      client.release();
    }
  }

  /**
   * Log query for analytics
   */
  async logQuery(log: QueryLog): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO query_logs (query, retrieved_chunks, answer, latency_ms, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          log.query,
          JSON.stringify(log.retrieved_chunks),
          log.answer,
          log.latency_ms,
          JSON.stringify(log.metadata || {})
        ]
      );
    } finally {
      client.release();
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    total_documents: number;
    total_chunks: number;
    total_queries: number;
  }> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT
          (SELECT COUNT(*) FROM documents) as total_documents,
          (SELECT COUNT(*) FROM chunks) as total_chunks,
          (SELECT COUNT(*) FROM query_logs) as total_queries
      `);

      return {
        total_documents: parseInt(result.rows[0].total_documents),
        total_chunks: parseInt(result.rows[0].total_chunks),
        total_queries: parseInt(result.rows[0].total_queries)
      };
    } finally {
      client.release();
    }
  }

  /**
   * Close database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
    this.initialized = false;
  }
}

// Singleton instance
let dbInstance: NeonDB | null = null;

export function getDB(): NeonDB {
  if (!dbInstance) {
    dbInstance = new NeonDB();
  }
  return dbInstance;
}
