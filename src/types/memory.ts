/**
 * Conversation Memory Types
 * Defines the structure for conversation history and memory management
 */

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ConversationMemory {
  messages: ConversationMessage[];
  summary?: string; // Summarized version of older messages
  lastSummaryIndex?: number; // Index where last summary ended
}

export interface MemoryConfig {
  maxMessages: number; // Maximum messages to keep in full detail
  summaryThreshold: number; // Number of messages before summarization
  maxTokens: number; // Approximate max tokens for context
}

export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  maxMessages: 10, // Keep last 10 messages in full
  summaryThreshold: 8, // Summarize when more than 8 messages
  maxTokens: 4000, // Reserve space for current query + retrieved chunks
};
