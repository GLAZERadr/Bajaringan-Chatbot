/**
 * Upload API Route
 * Handles file upload, extraction, chunking, embedding, and vector storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/vector/neondb';
import { getEmbeddingProvider, embedBatch } from '@/embeddings';
import { processFile, getFileType } from '@/utils/document-processor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for file processing

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log(`📄 Processing file: ${file.name} (${file.size} bytes)`);

    // Validate file type
    const fileType = getFileType(file.name);
    const validTypes = ['pdf', 'docx', 'txt', 'md', 'application/pdf', 'text/plain', 'text/markdown'];

    if (!validTypes.some(t => fileType.includes(t))) {
      return NextResponse.json(
        { error: `Invalid file type. Supported: PDF, DOCX, TXT, MD` },
        { status: 400 }
      );
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 50MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Initialize database
    const db = getDB();
    await db.init();

    // Create document record
    console.log('💾 Creating document record...');
    const documentId = await db.insertDocument({
      filename: file.name,
      file_type: fileType,
      file_size: file.size,
      status: 'processing',
      metadata: {
        uploaded_at: new Date().toISOString()
      }
    });

    try {
      // Step 1: Extract and chunk document
      console.log('📝 Extracting and chunking document...');
      const { document, chunks } = await processFile(buffer, file.name);

      console.log(`✅ Extracted ${chunks.length} chunks`);

      // Step 2: Generate embeddings
      console.log('🔮 Generating embeddings...');
      const embedder = getEmbeddingProvider();

      const chunkTexts = chunks.map(c => c.content);
      const embeddings = await embedBatch(chunkTexts, embedder, 10);

      console.log(`✅ Generated ${embeddings.length} embeddings`);

      // Step 3: Upsert chunks with embeddings
      console.log('💾 Storing chunks in vector database...');

      const chunksWithEmbeddings = chunks.map((chunk, idx) => ({
        document_id: documentId,
        chunk_index: chunk.metadata.chunk_index,
        content: chunk.content,
        embedding: embeddings[idx],
        metadata: {
          ...chunk.metadata,
          filename: file.name,
          page: chunk.metadata.page
        }
      }));

      await db.upsertChunks(chunksWithEmbeddings);

      // Update document status
      await db.updateDocument(documentId, {
        status: 'completed',
        total_chunks: chunks.length
      });

      console.log(`✅ Successfully indexed ${file.name}`);

      return NextResponse.json({
        success: true,
        document_id: documentId,
        filename: file.name,
        total_chunks: chunks.length,
        metadata: document.metadata
      });
    } catch (error) {
      // Update document status to failed
      await db.updateDocument(documentId, {
        status: 'failed'
      });

      throw error;
    }
  } catch (error) {
    console.error('❌ Upload error:', error);

    return NextResponse.json(
      {
        error: 'Failed to process file',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
