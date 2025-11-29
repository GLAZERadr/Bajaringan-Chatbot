/**
 * Intent Detection & Slot Extraction Service
 * Uses Gemini LLM for NLU tasks
 */

import { getGeminiLLM } from '@/llm/gemini';
import {
  IntentType,
  IntentClassification,
  IntentDetectionResult,
  IntentSlots,
  REQUIRED_SLOTS
} from '@/types/intent';

export class IntentDetector {
  private llm = getGeminiLLM();

  /**
   * Detect intent and extract slots from user message
   */
  async detectIntent(userMessage: string, conversationHistory?: string[]): Promise<IntentDetectionResult> {
    const prompt = this.buildIntentDetectionPrompt(userMessage, conversationHistory);

    try {
      const response = await this.llm.complete(prompt);
      const result = this.parseIntentResponse(response);

      // Check for missing required slots
      const missingSlots = this.getMissingSlots(result.classification.intent, result.slots);
      const isComplete = missingSlots.length === 0;

      // Generate next question if incomplete
      let nextQuestion: string | undefined;
      if (!isComplete && missingSlots.length > 0) {
        nextQuestion = await this.generateNextQuestion(
          result.classification.intent,
          missingSlots,
          result.slots
        );
      }

      return {
        classification: result.classification,
        slots: result.slots,
        missing_slots: missingSlots,
        is_complete: isComplete,
        next_question: nextQuestion
      };
    } catch (error) {
      console.error('❌ Intent detection error:', error);

      // Fallback to general_question
      return {
        classification: {
          intent: 'general_question',
          confidence: 0.5,
          reasoning: 'Error during intent detection, defaulting to general question'
        },
        slots: {},
        missing_slots: [],
        is_complete: true
      };
    }
  }

  /**
   * Build prompt for intent classification and slot extraction
   */
  private buildIntentDetectionPrompt(userMessage: string, conversationHistory?: string[]): string {
    const historyContext = conversationHistory && conversationHistory.length > 0
      ? `\n\nPREVIOUS CONVERSATION:\n${conversationHistory.join('\n')}\n`
      : '';

    return `You are an intent classifier for BARI, a technical roofing chatbot for factories and warehouses.

${historyContext}
CURRENT USER MESSAGE: "${userMessage}"

Your task is to:
1. Classify the user's intent
2. Extract all relevant slots (entities) from BOTH the conversation history AND current message
3. If this is a follow-up message, combine slots from previous messages with new information

AVAILABLE INTENTS:
- kalkulator_kebutuhan_atap: User wants to calculate roof material needs
- estimasi_biaya: User asks for cost estimation or pricing
- permintaan_survei: User requests site survey/visit
- keluhan_kebocoran: User complains about roof leaking
- keluhan_karat: User complains about rust/corrosion
- keluhan_panas: User complains about excessive heat
- keluhan_berisik: User complains about noise (rain)
- pertanyaan_struktur: User asks about structural strength/capacity
- pertanyaan_garansi: User asks about warranty
- pertanyaan_amc: User asks about maintenance contract
- pertanyaan_k3: User asks about safety/K3 certification
- pertanyaan_produk: User asks about products/materials
- permintaan_kontak: User wants to contact sales/CS or requests callback
- general_question: General technical question about roofing
- greeting: User is greeting/starting conversation

SLOT EXTRACTION RULES:
- Extract numbers with units (e.g., "8 meter" → dimensi_panjang: 8)
- Extract locations (e.g., "Cikarang" → lokasi_proyek: "Cikarang")
- Extract roof types (Pelana, Limas, Datar)
- Extract building types (Residential, Industrial, pabrik, gudang)
- Extract materials (Genteng Metal, Spandek, uPVC)
- Extract contact info (phone numbers, names)
- Extract severity levels (ringan, sedang, parah)

RESPONSE FORMAT (JSON only, no explanation):
{
  "intent": "intent_name",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why this intent",
  "slots": {
    "slot_name": "value",
    "another_slot": 123
  }
}

Examples:

Input: "Saya mau hitung material atap gudang 8x7 meter"
Output: {
  "intent": "kalkulator_kebutuhan_atap",
  "confidence": 0.98,
  "reasoning": "User explicitly wants to calculate materials with dimensions provided",
  "slots": {
    "dimensi_panjang": 8,
    "dimensi_lebar": 7,
    "tipe_bangunan": "Industrial"
  }
}

MULTI-TURN EXAMPLE:
Previous: "User: Saya mau hitung material untuk atap rumah 8x7 meter, atap pelana, pakai genteng metal"
Previous: "Assistant: Atapnya mau overstek berapa? Sudut berapa?"
Current: "Overstek 0.6m, sudut 30 derajat"
Output: {
  "intent": "kalkulator_kebutuhan_atap",
  "confidence": 0.98,
  "reasoning": "User providing additional info for calculator",
  "slots": {
    "dimensi_panjang": 8,
    "dimensi_lebar": 7,
    "tipe_atap": "Pelana",
    "jenis_penutup": "Genteng Metal",
    "overstek": 0.6,
    "sudut": 30,
    "tipe_bangunan": "Residential"
  }
}

Input: "Atap pabrik saya di Cikarang bocor parah"
Output: {
  "intent": "keluhan_kebocoran",
  "confidence": 0.95,
  "reasoning": "User reporting severe leakage problem",
  "slots": {
    "lokasi_proyek": "Cikarang",
    "tingkat_keparahan": "parah"
  }
}

Input: "Minta estimasi biaya pasang atap 1000 m2"
Output: {
  "intent": "estimasi_biaya",
  "confidence": 0.97,
  "reasoning": "User asking for cost estimation",
  "slots": {
    "luas_atap": 1000
  }
}

Input: "Bisa survei ke lokasi saya?"
Output: {
  "intent": "permintaan_survei",
  "confidence": 0.92,
  "reasoning": "User requesting site survey",
  "slots": {}
}

Now classify this message:
"${userMessage}"

Return ONLY valid JSON, no other text.`;
  }

