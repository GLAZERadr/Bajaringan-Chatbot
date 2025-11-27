/**
 * Memory Management Utilities
 * Handles conversation history summarization and context optimization
 */

import { ConversationMessage, ConversationMemory, MemoryConfig, DEFAULT_MEMORY_CONFIG } from '@/types/memory';

/**
 * Prepare conversation history for LLM context
 * Keeps recent messages in full, summarizes older ones
 */
export function prepareConversationContext(
  messages: ConversationMessage[],
  config: MemoryConfig = DEFAULT_MEMORY_CONFIG
): { recentMessages: ConversationMessage[]; summary?: string } {

  if (messages.length <= config.maxMessages) {
    // All messages fit within limit, return as-is
    return { recentMessages: messages };
  }

  // Split into old messages (to summarize) and recent messages (keep full)
  const splitIndex = messages.length - config.maxMessages;
  const oldMessages = messages.slice(0, splitIndex);
  const recentMessages = messages.slice(splitIndex);

  // Create summary of old messages
  const summary = summarizeMessages(oldMessages);

  return { recentMessages, summary };
}

/**
 * Create a concise summary of conversation messages
 */
function summarizeMessages(messages: ConversationMessage[]): string {
  if (messages.length === 0) return '';

  // Group consecutive messages by role for more coherent summary
  const summaryParts: string[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role === 'user') {
      // Summarize user questions
      const question = msg.content.substring(0, 150); // Keep first 150 chars
      summaryParts.push(`User bertanya: ${question}${msg.content.length > 150 ? '...' : ''}`);
    } else {
      // For assistant, just note the topic
      const preview = msg.content.substring(0, 100);
      summaryParts.push(`Dijawab tentang: ${preview}${msg.content.length > 100 ? '...' : ''}`);
    }
  }

  return `[Ringkasan percakapan sebelumnya: ${summaryParts.join(' | ')}]`;
}

/**
 * Format conversation history for LLM prompt
 */
export function formatConversationForPrompt(
  recentMessages: ConversationMessage[],
  summary?: string
): string {
  let prompt = '';

  // Add summary if exists
  if (summary) {
    prompt += `${summary}\n\n`;
  }

  // Add recent messages
  if (recentMessages.length > 0) {
    prompt += 'PERCAKAPAN TERAKHIR:\n';
    recentMessages.forEach((msg) => {
      const role = msg.role === 'user' ? 'USER' : 'ASSISTANT';
      prompt += `${role}: ${msg.content}\n\n`;
    });
  }

  return prompt;
}

/**
 * Estimate token count (rough approximation)
 * 1 token ≈ 4 characters for Indonesian text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Check if we need to summarize based on token count
 */
export function shouldSummarize(
  messages: ConversationMessage[],
  config: MemoryConfig = DEFAULT_MEMORY_CONFIG
): boolean {
  const totalText = messages.map(m => m.content).join(' ');
  const estimatedTokens = estimateTokens(totalText);

  return estimatedTokens > config.maxTokens || messages.length > config.summaryThreshold;
}
