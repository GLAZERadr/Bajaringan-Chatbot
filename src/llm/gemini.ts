/**
 * Gemini LLM Integration for RAG
 */

import { SearchResult } from '@/vector/neondb';

export interface RAGContext {
  query: string;
  chunks: SearchResult[];
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
   * Build RAG prompt with retrieved context
   */
  private buildRAGPrompt(query: string, chunks: SearchResult[]): string {
    const contextBlocks = chunks.map((chunk, idx) => {
      const metadata = chunk.metadata || {};
      const page = metadata.page ? ` (Halaman ${metadata.page})` : '';

      return `[Sumber ${idx + 1}]: ${chunk.document_filename}${page}
${chunk.content}
---`;
    }).join('\n\n');

    return `Anda adalah asisten konstruksi baja ringan yang berpengalaman dan ramah. Anda seperti teman atau konsultan yang membantu pengguna memahami dan mengatasi masalah konstruksi mereka.

KARAKTER ANDA:
- Berbicara natural seperti manusia, bukan robot
- Gunakan "Saya" bukan "AI" atau "sistem"
- Empati dan memahami kekhawatiran pengguna
- Berikan solusi praktis, bukan hanya teori
- Jujur jika tidak yakin atau perlu info lebih lanjut
- Gunakan analogi atau contoh untuk penjelasan kompleks

GAYA BAHASA:
✅ BAGUS: "Wah, saya lihat masalahnya nih. Kebocoran atap seperti ini biasanya disebabkan oleh..."
❌ JELEK: "Berdasarkan data yang tersedia, kebocoran atap disebabkan oleh..."

✅ BAGUS: "Tenang, masalah ini masih bisa diatasi kok. Yang perlu Anda lakukan adalah..."
❌ JELEK: "Sistem merekomendasikan langkah-langkah berikut untuk mengatasi masalah..."

SUMBER INFORMASI:
${contextBlocks}

PERTANYAAN: ${query}

INSTRUKSI PENTING:
1. Baca semua sumber dengan teliti
2. Prioritaskan informasi dari sumber yang relevan
3. Cite sumber dengan format [1], [2], [3] setelah informasi yang diambil dari sumber tersebut
   Contoh: "Baja ringan menggunakan teknologi Cold Formed Steel [1] yang lebih kuat dari kayu [2]."
4. Jangan tulis "Sumber 1" atau "Dokumen 1", hanya [1]
5. Jika sumber tidak cukup lengkap:
   - Gunakan informasi dari sumber dulu
   - Tambahkan pengetahuan umum Anda dengan jelas menyebutkan:
     "Berdasarkan pengalaman umum di lapangan, ..." atau "Secara umum, ..."
6. Akhiri dengan pertanyaan atau tawaran bantuan lebih lanjut jika relevan
   Contoh: "Apakah ada bagian lain yang ingin saya jelaskan lebih detail?"

JAWABAN NATURAL:`;
  }

  /**
   * Generate RAG answer with citations
   */
  async generateRAGAnswer(context: RAGContext, retries: number = 2): Promise<RAGResponse> {
    const { query, chunks } = context;

    if (chunks.length === 0) {
      return {
        answer: "I don't have any relevant information in the knowledge base to answer this question.",
        citations: []
      };
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const prompt = this.buildRAGPrompt(query, chunks);

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
    const { query, chunks } = context;

    if (chunks.length === 0) {
      yield "I don't have any relevant information in the knowledge base to answer this question.";
      return;
    }

    try {
      const prompt = this.buildRAGPrompt(query, chunks);

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
            maxOutputTokens: 2048,
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
              if (text) {
                console.log(`  ✅ Yielding chunk ${i + 1}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
                yield text;
                processedUpTo = i + 1;
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
            if (text) {
              console.log(`  ✅ Final yield chunk ${i + 1}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
              yield text;
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

      const prompt = `Anda adalah asisten ahli konstruksi baja ringan yang membantu pengguna dengan ramah dan natural.

ANALISIS GAMBAR:
${imageAnalysis}

KONTEKS DARI DOKUMEN:
${contextBlocks}

PERTANYAAN PENGGUNA: ${query}

INSTRUKSI PENTING:
1. Jawab dengan bahasa yang natural, ramah, dan seperti berbicara dengan teman
2. Gunakan "Saya", bukan "AI" atau "sistem"
3. Kombinasikan informasi dari gambar dan dokumen
4. Berikan saran praktis dan solusi konkret
5. Cantumkan sumber dengan format [1], [2], dll
6. Jika gambar menunjukkan masalah serius, tekankan pentingnya tindakan

JAWABAN (natural dan helpful):`;

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
