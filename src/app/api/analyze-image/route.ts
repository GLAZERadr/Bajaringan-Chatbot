/**
 * Image Analysis API Route
 * Handles multimodal queries (text + images) with RAG
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGeminiLLM } from '@/llm/gemini';
import { getDB } from '@/vector/neondb';
import { getEmbeddingProvider } from '@/embeddings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const query = formData.get('query') as string ||
                  'Apa yang Anda lihat di gambar ini? Ada masalah apa?';
    const k = parseInt(formData.get('k') as string || '5');

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Minimal satu gambar harus diupload' },
        { status: 400 }
      );
    }

    // Validate image types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Tipe file tidak valid: ${file.name}. Gunakan JPG, PNG, atau WebP` },
          { status: 400 }
        );
      }
    }

    // Validate file sizes (10MB per image)
    const maxSize = 10 * 1024 * 1024; // 10MB
    for (const file of files) {
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File ${file.name} terlalu besar. Maksimal 10MB per gambar` },
          { status: 400 }
        );
      }
    }

    console.log(`🖼️  Analyzing ${files.length} image(s)...`);

    // Convert files to buffers
    const images = await Promise.all(
      files.map(async (file) => ({
        data: Buffer.from(await file.arrayBuffer()),
        mimeType: file.type,
        filename: file.name
      }))
    );

    const llm = getGeminiLLM();

    // Step 1: Embed query for vector search
    console.log('🔍 Searching related documents...');
    const embedder = getEmbeddingProvider();
    const queryEmbedding = await embedder.embedQuery(query);

    // Step 2: Vector search
    const db = getDB();
    await db.init();
    const searchResults = await db.query(queryEmbedding, k);

    // Step 3: Multimodal analysis
    if (searchResults.length > 0) {
      console.log(`🤖 Generating multimodal answer with ${searchResults.length} relevant documents...`);
      const ragResponse = await llm.generateMultimodalRAGAnswer(
        query,
        images,
        searchResults
      );

      const latency = Date.now() - startTime;

      // Log query with images
      await db.logQuery({
        query: `[IMAGE QUERY] ${query}`,
        retrieved_chunks: searchResults.map(r => ({
          document_id: r.document_id,
          chunk_index: r.chunk_index,
          similarity: r.similarity
        })),
        answer: ragResponse.answer,
        latency_ms: latency,
        metadata: {
          image_count: images.length,
          image_filenames: images.map(img => img.filename)
        }
      });

      return NextResponse.json({
        answer: ragResponse.answer,
        citations: ragResponse.citations,
        metadata: {
          chunks_retrieved: searchResults.length,
          images_analyzed: images.length,
          latency_ms: latency
        }
      });
    } else {
      // Fallback: Image analysis only with general knowledge
      console.log('🤖 Analyzing image with general knowledge...');
      const imageAnalysis = await llm.analyzeImages(
        images,
        `${query}

Anda adalah asisten ahli baja ringan yang ramah dan helpful. Analisis gambar ini dan berikan:
1. Deskripsi kondisi yang terlihat
2. Identifikasi masalah (jika ada)
3. Penyebab kemungkinan
4. Rekomendasi tindakan yang konkret
5. Tips pencegahan untuk masa depan

Jawab dengan natural dan ramah seperti berbicara dengan klien. Gunakan "Saya" dan bahasa yang mudah dipahami.

Jika tidak ada informasi di dokumen knowledge base, jujur katakan dan berikan jawaban dari pengetahuan umum Anda tentang konstruksi baja ringan.`
      );

      const latency = Date.now() - startTime;

      await db.logQuery({
        query: `[IMAGE QUERY - FALLBACK] ${query}`,
        retrieved_chunks: [],
        answer: imageAnalysis,
        latency_ms: latency,
        metadata: {
          image_count: images.length,
          fallback_mode: 'vision_only'
        }
      });

      return NextResponse.json({
        answer: imageAnalysis,
        citations: [],
        metadata: {
          chunks_retrieved: 0,
          images_analyzed: images.length,
          latency_ms: latency,
          fallback_mode: 'vision_only'
        }
      });
    }
  } catch (error) {
    console.error('❌ Image analysis error:', error);
    return NextResponse.json(
      {
        error: 'Gagal menganalisis gambar',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
