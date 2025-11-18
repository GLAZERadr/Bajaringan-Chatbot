import { config } from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
config();

/**
 * Update embedding dimension to match provider
 * Usage: npx tsx database/update-dimension.ts
 */
async function updateDimension() {
  const connectionString = process.env.NEON_DB_URL;
  const provider = process.env.EMBEDDING_PROVIDER || 'bge-m3';

  if (!connectionString) {
    throw new Error('NEON_DB_URL environment variable is not set');
  }

  // Determine dimension based on provider
  const dimension = provider.toLowerCase() === 'openai' ? 1536 : 1024;

  console.log(`📐 Updating embedding dimension to ${dimension} for provider: ${provider}`);

  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const client = await pool.connect();

    console.log('🔄 Connecting to database...');

    // Check current dimension
    const checkQuery = `
      SELECT atttypmod
      FROM pg_attribute
      WHERE attrelid = 'chunks'::regclass
      AND attname = 'embedding'
    `;

    const result = await client.query(checkQuery);
    const currentDim = result.rows[0]?.atttypmod - 4; // pgvector stores dim + 4

    if (currentDim === dimension) {
      console.log(`✅ Dimension already set to ${dimension}. No update needed.`);
      client.release();
      return;
    }

    console.log(`📊 Current dimension: ${currentDim}, Target dimension: ${dimension}`);

    // Drop existing index
    console.log('🗑️  Dropping existing index...');
    await client.query('DROP INDEX IF EXISTS chunks_embedding_idx');

    // Alter column dimension
    console.log(`📝 Updating embedding column to vector(${dimension})...`);
    await client.query(`ALTER TABLE chunks ALTER COLUMN embedding TYPE vector(${dimension})`);

    // Recreate index
    console.log('🔨 Recreating HNSW index...');
    await client.query(`
      CREATE INDEX chunks_embedding_idx ON chunks
      USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64)
    `);

    console.log(`✅ Successfully updated embedding dimension to ${dimension}!`);

    client.release();
  } catch (error) {
    console.error('❌ Update failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

updateDimension().catch(console.error);
