/**
 * RAG Query API Route
 * Handles semantic search and answer generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/vector/neondb';
import { getEmbeddingProvider } from '@/embeddings';
import { getGeminiLLM } from '@/llm/gemini';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface QueryRequest {
  query: string;
  k?: number;
  stream?: boolean;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: QueryRequest = await request.json();
    const { query, k = 5, stream = false } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Step 1: Embed query
    console.log('🔍 Embedding query...');
    const embedder = getEmbeddingProvider();
    const queryEmbedding = await embedder.embedQuery(query);

    // Step 2: Vector search
    console.log('🔎 Searching vector database...');
    const db = getDB();
    await db.init();
    const searchResults = await db.query(queryEmbedding, k);

    // Step 3: Generate answer with LLM
    console.log('🤖 Generating answer with Gemini...');
    const llm = getGeminiLLM();

    if (searchResults.length === 0) {
      // No relevant chunks found - use general knowledge fallback
      console.log('⚠️  No relevant chunks found. Using general knowledge fallback...');

      const fallbackPrompt = `${query}

IMPORTANT: This question doesn't have relevant information in the uploaded documents. Please answer using your general knowledge, but start your response with:

"Informasi ini tidak tersedia dalam dokumen yang diupload.

[Then provide your helpful general knowledge answer]

💡 Tip: Untuk jawaban yang lebih spesifik dan akurat, silakan upload dokumen terkait ke knowledge base."`;

      try {
        const generalAnswer = await llm.complete(fallbackPrompt);
        const latency = Date.now() - startTime;

        // Log query
        await db.logQuery({
          query,
          retrieved_chunks: [],
          answer: generalAnswer,
          latency_ms: latency
        });

        return NextResponse.json({
          answer: generalAnswer,
          citations: [],
          metadata: {
            chunks_retrieved: 0,
            latency_ms: latency,
            fallback_mode: 'general_knowledge'
          }
        });
      } catch (error) {
        console.error('❌ Fallback error:', error);
        const latency = Date.now() - startTime;

        return NextResponse.json({
          answer: "Informasi ini tidak tersedia dalam dokumen yang diupload.\n\n💡 Tip: Untuk jawaban yang lebih spesifik dan akurat, silakan upload dokumen terkait ke knowledge base.",
          citations: [],
          metadata: {
            chunks_retrieved: 0,
            latency_ms: latency,
            fallback_mode: 'error'
          }
        });
      }
    }

    console.log(`✅ Found ${searchResults.length} relevant chunks`);

    // Step 4: Generate RAG answer with context
    if (stream) {
      // Streaming response
      return handleStreamingResponse(query, searchResults, llm, db, startTime);
    }

    // Non-streaming response
    const ragResponse = await llm.generateRAGAnswer({
      query,
      chunks: searchResults
    });

    const latency = Date.now() - startTime;

    // Log query
    await db.logQuery({
      query,
      retrieved_chunks: searchResults.map(r => ({
        document_id: r.document_id,
        chunk_index: r.chunk_index,
        similarity: r.similarity
      })),
      answer: ragResponse.answer,
      latency_ms: latency
    });

    console.log(`✅ Query processed in ${latency}ms`);

    return NextResponse.json({
      answer: ragResponse.answer,
      citations: ragResponse.citations,
      metadata: {
        chunks_retrieved: searchResults.length,
        latency_ms: latency,
        avg_similarity: searchResults.reduce((sum, r) => sum + r.similarity, 0) / searchResults.length
      }
    });
  } catch (error) {
    console.error('❌ Query error:', error);

    return NextResponse.json(
      {
        error: 'Failed to process query',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle streaming response
 */
async function handleStreamingResponse(
  query: string,
  searchResults: any[],
  llm: any,
  db: any,
  startTime: number
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send citations first
        const citations = searchResults.map((chunk, idx) => ({
          document_id: chunk.document_id,
          document_name: chunk.document_filename || 'Unknown',
          chunk_index: chunk.chunk_index,
          content: chunk.content.substring(0, 200) + '...',
          page: chunk.metadata?.page
        }));

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'citations', citations })}\n\n`)
        );

        // Stream answer
        let fullAnswer = '';
        const generator = llm.generateRAGAnswerStream({
          query,
          chunks: searchResults
        });

        for await (const chunk of generator) {
          fullAnswer += chunk;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`)
          );
        }

        // Send done signal
        const latency = Date.now() - startTime;
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'done', latency_ms: latency })}\n\n`)
        );

        // Log query
        await db.logQuery({
          query,
          retrieved_chunks: searchResults.map(r => ({
            document_id: r.document_id,
            chunk_index: r.chunk_index,
            similarity: r.similarity
          })),
          answer: fullAnswer,
          latency_ms: latency
        });

        controller.close();
      } catch (error) {
        console.error('❌ Streaming error:', error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Streaming failed' })}\n\n`)
        );
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
