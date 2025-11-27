/**
 * Gemini LLM Integration for RAG
 */

import { SearchResult } from '@/vector/neondb';
import { ConversationMessage } from '@/types/memory';
import { prepareConversationContext, formatConversationForPrompt } from '@/utils/memory';

export interface RAGContext {
  query: string;
  chunks: SearchResult[];
  conversationHistory?: ConversationMessage[];
}

export interface RAGResponse {
  answer: string;
  citations: Citation[];
}

export interface Citation {
  document_id: string;
  document_name: string;
  chunk_index: number;
  content: string;
  page?: number;
}

export interface ImageInput {
  data: Buffer;
  mimeType: string;
  filename: string;
}

export class GeminiLLM {
  private apiKey: string;
  private model: string = 'gemini-2.5-flash'; // Use -latest suffix for v1beta
  private apiUrl: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }

    if (model) {
      this.model = model;
    }

    this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
  }

  /**
   * Build RAG prompt with retrieved context and conversation history
   */
  private buildRAGPrompt(query: string, chunks: SearchResult[], conversationHistory?: ConversationMessage[]): string {
    const contextBlocks = chunks.map((chunk, idx) => {
      const metadata = chunk.metadata || {};
      const page = metadata.page ? ` (Halaman ${metadata.page})` : '';

      return `[Sumber ${idx + 1}]: ${chunk.document_filename}${page}
${chunk.content}
---`;
    }).join('\n\n');

    // Prepare conversation context
    let conversationContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      const { recentMessages, summary } = prepareConversationContext(conversationHistory);
      conversationContext = formatConversationForPrompt(recentMessages, summary);
    }

    return `You are BARI, the AI assistant of Bajaringan.com, specialized in ROOFING for factories/warehouses (atap gudang & pabrik), including metal roofs, leakage, corrosion/coating, heat/condensation, material selection, and roof structure (baja ringan & baja berat). You are NOT a replacement for on-site engineers. Your job is to give fast, practical, safe guidance and move the user to the next step.

You also have access to a ROOF MATERIALS CALCULATOR that can estimate materials for:
- Roof types: Pelana (gable), Limas (hip), Datar (flat/industrial)
- Building types: Residential, Industrial
- Cover materials: Genteng Metal, Spandek, uPVC

When users ask about material estimates, quantities, or costs, DETECT this and respond with:
"Oke, biar saya hitungkan estimasi materialnya. Saya butuh data berikut:
1. Model atap: Pelana / Limas / Datar?
2. Tipe bangunan: Residential / Industrial?
3. Ukuran: Panjang × Lebar (meter)?
4. Overstek per sisi (meter)?
5. Sudut kemiringan (derajat)?
6. Jenis penutup: Genteng Metal / Spandek / uPVC?"

After user provides data, respond: "CALCULATOR_REQUEST" followed by JSON format.

${conversationContext ? conversationContext + '\n' : ''}

=== IDENTITY (JATI DIRI) ===
Role: konsultan lapangan yang ringkas, tegas, aman + kalkulator material atap.
Audience: owner/GM pabrik-gudang, procurement, kontraktor/aplikator, maintenance.
Personality: Praktis, tenang, tegas, B2B-minded, safety-first. Not salesy, not lecture-y.

=== BEHAVIOUR (WAJIB) ===
1) NO CERTAINTY WITHOUT DATA
   - Use: "paling sering", "biasanya", "kemungkinan", "perlu cek"
   - Never: "pasti/100%" unless definition

2) ASK ONLY WHAT MATTERS (MAX 3 QUESTIONS)
   - lokasi + jenis bangunan
   - ukuran (PxL / luas)
   - tipe atap + umur
   - titik masalah
   - akses & downtime

3) GIVE OPTIONS WITH TRADE-OFFS (2–4 OPTIONS)
   Quick fix vs durable vs cost-focused vs minimal downtime

4) ALWAYS ACTIONABLE NEXT STEPS (2–5 bullets)

5) SAFETY (K3) NON-NEGOTIABLE
   At least 1 K3 bullet: harness, area steril, cek cuaca, lockout-tagout

6) ESCALATE EARLY WHEN HIGH-RISK
   Trigger: span besar, struktur lemah, korosi berat, kebocoran parah
   Still helpful: give checklist + what to send

7) DO NOT INVENT SPECS/PRICING/WARRANTY

=== VOICE (GAYA BAHASA) ===
- Indonesian, lapangan-friendly, short sentences
- Use bullets, numbers, units (m, m², mm)
- Brief definitions: "flashing = plat penutup sambungan"
- Phrases: "paling sering problemnya di…", "biar aku arahkan tepat, kirim…"

SUMBER INFORMASI:
${contextBlocks}

PERTANYAAN USER: ${query}

=== RESPONSE TEMPLATE (USE ALWAYS) ===
1) JAWABAN CEPAT (1–2 kalimat)
2) OPSI SOLUSI (2–4 bullet) + trade-off singkat
3) LANGKAH PRAKTIS (2–5 bullet)
4) RISIKO & K3 (1–2 bullet)
5) 3 DATA KUNCI (maks 3 pertanyaan jika perlu)
6) NEXT STEP / CTA

=== CITATION RULES (WAJIB) ===
- ALWAYS cite sources: [1], [2], [3]
- ONE citation per bracket: [1] [2] NOT [1, 2]
- Before punctuation: "baja ringan [1] yang kuat."
- CORRECT: "...Cold Formed Steel [1] lebih kuat [2]."
- WRONG: "...Cold Formed Steel 1" or "...kuat [1, 2]."

=== DEFAULT CTA (USE OFTEN) ===
"Biar aku arahkan paling tepat, kirim:
(1) foto close-up titik masalah,
(2) foto wide area atap,
(3) ukuran perkiraan PxL + lokasi.
Nanti aku kasih opsi paling masuk akal + langkah survey/estimasi."

JAWABAN BARI (ringkas, praktis, aman):`;
  }

  /**
   * Generate RAG answer with citations
   */
  async generateRAGAnswer(context: RAGContext, retries: number = 2): Promise<RAGResponse> {
    const { query, chunks, conversationHistory } = context;

    if (chunks.length === 0) {
      return {
        answer: "I don't have any relevant information in the knowledge base to answer this question.",
        citations: []
      };
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const prompt = this.buildRAGPrompt(query, chunks, conversationHistory);

        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.3,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              }
            ]
          }),
        });

        if (!response.ok) {
          const error = await response.text();

          // Check if it's a rate limit error
          if (response.status === 429) {
            if (attempt < retries) {
              const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
              console.log(`⏳ Rate limited. Retrying in ${waitTime}ms... (attempt ${attempt + 1}/${retries})`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue; // Retry
            }

            // If all retries exhausted, return simple answer
            console.warn('⚠️  Gemini quota exceeded. Returning context-based answer.');
            return {
              answer: this.buildFallbackAnswer(chunks),
              citations: chunks.map((chunk, idx) => ({
                document_id: chunk.document_id,
                document_name: chunk.document_filename || 'Unknown',
                chunk_index: chunk.chunk_index,
                content: chunk.content.substring(0, 200) + '...',
                page: chunk.metadata?.page
              }))
            };
          }

          throw new Error(`Gemini API error: ${response.status} - ${error}`);
        }

        const data = await response.json();

        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text ||
                       'Sorry, I could not generate an answer.';

        // Extract citations from chunks with full content
        const citations: Citation[] = chunks.map((chunk, idx) => ({
          document_id: chunk.document_id,
          document_name: chunk.document_filename || 'Unknown',
          chunk_index: chunk.chunk_index,
          content: chunk.content, // Full content for modal display
          page: chunk.metadata?.page
        }));

        return {
          answer,
          citations
        };
      } catch (error) {
        if (attempt === retries) {
          console.error('❌ Gemini generation error:', error);
          throw error;
        }
      }
    }

    // Fallback if all attempts failed
    return {
      answer: this.buildFallbackAnswer(chunks),
      citations: chunks.map((chunk, idx) => ({
        document_id: chunk.document_id,
        document_name: chunk.document_filename || 'Unknown',
        chunk_index: chunk.chunk_index,
        content: chunk.content.substring(0, 200) + '...',
        page: chunk.metadata?.page
      }))
    };
  }

  /**
   * Build fallback answer from retrieved chunks when LLM is unavailable
   */
  private buildFallbackAnswer(chunks: SearchResult[]): string {
    const topChunks = chunks.slice(0, 3);
    const context = topChunks.map((chunk, idx) =>
      `[${idx + 1}] ${chunk.content.substring(0, 300)}...`
    ).join('\n\n');

    return `Based on the relevant documents, here is the information I found:\n\n${context}\n\n(Note: This is a direct excerpt from the knowledge base. The AI summarization service is temporarily unavailable.)`;
  }

  /**
   * Generate streaming RAG answer
   */
  async *generateRAGAnswerStream(context: RAGContext): AsyncGenerator<string> {
    const { query, chunks, conversationHistory } = context;

    if (chunks.length === 0) {
      yield "I don't have any relevant information in the knowledge base to answer this question.";
      return;
    }

    try {
      const prompt = this.buildRAGPrompt(query, chunks, conversationHistory);

      const streamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?key=${this.apiKey}`;

      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096, // Increased from 2048 for longer responses
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      console.log('🔄 Starting to read Gemini stream...');
      let buffer = '';
      let processedUpTo = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (value) {
          buffer += decoder.decode(value, { stream: true });
        }

        if (done) {
          console.log('✅ Gemini stream reading complete, buffer length:', buffer.length);
          break;
        }

        // Try to parse accumulated buffer as JSON array and process new objects
        // Gemini streaming format: [{"candidates":[...]}, {"candidates":[...]}, ...]
        try {
          // Try to parse what we have so far
          let parseBuffer = buffer.trim();

          // If buffer doesn't end with ], add it temporarily for parsing
          if (!parseBuffer.endsWith(']')) {
            parseBuffer = parseBuffer.replace(/,\s*$/, '') + ']';
          }

          const jsonArray = JSON.parse(parseBuffer);

          if (Array.isArray(jsonArray)) {
            // Process only new objects (from processedUpTo index onwards)
            for (let i = processedUpTo; i < jsonArray.length; i++) {
              const obj = jsonArray[i];
              const text = obj.candidates?.[0]?.content?.parts?.[0]?.text;
              const finishReason = obj.candidates?.[0]?.finishReason;

              if (text) {
                console.log(`  ✅ Yielding chunk ${i + 1}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
                yield text;
                processedUpTo = i + 1;
              }

              // Check if response was stopped early
              if (finishReason && finishReason !== 'STOP') {
                console.warn(`⚠️  Response finished with reason: ${finishReason}`);
                if (finishReason === 'MAX_TOKENS') {
                  console.warn('💡 Response was cut off due to MAX_TOKENS limit. Consider increasing maxOutputTokens.');
                }
              }
            }
          }
        } catch (e) {
          // Not enough data yet to parse, continue accumulating
        }
      }

      // Final parse to catch any remaining text
      try {
        const jsonArray = JSON.parse(buffer.trim());
        if (Array.isArray(jsonArray)) {
          for (let i = processedUpTo; i < jsonArray.length; i++) {
            const obj = jsonArray[i];
            const text = obj.candidates?.[0]?.content?.parts?.[0]?.text;
            const finishReason = obj.candidates?.[0]?.finishReason;

            if (text) {
              console.log(`  ✅ Final yield chunk ${i + 1}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
              yield text;
            }

            // Final check for finish reason
            if (finishReason && finishReason !== 'STOP') {
              console.warn(`⚠️  Final response finished with reason: ${finishReason}`);
            }
          }
        }
      } catch (e) {
        console.error('  ❌ Failed to parse final buffer:', e);
      }

      console.log(`🏁 Gemini streaming finished, processed ${processedUpTo} chunks`);
    } catch (error) {
      console.error('❌ Gemini streaming error:', error);
      throw error;
    }
  }

  /**
   * Simple completion (non-RAG)
   */
  async complete(prompt: string): Promise<string> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    } catch (error) {
      console.error('❌ Gemini completion error:', error);
      throw error;
    }
  }

  /**
   * Analyze image with vision model
   */
  async analyzeImage(
    image: ImageInput,
    prompt: string = "Describe this image in detail, especially any issues or damage you see."
  ): Promise<string> {
    try {
      const base64Image = image.data.toString('base64');

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: image.mimeType,
                  data: base64Image
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Vision API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text ||
             'Tidak dapat menganalisis gambar.';
    } catch (error) {
      console.error('❌ Image analysis error:', error);
      throw error;
    }
  }

  /**
   * Analyze multiple images (for comparison or batch analysis)
   */
  async analyzeImages(
    images: ImageInput[],
    prompt: string = "Analisis gambar-gambar ini dan jelaskan masalah yang terlihat."
  ): Promise<string> {
    try {
      const imageParts = images.map(img => ({
        inline_data: {
          mime_type: img.mimeType,
          data: img.data.toString('base64')
        }
      }));

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              ...imageParts
            ]
          }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 3072,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Vision API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text ||
             'Tidak dapat menganalisis gambar.';
    } catch (error) {
      console.error('❌ Batch image analysis error:', error);
      throw error;
    }
  }

  /**
   * Multimodal RAG - Query with both text and images
   */
  async generateMultimodalRAGAnswer(
    query: string,
    images: ImageInput[],
    chunks: SearchResult[]
  ): Promise<RAGResponse> {
    try {
      // First, analyze images
      const imageAnalysis = await this.analyzeImages(
        images,
        `Analisis gambar konstruksi baja ringan ini. Identifikasi masalah, kerusakan, atau kondisi yang terlihat.`
      );

      // Build context from both images and documents
      const contextBlocks = chunks.map((chunk, idx) => {
        const page = chunk.metadata?.page ? ` (Halaman ${chunk.metadata.page})` : '';
        return `[Sumber ${idx + 1}]: ${chunk.document_filename}${page}
${chunk.content}
---`;
      }).join('\n\n');

      const prompt = `You are BARI, the AI assistant of Bajaringan.com, specialized in ROOFING for factories/warehouses. Your job is to give fast, practical, safe guidance based on the image analysis.

ANALISIS GAMBAR:
${imageAnalysis}

KONTEKS DARI DOKUMEN:
${contextBlocks}

PERTANYAAN USER: ${query}

=== BEHAVIOUR (IMAGE CONTEXT) ===
1) IDENTIFY THE PROBLEM from image (1-2 sentences)
2) PROVIDE 2-3 OPTIONS with trade-offs
3) ACTIONABLE STEPS (3-5 bullets)
4) SAFETY K3 (minimum 1 bullet - wajib!)
5) ASK for missing data (max 2 questions)
6) NEXT STEP / CTA

