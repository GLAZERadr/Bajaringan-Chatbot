#!/usr/bin/env tsx
/**
 * Reindex Script
 * Drop all data and rebuild index from scratch
 *
 * Usage: npx tsx scripts/reindex.ts <folder-path>
 */

import { config } from 'dotenv';
import * as readline from 'readline';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { getDB } from '../src/vector/neondb';

// Load environment variables
config();
import { getEmbeddingProvider, embedBatch } from '../src/embeddings';
import { processFile, isValidFileType } from '../src/utils/document-processor';

async function confirmReindex(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(
      '⚠️  WARNING: This will DELETE all existing documents and chunks. Continue? (yes/no): ',
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes');
      }
    );
  });
}

async function clearDatabase() {
  console.log('🗑️  Clearing database...');

  const connectionString = process.env.NEON_DB_URL;

  if (!connectionString) {
    throw new Error('NEON_DB_URL environment variable is not set');
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();

    // Delete all data (cascade will handle chunks)
    await client.query('DELETE FROM documents');
    await client.query('DELETE FROM query_logs');

    // Reset sequences if needed
    await client.query(`
      SELECT setval(pg_get_serial_sequence('documents', 'id'), 1, false);
    `);

    console.log('✅ Database cleared');

    client.release();
  } finally {
    await pool.end();
  }
}

async function reindexFolder(folderPath: string) {
  console.log(`\n📁 Reindexing folder: ${folderPath}\n`);

  if (!fs.existsSync(folderPath)) {
    console.error(`❌ Folder not found: ${folderPath}`);
    process.exit(1);
  }

  const stats = fs.statSync(folderPath);
  if (!stats.isDirectory()) {
    console.error(`❌ Path is not a directory: ${folderPath}`);
    process.exit(1);
  }

  // Get all files
  const files = fs.readdirSync(folderPath).filter(file => {
    const filePath = path.join(folderPath, file);
    const stat = fs.statSync(filePath);
    return stat.isFile() && isValidFileType(file);
  });

  if (files.length === 0) {
    console.log('⚠️  No valid files found in folder');
    return;
  }

  console.log(`📄 Found ${files.length} files to index\n`);

  // Initialize DB
  const db = getDB();
  await db.init();

  const embedder = getEmbeddingProvider();

  let successCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  // Process each file
  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const filePath = path.join(folderPath, filename);

    console.log(`[${i + 1}/${files.length}] Processing: ${filename}`);

    try {
      // Read file
      const buffer = fs.readFileSync(filePath);
      const fileType = path.extname(filename).substring(1);
      const fileSize = buffer.length;

      // Create document record
      const documentId = await db.insertDocument({
        filename,
        file_type: fileType,
        file_size: fileSize,
        status: 'processing',
        metadata: {
          reindexed_at: new Date().toISOString(),
          source_path: filePath
        }
      });

      // Extract and chunk
      const { document, chunks } = await processFile(buffer, filename);
      console.log(`  ✂️  ${chunks.length} chunks`);

      // Generate embeddings
      const chunkTexts = chunks.map(c => c.content);
      const embeddings = await embedBatch(chunkTexts, embedder, 10);
      console.log(`  🔮 ${embeddings.length} embeddings`);

      // Upsert chunks
      const chunksWithEmbeddings = chunks.map((chunk, idx) => ({
        document_id: documentId,
        chunk_index: chunk.metadata.chunk_index,
        content: chunk.content,
        embedding: embeddings[idx],
        metadata: {
          ...chunk.metadata,
          filename,
          page: chunk.metadata.page
        }
      }));

      await db.upsertChunks(chunksWithEmbeddings);

      // Update document status
      await db.updateDocument(documentId, {
        status: 'completed',
        total_chunks: chunks.length
      });

      console.log(`  ✅ Indexed successfully\n`);
      successCount++;
    } catch (error) {
      console.error(`  ❌ Failed:`, error);
      failCount++;
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Successfully indexed: ${successCount} files`);
  console.log(`❌ Failed: ${failCount} files`);
  console.log(`⏱️  Total time: ${duration}s`);
  console.log(`${'='.repeat(60)}\n`);

  await db.close();
}

// Main
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: npx tsx scripts/reindex.ts <folder-path>');
    console.log('Example: npx tsx scripts/reindex.ts ./documents');
    process.exit(1);
  }

  const folderPath = args[0];

  // Confirm before proceeding
  const confirmed = await confirmReindex();

  if (!confirmed) {
    console.log('❌ Reindex cancelled');
    process.exit(0);
  }

  try {
    // Clear database
    await clearDatabase();

    // Reindex folder
    await reindexFolder(folderPath);

    console.log('🎉 Reindex complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Reindex failed:', error);
    process.exit(1);
  }
}

main();