  /**
   * Parse LLM response into structured format
   */
  private parseIntentResponse(response: string): {
    classification: IntentClassification;
    slots: IntentSlots;
  } {
    try {
      // Extract JSON from response (in case LLM adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        classification: {
          intent: parsed.intent as IntentType,
          confidence: parsed.confidence || 0.5,
          reasoning: parsed.reasoning
        },
        slots: parsed.slots || {}
      };
    } catch (error) {
      console.error('❌ Failed to parse intent response:', error);
      console.error('Raw response:', response);

      // Fallback
      return {
        classification: {
          intent: 'general_question',
          confidence: 0.3,
          reasoning: 'Failed to parse LLM response'
        },
        slots: {}
      };
    }
  }

  /**
   * Get list of missing required slots for an intent
   */
  private getMissingSlots(intent: IntentType, slots: IntentSlots): string[] {
    const required = REQUIRED_SLOTS[intent] || [];
    const providedSlots = Object.keys(slots);

    return required.filter(slotName => !providedSlots.includes(slotName));
  }

  /**
   * Generate natural language question to ask for missing slots
   */
  private async generateNextQuestion(
    intent: IntentType,
    missingSlots: string[],
    currentSlots: IntentSlots
  ): Promise<string> {
    const prompt = `You are BARI, a friendly roofing chatbot talking casually with a customer.

USER'S INTENT: ${intent}
ALREADY PROVIDED: ${JSON.stringify(currentSlots)}
MISSING INFORMATION: ${missingSlots.join(', ')}

Generate a SHORT, NATURAL question in Indonesian to ask for the missing information.
IMPORTANT RULES:
- Use very casual, conversational Indonesian (like chatting with a friend)
- Use "kamu" NOT "Anda"
- Use "aku" NOT "saya"
- Ask for 1-3 slots maximum per question
- Keep it under 2 sentences
- Sound warm and friendly, not robotic

Examples of good questions:
- "Ukurannya berapa meter nih? (Panjang × Lebar)"
- "Atapnya mau pakai model apa? Pelana, Limas, atau Datar?"
- "Lokasinya di mana? Sama siapa yang bisa dihubungi?"

Return ONLY the question, no explanation.`;

    try {
      const question = await this.llm.complete(prompt);
      return question.trim();
    } catch (error) {
      console.error('❌ Error generating next question:', error);
      return 'Boleh kasih info lebih lengkap? Biar aku bisa bantu lebih baik.';
    }
  }

  /**
   * Update slots from new user message (for multi-turn conversation)
   */
  async updateSlots(
    currentSlots: IntentSlots,
    newMessage: string,
    intent: IntentType
  ): Promise<IntentSlots> {
    const prompt = `Extract additional information from this message to fill missing slots.

CURRENT INTENT: ${intent}
CURRENT SLOTS: ${JSON.stringify(currentSlots)}
NEW MESSAGE: "${newMessage}"

Extract any new slot values from the message. Return JSON with ONLY the new/updated slots.

Return ONLY valid JSON, no other text.`;

    try {
      const response = await this.llm.complete(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const newSlots = JSON.parse(jsonMatch[0]);
        return { ...currentSlots, ...newSlots };
      }

      return currentSlots;
    } catch (error) {
      console.error('❌ Error updating slots:', error);
      return currentSlots;
    }
  }
}

// Singleton instance
let detectorInstance: IntentDetector | null = null;

export function getIntentDetector(): IntentDetector {
  if (!detectorInstance) {
    detectorInstance = new IntentDetector();
  }
  return detectorInstance;
}
