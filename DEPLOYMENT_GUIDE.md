# 🚀 NLU System - Deployment Guide

## ✅ Deployment Status: PRODUCTION READY

Sistem NLU (Natural Language Understanding) telah **fully integrated** ke production dan siap digunakan!

---

## 📊 What's Been Deployed

### 1. **NLU Core System**
- ✅ Intent classification (15 intents)
- ✅ Slot extraction dengan Gemini LLM
- ✅ Multi-turn conversation support
- ✅ Confidence-based routing

### 2. **Intent Handlers**
- ✅ Kalkulator (auto-execute calculation)
- ✅ Estimasi Biaya (formula-based)
- ✅ Survei Request (ticket creation)
- ✅ Keluhan (4 types: bocor, karat, panas, berisik)
- ✅ Garansi Info
- ✅ AMC Packages
- ✅ Struktur Engineering (escalation)
- ✅ K3 Safety Info
- ✅ Contact/Handoff

### 3. **Integration Points**
- ✅ `/api/query` route (main entry point)
- ✅ Automatic fallback to RAG for low-confidence
- ✅ Database logging
- ✅ Conversation history tracking

---

## 🔄 How It Works in Production

### Request Flow

```
User Query: "Mau survei ke pabrik saya di Cikarang"
    ↓
POST /api/query { query: "...", conversationHistory: [...] }
    ↓
🎯 Intent Detection Layer
    ├─ Intent: permintaan_survei
    ├─ Confidence: 0.95
    └─ Slots: { alamat_lokasi: "Cikarang" }
    ↓
❓ Missing Slots Check
    └─ Missing: ["kontak_person", "no_telepon"]
    ↓
📝 Generate Next Question
    └─ "Siapa yang bisa aku hubungi untuk jadwalkan survei?"
    ↓
Return to User
```

### Complete Flow Example

```
Turn 1:
User: "Mau survei atap gudang"
BARI: "Oke! Lokasi gudangnya di mana? Dan siapa yang bisa aku hubungi?"

Turn 2:
User: "Di Bekasi, hubungi Pak Budi 0812-XXXX-XXXX"
BARI: "Oke, aku catat permintaan survei:
       📍 Lokasi: Bekasi
       👤 Contact: Pak Budi
       📞 No: 0812-XXXX-XXXX
       Tim kami akan hubungi dalam 1x24 jam."
```

---

## 🎯 Confidence Thresholds

```typescript
if (confidence >= 0.7 && intent !== 'general_question' && intent !== 'pertanyaan_produk') {
  // Handle with intent-specific handler
} else {
  // Fall back to RAG (vector search + LLM)
}
```

**Rationale:**
- **High confidence (≥0.7)**: Intent handler can provide specific, actionable response
- **Low confidence (<0.7)**: RAG provides more flexible, document-based answer
- **general_question**: Always use RAG (better for open-ended questions)
- **pertanyaan_produk**: Always use RAG (needs knowledge base lookup)

---

## 📋 Testing in Production

### Test Case 1: Calculator Intent
```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Hitung material atap pelana 8x7m pakai genteng metal",
    "k": 3,
    "stream": false,
    "conversationHistory": []
  }'
```

**Expected Response:**
```json
{
  "answer": "Atapnya mau overstek berapa meter? Sudut kemiringannya berapa derajat?",
  "citations": [],
  "metadata": {
    "intent": "kalkulator_kebutuhan_atap",
    "confidence": 0.98,
    "missing_slots": ["overstek", "sudut"],
    "is_complete": false
  }
}
```

### Test Case 2: Survey Request
```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Bisa survei ke pabrik saya di Cikarang, hubungi Pak Andi 0812-1234-5678",
    "stream": false
  }'
```

**Expected Response:**
```json
{
  "answer": "Oke, aku catat permintaan survei:\n\n📍 Lokasi: Cikarang\n👤 Contact: Pak Andi\n📞 No: 0812-1234-5678...",
  "metadata": {
    "intent": "permintaan_survei",
    "confidence": 0.96,
    "action": "schedule_survey",
    "slots": {
      "alamat_lokasi": "Cikarang",
      "kontak_person": "Pak Andi",
      "no_telepon": "0812-1234-5678"
    }
  }
}
```

### Test Case 3: Complaint
```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Atap gudang saya bocor parah di area loading dock",
    "stream": false
  }'
```

**Expected Response:**
```json
{
  "answer": "[LLM-generated solution]\n\n---\n🛠️ Tindak Lanjut:\nAku sudah buat tiket untuk tim teknis...",
  "metadata": {
    "intent": "keluhan_kebocoran",
    "confidence": 0.93,
    "action": "create_ticket"
  }
}
```

### Test Case 4: Low Confidence (Falls back to RAG)
```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Apa itu baja ringan?",
    "stream": false
  }'
```

