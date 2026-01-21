/**
 * Session Storage Management (Updated - No Limits)
 * Manages guest user conversation history in localStorage
 */

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  citations?: any[];
}

export interface GuestSession {
  sessionId: string;
  messages: Message[];
  createdAt: number;
  expiresAt: number;
}

export class SessionStorage {
  private static STORAGE_KEY = 'bari_chat_session';
  private static SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Get or create session
   */
  static getSession(): GuestSession {
    const stored = localStorage.getItem(this.STORAGE_KEY);

    if (stored) {
      try {
        const session: GuestSession = JSON.parse(stored);

        // Check if session expired
        if (Date.now() > session.expiresAt) {
          console.log('📅 Session expired, creating new one');
          return this.createNewSession();
        }

        return session;
      } catch (error) {
        console.error('❌ Failed to parse session', error);
        return this.createNewSession();
      }
    }

    return this.createNewSession();
  }

  /**
   * Create new session
   */
  private static createNewSession(): GuestSession {
    const now = Date.now();
    const session: GuestSession = {
      sessionId: `guest_${now}`,
      messages: [],
      createdAt: now,
      expiresAt: now + this.SESSION_DURATION,
    };

    this.saveSession(session);
    return session;
  }

  /**
   * Add message to session
   */
  static addMessage(
    role: 'user' | 'assistant',
    content: string,
    citations?: any[]
  ): void {
    const session = this.getSession();

    session.messages.push({
      role,
      content,
      timestamp: Date.now(),
      ...(citations && { citations }),
    });

    // Keep only last 50 messages to avoid localStorage limit (5-10MB)
    if (session.messages.length > 50) {
      session.messages = session.messages.slice(-50);
    }

    this.saveSession(session);
  }

  /**
   * Save session to localStorage
   */
  private static saveSession(session: GuestSession): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('❌ Failed to save session', error);
      // If localStorage is full, keep only last 20 messages
      session.messages = session.messages.slice(-20);
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
      } catch (retryError) {
        console.error('❌ Failed to save even after cleanup', retryError);
      }
    }
  }

  /**
   * Clear session (for logout or reset)
   */
  static clearSession(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🗑️  Session cleared');
  }

  /**
   * Get conversation history for API
   * Returns last N messages for context (API has token limits)
   */
  static getConversationHistory(limit: number = 10): Message[] {
    const session = this.getSession();
    return session.messages.slice(-limit);
  }

  /**
   * Get session ID
   */
  static getSessionId(): string {
    const session = this.getSession();
    return session.sessionId;
  }

  /**
   * Get message count (for analytics, not for limiting)
   */
  static getMessageCount(): number {
    const session = this.getSession();
    return session.messages.length;
  }
}
