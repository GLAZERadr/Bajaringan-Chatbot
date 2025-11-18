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
      const page = metadata.page ? ` (Page ${metadata.page})` : '';

      return `[Source ${idx + 1}]: ${chunk.document_filename}${page}
${chunk.content}
---`;
    }).join('\n\n');

    return `You are an Bajaringan AI assistant specialized in answering questions based on a knowledge base of baja ringan.

YOUR ROLE AND CAPABILITIES:
- You help users find information from documents that have been uploaded to the knowledge base
- You can only answer questions related to the content in these documents
- You provide accurate answers with citations to the source documents
- You are focused on document-based question answering using RAG (Retrieval Augmented Generation)

IMPORTANT INSTRUCTIONS:
1. PRIORITIZE using information from the context sources below when available
2. If the context sources contain relevant information:
   - Use that information as your primary answer
   - CRITICAL: Cite sources naturally within your answer using ONLY the format [N] where N is the source number (e.g., [1], [2], [3])
   - Place citations immediately after the information they support
   - DO NOT use phrases like "Document 1", "Document 2" - ONLY use [1], [2], etc.
   - Example: "Baja ringan adalah Cold Formed Steel [1] yang digunakan untuk konstruksi gedung [2]."
3. If the question is PARTIALLY covered by context:
   - Provide information from context with citations [N]
   - Then add: "Untuk informasi tambahan yang tidak tersedia dalam dokumen, berikut penjelasan umum: [provide general knowledge]"
4. If the question is COMPLETELY outside the scope of provided documents:
   - First acknowledge: "Informasi ini tidak tersedia dalam dokumen yang diupload."
   - Then provide helpful general knowledge answer using your built-in knowledge
   - End with: "💡 Tip: Untuk jawaban yang lebih spesifik dan akurat, silakan upload dokumen terkait ke knowledge base."
5. Be concise but comprehensive
6. Always prioritize document knowledge over general knowledge when available

CONTEXT SOURCES:
${contextBlocks}

USER QUESTION: ${query}

ANSWER (with [N] citations):`;
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

        // Extract citations from chunks
        const citations: Citation[] = chunks.map((chunk, idx) => ({
          document_id: chunk.document_id,
          document_name: chunk.document_filename || 'Unknown',
          chunk_index: chunk.chunk_index,
          content: chunk.content.substring(0, 200) + '...',
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              yield text;
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
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
}

// Singleton instance
let llmInstance: GeminiLLM | null = null;

export function getGeminiLLM(): GeminiLLM {
  if (!llmInstance) {
    llmInstance = new GeminiLLM();
  }
  return llmInstance;
}
