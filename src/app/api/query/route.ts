/**
 * RAG Query API Route
 * Handles semantic search and answer generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/vector/neondb';
import { getEmbeddingProvider } from '@/embeddings';
import { getGeminiLLM } from '@/llm/gemini';
import { ConversationMessage } from '@/types/memory';
import { getIntentDetector } from '@/services/intent-detector';
import { getIntentHandlers } from '@/services/intent-handlers';
import { matchQAKnowledge, logQAMatch } from '@/services/qa-matcher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface QueryRequest {
  query: string;
  k?: number;
  stream?: boolean;
  conversationHistory?: ConversationMessage[]; // Add conversation history
}

// Simple LRU cache for embeddings
const embeddingCache = new Map<string, number[]>();
const MAX_CACHE_SIZE = 100;

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: QueryRequest = await request.json();
    const { query, k = 3, stream = false, conversationHistory = [] } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // ============================================
    // STEP 0: INTENT DETECTION (NLU LAYER)
    // ============================================
    console.log('🎯 Starting intent detection...');
    const detector = getIntentDetector();
    const handlers = getIntentHandlers();

    // Prepare conversation history for intent detection
    const conversationStrings = conversationHistory.map(msg =>
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    );

    const intentResult = await detector.detectIntent(query, conversationStrings);

    console.log(`📊 Intent detected: ${intentResult.classification.intent} (confidence: ${intentResult.classification.confidence})`);
    console.log(`📦 Extracted slots:`, intentResult.slots);
    console.log(`❓ Missing slots:`, intentResult.missing_slots);

    // Handle specific intents (not general_question or pertanyaan_produk)
    const shouldHandleIntent = intentResult.classification.intent !== 'general_question'
                            && intentResult.classification.intent !== 'pertanyaan_produk'
                            && intentResult.classification.confidence >= 0.7;

    if (shouldHandleIntent) {
      console.log(`✅ Handling intent: ${intentResult.classification.intent}`);

      // If slots are incomplete, ask for missing information
      if (!intentResult.is_complete && intentResult.next_question) {
        console.log(`📝 Asking for missing slots: ${intentResult.missing_slots.join(', ')}`);

        return NextResponse.json({
          answer: intentResult.next_question,
          citations: [],
          metadata: {
            intent: intentResult.classification.intent,
            confidence: intentResult.classification.confidence,
            missing_slots: intentResult.missing_slots,
            is_complete: false,
            latency_ms: Date.now() - startTime
          }
        });
      }

      // Slots complete, handle the intent
      const handlerResponse = await handlers.handleIntent(
        intentResult.classification.intent,
        intentResult.slots,
        query
      );

      console.log(`🎉 Intent handled: ${handlerResponse.action}`);

      // Log to database
      const db = getDB();
      await db.init();
      await db.logQuery({
        query,
        retrieved_chunks: [],
        answer: handlerResponse.message,
        latency_ms: Date.now() - startTime
      });

      return NextResponse.json({
        answer: handlerResponse.message,
        citations: [],
        metadata: {
          intent: intentResult.classification.intent,
          confidence: intentResult.classification.confidence,
          action: handlerResponse.action,
          slots: intentResult.slots,
          latency_ms: Date.now() - startTime
        }
      });
    }

    // Check for off-topic questions (very low confidence)
    if (intentResult.classification.confidence < 0.3) {
      console.log(`🚫 Off-topic question detected (confidence: ${intentResult.classification.confidence})`);

      const offTopicMessage = `Maaf, aku BARI - asisten khusus untuk atap dan baja ringan. Pertanyaan kamu sepertinya di luar topik yang aku handle ya.

Aku bisa bantu kamu untuk:
✅ Hitung kebutuhan material atap
✅ Estimasi biaya pemasangan
✅ Konsultasi masalah atap (bocor, karat, panas, dll)
✅ Info garansi dan perawatan
✅ Hubungi tim sales/teknis

Ada yang bisa aku bantu terkait atap?`;

      const db = getDB();
      await db.init();
      await db.logQuery({
        query,
        retrieved_chunks: [],
        answer: offTopicMessage,
        latency_ms: Date.now() - startTime
      });

      return NextResponse.json({
        answer: offTopicMessage,
        citations: [],
        metadata: {
          intent: intentResult.classification.intent,
          confidence: intentResult.classification.confidence,
          off_topic: true,
          latency_ms: Date.now() - startTime
        }
      });
    }

    // ============================================
    // STEP 1: Q&A KNOWLEDGE MATCHING
    // ============================================
    console.log('🔍 Checking Q&A knowledge base...');
    const qaMatch = await matchQAKnowledge(query, false); // TODO: Add hasImage detection from request

    if (qaMatch && qaMatch.confidence >= 0.7) {
      console.log(`✅ Q&A match found: ${qaMatch.question} (confidence: ${qaMatch.confidence})`);

      // Log the match
      await logQAMatch(query, qaMatch.id, true);

      // Log to database
      const db = getDB();
      await db.init();
      await db.logQuery({
        query,
        retrieved_chunks: [],
        answer: qaMatch.answer,
        latency_ms: Date.now() - startTime
      });

      return NextResponse.json({
        answer: qaMatch.answer,
        citations: [],
        metadata: {
          source: 'qa_knowledge',
          qa_id: qaMatch.id,
          qa_category: qaMatch.category,
          qa_question: qaMatch.question,
          confidence: qaMatch.confidence,
          latency_ms: Date.now() - startTime
        }
      });
    }

    console.log('📚 No Q&A match found, proceeding with RAG...');

    // Low confidence or general question → proceed with RAG
    console.log(`📚 Proceeding with RAG (intent: ${intentResult.classification.intent}, confidence: ${intentResult.classification.confidence})`);

    // Step 2: Embed query (with caching)
    const queryCacheKey = query.trim().toLowerCase();
    let queryEmbedding: number[];

    if (embeddingCache.has(queryCacheKey)) {
      console.log('✨ Using cached embedding');
      queryEmbedding = embeddingCache.get(queryCacheKey)!;
    } else {
      console.log('🔍 Generating new embedding...');
      const embedder = getEmbeddingProvider();
      queryEmbedding = await embedder.embedQuery(query);

      // Add to cache with LRU eviction
      if (embeddingCache.size >= MAX_CACHE_SIZE) {
        const firstKey = embeddingCache.keys().next().value;
        if (firstKey) {
          embeddingCache.delete(firstKey);
        }
      }
      embeddingCache.set(queryCacheKey, queryEmbedding);
    }

    // Step 3: Vector search
    console.log('🔎 Searching vector database...');
    const db = getDB();
    await db.init();
    const searchResults = await db.query(queryEmbedding, k);

    // Step 4: Generate answer with LLM
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

    // Step 5: Generate RAG answer with context and conversation history
    if (stream) {
      // Streaming response
      return handleStreamingResponse(query, searchResults, conversationHistory, llm, db, startTime);
    }

    // Non-streaming response
    const ragResponse = await llm.generateRAGAnswer({
      query,
      chunks: searchResults,
      conversationHistory
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
  conversationHistory: ConversationMessage[],
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
        console.log('📝 Starting to stream answer from Gemini...');
        const generator = llm.generateRAGAnswerStream({
          query,
          chunks: searchResults,
          conversationHistory
        });

        let chunkCount = 0;
        for await (const chunk of generator) {
          chunkCount++;
          fullAnswer += chunk;
          console.log(`  📦 Chunk ${chunkCount}: ${chunk.substring(0, 50)}...`);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`)
          );
        }

        console.log(`✅ Streaming complete. Total chunks: ${chunkCount}, Total length: ${fullAnswer.length}`);

        // Check if response contains CALCULATOR_REQUEST
        if (fullAnswer.includes('CALCULATOR_REQUEST')) {
          console.log('🧮 Detected calculator request, processing...');

          try {
            // Extract JSON from the response
            const jsonMatch = fullAnswer.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const calcParams = JSON.parse(jsonMatch[0]);
              console.log('📊 Calculator params:', calcParams);

              // Map fields to calculator API format (handle both English and Indonesian field names)
              const calculatorInput = {
                modelAtap: calcParams.roof_type || calcParams.model_atap || 'Pelana',
                buildingType: calcParams.building_type || calcParams.tipe_bangunan || 'Residential',
                panjang: calcParams.length || calcParams.panjang || 0,
                lebar: calcParams.width || calcParams.lebar || 0,
                overstek: calcParams.overhang || calcParams.overstek || 0,
                sudut: calcParams.slope_degree || calcParams.sudut_kemiringan || calcParams.sudut || 0,
                jenisAtap: calcParams.cover_material || calcParams.jenis_penutup || calcParams.jenis_atap || 'Genteng Metal'
              };

              // Call calculator API
              const calcResponse = await fetch('http://localhost:3000/api/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(calculatorInput)
              });

              if (calcResponse.ok) {
                const calcResult = await calcResponse.json();
                console.log('✅ Calculator result:', calcResult);

                // Format nice response
                const formattedResponse = `
Oke, saya sudah hitung estimasi material untuk atap ${calculatorInput.modelAtap} ${calculatorInput.buildingType} ${calculatorInput.panjang}×${calculatorInput.lebar}m:

**LUAS ATAP**
- Geometrik: ${calcResult.results.area.geometric.formatted}
- Material (dengan waste factor): ${calcResult.results.area.material.formatted}

**RANGKA**
- ${calcResult.results.materials.mainFrame.name}: **${calcResult.results.materials.mainFrame.count} batang**
- ${calcResult.results.materials.secondaryFrame.name}: **${calcResult.results.materials.secondaryFrame.count} batang**

**PENUTUP ATAP**
- ${calcResult.results.materials.cover.name}: **${calcResult.results.materials.cover.count} lembar**

**SEKRUP**
- Sekrup Atap: ${calcResult.results.materials.screws.roofing.count} buah
- Sekrup Rangka: ${calcResult.results.materials.screws.frame.count} buah
- **Total: ${calcResult.results.materials.screws.total.count} buah**

📌 *Catatan: Ini estimasi material dasar. Untuk akurasi maksimal, konsultasi dengan kontraktor untuk detail lapangan.*`;

                // Send formatted response as new chunks
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: '\n\n' + formattedResponse })}\n\n`)
                );

                fullAnswer += '\n\n' + formattedResponse;
              }
            }
          } catch (calcError) {
            console.error('❌ Calculator processing error:', calcError);
          }
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