**Expected Behavior:**
- Intent detection runs
- Likely classified as `pertanyaan_produk` or `general_question`
- Falls back to RAG (vector search + knowledge base)
- Returns answer with citations

---

## 📊 Monitoring & Logs

### Console Logs Format

```
🎯 Starting intent detection...
📊 Intent detected: permintaan_survei (confidence: 0.95)
📦 Extracted slots: { alamat_lokasi: "Cikarang" }
❓ Missing slots: ["kontak_person", "no_telepon"]
📝 Asking for missing slots: kontak_person, no_telepon
```

or

```
✅ Handling intent: estimasi_biaya
🎉 Intent handled: provide_info
```

or

```
📚 Proceeding with RAG (intent: general_question, confidence: 0.65)
```

### Database Logging

All queries are logged to NeonDB:
```sql
INSERT INTO query_logs (query, retrieved_chunks, answer, latency_ms, created_at)
VALUES (...);
```

Includes intent-handled queries (retrieved_chunks will be empty array).

---

## 🔧 Configuration

### Adjusting Confidence Threshold

Edit `/src/app/api/query/route.ts`:

```typescript
const shouldHandleIntent = intentResult.classification.intent !== 'general_question'
                        && intentResult.classification.intent !== 'pertanyaan_produk'
                        && intentResult.classification.confidence >= 0.7; // <-- Adjust this
```

**Recommendations:**
- **0.9+**: Very strict, only handle if very confident
- **0.7-0.9**: Balanced (current setting)
- **0.5-0.7**: More aggressive, may handle ambiguous intents

### Adding New Intents

1. Add to `/src/types/intent.ts`:
```typescript
export type IntentType =
  | 'existing_intents'
  | 'new_intent_name'; // Add here

export const REQUIRED_SLOTS: Record<IntentType, string[]> = {
  // ...
  new_intent_name: ['required_slot_1', 'required_slot_2']
};
```

2. Add handler to `/src/services/intent-handlers.ts`:
```typescript
case 'new_intent_name':
  return this.handleNewIntent(slots);
```

3. Update intent detection prompt in `/src/services/intent-detector.ts` (AVAILABLE INTENTS section)

---

## 🚨 Troubleshooting

### Issue: Intent always falls back to RAG
**Solution:** Check console logs for confidence score. If consistently <0.7, improve prompt examples in intent-detector.ts

### Issue: Slots not extracted correctly
**Solution:** Add more examples to slot extraction prompt, or be more explicit about expected format

### Issue: Missing slots not detected
**Solution:** Check REQUIRED_SLOTS mapping in `/src/types/intent.ts`

### Issue: "CALCULATOR_REQUEST" still appearing as text
**Solution:** This should not happen with NLU enabled. Check that calculator intent handler is returning proper `CALCULATOR_REQUEST` format.

---

## 📈 Performance Metrics

### Expected Latencies

- **Intent Detection**: 500-1500ms (Gemini API call)
- **Slot Extraction**: Included in intent detection
- **Handler Execution**: 50-500ms (depending on complexity)
- **Total (Intent-based)**: 1-2 seconds
- **Total (RAG fallback)**: 3-8 seconds (includes vector search + LLM generation)

### Optimization Tips

1. **Cache intent results** for identical queries (future enhancement)
2. **Batch process** conversation history summarization
3. **Use streaming** for long responses (already supported for RAG)

---

## 🎓 Best Practices

### 1. Always Provide Conversation History
```typescript
const conversationHistory = messages.slice(-10).map(msg => ({
  role: msg.role,
  content: msg.content,
  timestamp: msg.timestamp
}));

await fetch('/api/query', {
  method: 'POST',
  body: JSON.stringify({
    query: userInput,
    conversationHistory // Include this!
  })
});
```

### 2. Handle Multi-turn State on Frontend
- Track current intent in state
- Show progress indicators for incomplete intents
- Display collected slots to user

### 3. Log All Actions
```typescript
if (metadata.action === 'schedule_survey') {
  // Log to analytics
  analytics.track('survey_requested', {
    location: slots.alamat_lokasi,
    contact: slots.kontak_person
  });

  // Create CRM ticket
  await createSurveyTicket(slots);
}
```

---

## ✅ Production Checklist

- [x] NLU system built and compiled
- [x] Intent detection integrated to `/api/query`
- [x] All 15 intent handlers implemented
- [x] Confidence-based routing working
- [x] Multi-turn conversation support
- [x] Database logging enabled
- [x] Error handling in place
- [ ] Frontend analytics integration (optional)
- [ ] CRM/ticketing system integration (optional)
- [ ] A/B testing setup (optional)

---

## 📞 Support

**Issues or Questions?**
- Check `NLU_SYSTEM.md` for technical details
- Review console logs for debugging
- Test with provided curl commands above

---

**Deployed:** 28 November 2025
**Version:** 1.0.0 - Production Ready
**Status:** ✅ LIVE