=== SAFETY FOCUS ===
If image shows roof work/height work:
- Harness + lifeline wajib
- Area steril
- Cek cuaca
- Gunakan manlift/scaffolding per SOP

=== ESCALATION TRIGGERS ===
If image shows:
- Korosi berat / perforasi luas
- Lendutan struktur
- Kebocoran parah dekat elektrik
→ Recommend survey/engineer immediately

=== CITATION RULES ===
- Format: [1] [2] NOT [1, 2]
- Example: "coating zinc [1] untuk anti karat [2]."

=== VOICE ===
- Ringkas, lapangan-friendly
- Use: "paling sering", "kemungkinan", "perlu cek"
- NOT: "pasti 100%" without data

JAWABAN BARI (praktis, aman, dengan opsi):`;

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7, // Higher for more natural language
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Multimodal RAG error: ${response.status}`);
      }

      const data = await response.json();
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text ||
                     'Maaf, saya kesulitan menganalisis informasi ini.';

      const citations: Citation[] = chunks.map((chunk, idx) => ({
        document_id: chunk.document_id,
        document_name: chunk.document_filename || 'Unknown',
        chunk_index: chunk.chunk_index,
        content: chunk.content, // Full content for modal
        page: chunk.metadata?.page
      }));

      return { answer, citations };
    } catch (error) {
      console.error('❌ Multimodal RAG error:', error);
      throw error;
    }
  }
}

// Singleton instance
let llmInstance: GeminiLLM | null = null;

export function getGeminiLLM(): GeminiLLM {
  if (!llmInstance) {
    llmInstance = new GeminiLLM();
  }
  return llmInstance;
}
