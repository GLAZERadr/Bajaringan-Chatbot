/**
 * WordPress Knowledge Service
 * Client for fetching knowledge from WordPress CMS
 */

export interface KnowledgeItem {
  id: number;
  title: string;
  content: string;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  tags: Array<{ id: number; name: string; slug: string }>;
  keywords: string[];
  requires_image: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  id: number;
  title: string;
  content: string;
  category_name: string;
  relevance: number;
  match_type?: 'exact' | 'title' | 'content' | 'keywords';
}

export class WordPressKnowledgeService {
  private apiUrl: string;
  private apiKey: string;
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.apiUrl = process.env.WORDPRESS_URL || '';
    this.apiKey = process.env.WORDPRESS_API_KEY || '';
    this.cache = new Map();

    if (!this.apiUrl || !this.apiKey) {
      console.warn('⚠️  WordPress API not configured');
    }
  }

  /**
   * Search knowledge base
   */
  async searchKnowledge(
    query: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    try {
      const cacheKey = `search:${query}:${limit}`;

      // Check cache
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('✨ Using cached WordPress search results');
        return cached;
      }

      console.log(`🔍 Searching WordPress knowledge: "${query}"`);

      const response = await fetch(
        `${this.apiUrl}/wp-json/bari/v1/knowledge/search?q=${encodeURIComponent(query)}&limit=${limit}`,
        {
          headers: {
            'X-API-Key': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        this.setCache(cacheKey, result.data);
        console.log(`✅ Found ${result.data.length} results from WordPress`);
        return result.data;
      }

      return [];
    } catch (error) {
      console.error('❌ Error searching WordPress knowledge:', error);
      return [];
    }
  }

  /**
   * Get knowledge by ID
   */
  async getKnowledge(id: number): Promise<KnowledgeItem | null> {
    try {
      const cacheKey = `knowledge:${id}`;

      // Check cache
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await fetch(
        `${this.apiUrl}/wp-json/bari/v1/knowledge/${id}`,
        {
          headers: {
            'X-API-Key': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`WordPress API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        this.setCache(cacheKey, result.data);
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('❌ Error fetching knowledge:', error);
      return null;
    }
  }

  /**
   * Track knowledge usage
   */
  async trackUsage(
    knowledgeId: number,
    sessionId: string,
    userId: number | null,
    query: string
  ): Promise<void> {
    try {
      await fetch(
        `${this.apiUrl}/wp-json/bari/v1/knowledge/${knowledgeId}/track`,
        {
          method: 'POST',
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId,
            user_id: userId,
            query,
            matched: true,
          }),
        }
      );

      console.log(`📊 Tracked usage for knowledge #${knowledgeId}`);
    } catch (error) {
      console.error('❌ Error tracking usage:', error);
      // Don't throw - tracking failure shouldn't break the flow
    }
  }

  /**
   * Get all knowledge (for admin/analytics)
   */
  async getAllKnowledge(
    status: string = 'published',
    limit: number = 20,
    offset: number = 0
  ): Promise<{ data: KnowledgeItem[]; total: number }> {
    try {
      const response = await fetch(
        `${this.apiUrl}/wp-json/bari/v1/knowledge?status=${status}&limit=${limit}&offset=${offset}`,
        {
          headers: {
            'X-API-Key': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return {
          data: result.data,
          total: result.pagination.total,
        };
      }

      return { data: [], total: 0 };
    } catch (error) {
      console.error('❌ Error fetching all knowledge:', error);
      return { data: [], total: 0 };
    }
  }

  /**
   * Cache helpers
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // LRU eviction (keep max 100 items)
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️  WordPress knowledge cache cleared');
  }
}

// Singleton instance
let instance: WordPressKnowledgeService | null = null;

export function getWordPressKnowledgeService(): WordPressKnowledgeService {
  if (!instance) {
    instance = new WordPressKnowledgeService();
  }
  return instance;
}
