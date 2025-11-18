#!/usr/bin/env tsx
/**
 * Batch Index Script
 * Index all documents in a folder
 *
 * Usage: npx tsx scripts/index.ts <folder-path>
 */

import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { getDB } from '../src/vector/neondb';

// Load environment variables
config();
import { getEmbeddingProvider, embedBatch } from '../src/embeddings';
import { processFile, isValidFileType } from '../src/utils/document-processor';

async function indexFolder(folderPath: string) {
  console.log(`📁 Indexing folder: ${folderPath}`);

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

  console.log(`📄 Found ${files.length} files to index`);

  // Initialize DB
  const db = getDB();
  await db.init();

  const embedder = getEmbeddingProvider();

  let successCount = 0;
  let failCount = 0;

  // Process each file
  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const filePath = path.join(folderPath, filename);

    console.log(`\n[${i + 1}/${files.length}] Processing: ${filename}`);

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
          indexed_at: new Date().toISOString(),
          source_path: filePath
        }
      });

      console.log(`  📝 Created document record: ${documentId}`);

      // Extract and chunk
      const { document, chunks } = await processFile(buffer, filename);
      console.log(`  ✂️  Created ${chunks.length} chunks`);

      // Generate embeddings
      const chunkTexts = chunks.map(c => c.content);
      const embeddings = await embedBatch(chunkTexts, embedder, 10);
      console.log(`  🔮 Generated ${embeddings.length} embeddings`);

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

      console.log(`  ✅ Successfully indexed ${filename}`);
      successCount++;
    } catch (error) {
      console.error(`  ❌ Failed to index ${filename}:`, error);
      failCount++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Successfully indexed: ${successCount} files`);
  console.log(`❌ Failed: ${failCount} files`);
  console.log(`${'='.repeat(50)}\n`);

  await db.close();
}

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: npx tsx scripts/index.ts <folder-path>');
  console.log('Example: npx tsx scripts/index.ts ./documents');
  process.exit(1);
}

const folderPath = args[0];

indexFolder(folderPath)
  .then(() => {
    console.log('🎉 Indexing complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Indexing failed:', error);
    process.exit(1);
  });
