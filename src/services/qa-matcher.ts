import { getDB } from '@/vector/neondb';

export interface QAMatch {
  id: number;
  question: string;
  answer: string;
  category: string;
  confidence: number;
  requires_image: boolean;
}

/**
 * Match user query against Q&A knowledge base
 * Returns the best matching Q&A entry if confidence is high enough
 */
export async function matchQAKnowledge(query: string, hasImage: boolean = false): Promise<QAMatch | null> {
  try {
    const db = getDB();
    await db.init();

    // Get all active Q&A entries, sorted by creation date
    const result = await db.executeQuery(
      `SELECT id, question, answer, category, keywords, requires_image
       FROM qa_knowledge
       WHERE is_active = true
       ORDER BY created_at DESC`
    );

    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const queryLower = query.toLowerCase();
    let bestMatch: QAMatch | null = null;
    let highestScore = 0;

    for (const qa of result.rows) {
      const questionLower = qa.question.toLowerCase();
      const keywords: string[] = qa.keywords || [];

      // Skip if Q&A requires image but user didn't provide one
      if (qa.requires_image && !hasImage) {
        continue;
      }

      let score = 0;

      // Exact question match = very high score
      if (questionLower === queryLower) {
        score = 100;
      }
      // Question contains query or query contains question = high score
      else if (questionLower.includes(queryLower) || queryLower.includes(questionLower)) {
        score = 80;
      }
      // Check keyword matches
      else {
        let keywordMatches = 0;
        for (const keyword of keywords) {
          const keywordLower = keyword.toLowerCase();
          if (queryLower.includes(keywordLower)) {
            keywordMatches++;
          }
        }

        if (keywordMatches > 0) {
          // Score based on number of keyword matches
          score = Math.min(70, keywordMatches * 20);
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = {
          id: qa.id,
          question: qa.question,
          answer: qa.answer,
          category: qa.category,
          confidence: score / 100, // Normalize to 0-1
          requires_image: qa.requires_image
        };
      }
    }

    // Only return match if confidence is above threshold (0.5 = 50%)
    if (bestMatch && bestMatch.confidence >= 0.5) {
      return bestMatch;
    }

    return null;
  } catch (error) {
    console.error('❌ Error matching Q&A knowledge:', error);
    return null;
  }
}

/**
 * Log Q&A match for analytics
 */
export async function logQAMatch(query: string, qaId: number, used: boolean): Promise<void> {
  try {
    const db = getDB();
    await db.init();

    await db.executeQuery(
      `INSERT INTO query_logs (query, metadata)
       VALUES ($1, $2)`,
      [query, JSON.stringify({ qa_match_id: qaId, qa_used: used })]
    );
  } catch (error) {
    console.error('❌ Error logging Q&A match:', error);
  }
}
