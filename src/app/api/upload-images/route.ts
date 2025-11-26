/**
 * Upload Images API Route
 * Batch upload and index images organized by category/case
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/vector/neondb';
import { getEmbeddingProvider } from '@/embeddings';
import { getGeminiLLM } from '@/llm/gemini';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for batch processing

/**
 * Upload multiple images organized by folder/category
 * Example: POST /api/upload-images
 * Body: FormData with files and category
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const category = formData.get('category') as string || 'general';
    const description = formData.get('description') as string || '';

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Minimal 1 gambar harus diupload' },
        { status: 400 }
      );
    }

    // Validate max images
    const maxImages = parseInt(process.env.MAX_IMAGES_PER_UPLOAD || '20');
    if (files.length > maxImages) {
      return NextResponse.json(
        { error: `Maksimal ${maxImages} gambar per upload` },
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

    // Validate file sizes
    const maxSize = parseInt(process.env.MAX_IMAGE_SIZE_MB || '10') * 1024 * 1024;
    for (const file of files) {
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File ${file.name} terlalu besar. Maksimal ${process.env.MAX_IMAGE_SIZE_MB || '10'}MB per gambar` },
          { status: 400 }
        );
      }
    }

    console.log(`🖼️  Processing ${files.length} images for category: ${category}`);

    const db = getDB();
    await db.init();
    const llm = getGeminiLLM();
    const embedder = getEmbeddingProvider();

    // Create document record for image collection
    const documentId = await db.insertDocument({
      filename: `[IMAGES] ${category}`,
      file_type: 'image_collection',
      file_size: files.reduce((sum, f) => sum + f.size, 0),
      status: 'processing',
      metadata: {
        category,
        description,
        image_count: files.length,
        uploaded_at: new Date().toISOString()
      }
    });

    try {
      // Process images concurrently (batches of 3 for speed)
      const BATCH_SIZE = parseInt(process.env.IMAGE_ANALYSIS_BATCH_SIZE || '3');
      const chunks = [];
      let processedCount = 0;

      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);

        console.log(`  📸 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(files.length / BATCH_SIZE)}`);

        const batchResults = await Promise.all(
          batch.map(async (file, batchIdx) => {
            const globalIdx = i + batchIdx;
            console.log(`    Analyzing image ${globalIdx + 1}/${files.length}: ${file.name}`);

            const buffer = Buffer.from(await file.arrayBuffer());

            // Analyze image with vision model
            const analysis = await llm.analyzeImage(
              {
                data: buffer,
                mimeType: file.type,
                filename: file.name
              },
              `Analisis gambar konstruksi baja ringan ini untuk kategori "${category}".

Jelaskan:
1. Kondisi yang terlihat (bagus/rusak/normal)
2. Masalah atau kerusakan spesifik (jika ada)
3. Karakteristik penting yang terlihat
4. Lokasi atau bagian konstruksi yang ditampilkan
5. Tingkat keparahan (jika ada masalah)

${description ? `Context tambahan: ${description}` : ''}

Fokus pada detail teknis yang berguna untuk referensi pencarian nanti. Gunakan bahasa natural dan jelas.`
            );

            return {
              filename: file.name,
              analysis,
              index: globalIdx
            };
          })
        );

        chunks.push(...batchResults);
        processedCount += batch.length;

        console.log(`  ✅ Progress: ${processedCount}/${files.length}`);
      }

      // Generate embeddings for all image analyses (with concurrent processing)
      console.log('🔮 Generating embeddings...');
      const texts = chunks.map(c => c.analysis);

      // Use concurrent embedding from updated embedBatch function
      const embeddings = await Promise.all(
        texts.map(text => embedder.embedQuery(text))
      );

      // Store in database
      console.log('💾 Storing image knowledge...');
      const chunksWithEmbeddings = chunks.map((chunk, idx) => ({
        document_id: documentId,
        chunk_index: chunk.index,
        content: chunk.analysis,
        embedding: embeddings[idx],
        metadata: {
          type: 'image_analysis',
          category,
          filename: chunk.filename,
          chunk_index: chunk.index,
          image_filename: chunk.filename
        }
      }));

      await db.upsertChunks(chunksWithEmbeddings);

      // Update document status
      await db.updateDocument(documentId, {
        status: 'completed',
        total_chunks: chunks.length
      });

      console.log(`✅ Successfully indexed ${files.length} images`);

      return NextResponse.json({
        success: true,
        document_id: documentId,
        category,
        total_images: files.length,
        message: `Berhasil mengindeks ${files.length} gambar untuk kategori "${category}"`
      });
    } catch (error) {
      // Update document status to failed
      await db.updateDocument(documentId, {
        status: 'failed'
      });

      throw error;
    }
  } catch (error) {
    console.error('❌ Image upload error:', error);
    return NextResponse.json(
      {
        error: 'Gagal memproses gambar',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
