/**
 * Embeddings Layer - Supports bge-m3 and OpenAI embeddings
 */

export interface EmbeddingProvider {
  embedQuery(text: string): Promise<number[]>;
  embedDocuments(texts: string[]): Promise<number[][]>;
  getDimensions(): number;
}

/**
 * BGE-M3 Embedding Provider
 * Uses Hugging Face Inference API
 */
export class BGEm3Provider implements EmbeddingProvider {
  private apiUrl: string = 'https://api-inference.huggingface.co/models/BAAI/bge-m3';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.HUGGINGFACE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️  HUGGINGFACE_API_KEY not set. BGE-M3 may not work properly.');
    }
  }

  async embedQuery(text: string): Promise<number[]> {
    const results = await this.embedDocuments([text]);
    return results[0];
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: texts,
          options: {
            wait_for_model: true
          }
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`BGE-M3 API error: ${response.status} - ${error}`);
      }

      const embeddings = await response.json();

      // Handle different response formats
      if (Array.isArray(embeddings)) {
        // If single text, wrap in array
        if (texts.length === 1 && typeof embeddings[0] === 'number') {
          return [embeddings];
        }
        return embeddings;
      }

      throw new Error('Unexpected response format from BGE-M3 API');
    } catch (error) {
      console.error('❌ BGE-M3 embedding error:', error);
      throw error;
    }
  }

  getDimensions(): number {
    return 1024; // BGE-M3 produces 1024-dimensional embeddings
  }
}

/**
 * OpenAI Embedding Provider (Fallback)
 */
export class OpenAIProvider implements EmbeddingProvider {
  private apiKey: string;
  private model: string = 'text-embedding-3-small';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is required for OpenAI embeddings');
    }
  }

  async embedQuery(text: string): Promise<number[]> {
    const results = await this.embedDocuments([text]);
    return results[0];
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: texts,
          model: this.model,
          encoding_format: 'float'
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data.data.map((item: any) => item.embedding);
    } catch (error) {
      console.error('❌ OpenAI embedding error:', error);
      throw error;
    }
  }

  getDimensions(): number {
    return 1536; // text-embedding-3-small produces 1536-dimensional embeddings
  }
}

/**
 * Get the configured embedding provider
 */
export function getEmbeddingProvider(): EmbeddingProvider {
  const provider = process.env.EMBEDDING_PROVIDER || 'bge-m3';

  switch (provider.toLowerCase()) {
    case 'bge-m3':
      return new BGEm3Provider();
    case 'openai':
      return new OpenAIProvider();
    default:
      console.warn(`⚠️  Unknown embedding provider: ${provider}. Defaulting to bge-m3`);
      return new BGEm3Provider();
  }
}

/**
 * Batch embeddings with concurrent processing and retry logic
 */
export async function embedBatch(
  texts: string[],
  provider?: EmbeddingProvider,
  batchSize: number = 10,
  maxConcurrency: number = 5
): Promise<number[][]> {
  const embedder = provider || getEmbeddingProvider();

  // Split into batches
  const batches: string[][] = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    batches.push(texts.slice(i, i + batchSize));
  }

  console.log(`🔮 Embedding ${texts.length} texts in ${batches.length} batches (${maxConcurrency} concurrent)`);

  const results: number[][] = [];

  // Process batches with concurrency limit
  for (let i = 0; i < batches.length; i += maxConcurrency) {
    const concurrentBatches = batches.slice(i, i + maxConcurrency);

    console.log(`  ⚡ Processing batches ${i + 1}-${Math.min(i + maxConcurrency, batches.length)} of ${batches.length}`);

    try {
      const batchResults = await Promise.all(
        concurrentBatches.map(async (batch, idx) => {
          try {
            const embeddings = await embedder.embedDocuments(batch);
            console.log(`    ✅ Batch ${i + idx + 1} complete (${batch.length} items)`);
            return embeddings;
          } catch (error) {
            console.error(`    ❌ Batch ${i + idx + 1} failed:`, error);
            throw error;
          }
        })
      );

      results.push(...batchResults.flat());

      // Small delay to respect rate limits between concurrent groups
      if (i + maxConcurrency < batches.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`❌ Failed to embed concurrent batches ${i}-${i + concurrentBatches.length}:`, error);
      throw error;
    }
  }

  console.log(`✅ All embeddings generated: ${results.length}`);
  return results;
}
