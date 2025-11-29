# NLU (Natural Language Understanding) System - BARI Chatbot

## 🎯 Overview

Sistem NLU Layer telah diimplementasikan untuk BARI chatbot, memberikan kemampuan:
- **Intent Classification**: Mendeteksi maksud user dari 15 intent berbeda
- **Slot Extraction**: Mengekstrak entitas penting (nama, lokasi, dimensi, dll)
- **Multi-turn Conversation**: Melacak slot yang hilang dan bertanya secara natural
- **Intent Routing**: Mengarahkan ke handler yang sesuai untuk setiap intent

---

## 📁 File Structure

```
/src/types/intent.ts                  # Type definitions untuk intent & slots
/src/services/intent-detector.ts      # Service untuk deteksi intent & ekstraksi slot
/src/services/intent-handlers.ts      # Handler spesifik untuk setiap intent
```

---

## 🎨 Supported Intents

### 1. **kalkulator_kebutuhan_atap**
**Trigger Examples:**
- "Saya ingin menghitung kebutuhan atap untuk gudang ukuran 30x40m"
- "Bantu hitungin perlu atap berapa lembar nih"
- "Kalkulator atap di sini bisa?"

**Slots:**
```typescript
{
  dimensi_panjang: number,    // meter
  dimensi_lebar: number,      // meter
  luas_atap: number,          // m²
  tipe_atap: 'Pelana' | 'Limas' | 'Datar',
  tipe_bangunan: 'Residential' | 'Industrial',
  overstek: number,           // meter
  sudut: number,              // degrees
  jenis_penutup: 'Genteng Metal' | 'Spandek' | 'uPVC'
}
```

**Action:** Calls `/api/calculate` with extracted params

---

### 2. **estimasi_biaya**
**Trigger Examples:**
- "Mohon estimasi biaya pemasangan atap seluas 1000m²"
- "Minta kisaran harga atap buat gudang 20x50m dong"
- "Estimasi biaya atap per m2 berapa?"

**Slots:**
```typescript
{
  luas_atap: number,
  tipe_atap: string,
  spesifikasi: string,
  lokasi_proyek: string,
  kontak: string
}
```

**Action:** Provides rough cost estimate + offers survey

**Formula:**
- Material: Rp 150,000/m²
- Installation: Rp 75,000/m²
- Total: Rp 225,000/m²

---

### 3. **permintaan_survei**
**Trigger Examples:**
- "Bisakah dijadwalkan survei ke lokasi pabrik saya?"
- "Boleh minta tolong cek atap ke gudang saya gak?"
- "Mau survei atap dong"

**Slots:**
```typescript
{
  alamat_lokasi: string,
  waktu_survei: string,
  kontak_person: string,
  no_telepon: string
}
```

**Action:** Creates survey ticket, promises callback within 24h

---

### 4-7. **Complaints (keluhan_kebocoran, keluhan_karat, keluhan_panas, keluhan_berisik)**
**Trigger Examples:**
- "Atap gudang saya bocor, apakah bisa dibantu perbaikannya?"
- "Atap metal di gudang kami mulai berkarat"
- "Di bawah atap pabrik terasa sangat panas"
- "Atap berisik sekali saat hujan deras"

**Slots:**
```typescript
{
  lokasi_masalah: string,
  tingkat_keparahan: 'ringan' | 'sedang' | 'parah',
  usia_atap: number,
  jenis_material: string,
  detail_masalah: string,
  kontak: string
}
```

**Action:**
1. Generates contextual solution using LLM
2. Creates support ticket
3. Promises technical team callback

---

### 8. **pertanyaan_struktur**
**Trigger Examples:**
- "Apakah struktur rangka atap saya cukup kuat untuk pasang panel surya?"
- "Kira-kira rangka atap gue kuat nggak buat dipasangin solar cell?"

**Slots:**
```typescript
{
  jenis_struktur: string,
  beban_tambahan: string,
  bentang_ukuran: number,
  usia_bangunan: number,
  kondisi_bangunan: string
}
```

**Action:** Escalates to engineer for professional analysis

---

### 9. **pertanyaan_garansi**
**Trigger Examples:**
- "Bagaimana ketentuan garansi untuk atap yang dipasang?"
- "Garansinya berapa tahun? Kalau bocor bisa klaim gak?"

**Slots:**
```typescript
{
  jenis_garansi: 'struktur' | 'kebocoran' | 'material',
  nomor_kontrak: string,
  tanggal_pemasangan: string,
  detail_masalah: string
}
```

**Action:** Explains warranty terms:
- Structure: 10 years
- Leakage: 5 years
- Claim process steps

---

### 10. **pertanyaan_amc**
**Trigger Examples:**
- "Apakah kalian menyediakan layanan maintenance atap rutin (AMC)?"
- "Bisa gak sekalian langganan perawatan atap tiap tahun?"

**Slots:**
```typescript
{
  luas_atap: number,
  jenis_atap: string,
  frekuensi_perawatan: string,
  lokasi_fasilitas: string
}
```

**Action:** Explains AMC packages:
- Basic: Rp 15,000/m²/year
- Premium: Rp 25,000/m²/year

---

### 11. **pertanyaan_k3**
**Trigger Examples:**
- "Apakah tim pemasangan atap Anda sudah bersertifikat K3?"
- "Nanti pengerjaannya sesuai SOP K3 kan?"

**Action:** Explains K3 certifications and safety procedures

---

### 12. **pertanyaan_produk**
**Trigger Examples:**
- "Apakah tersedia atap tipe UPVC atau zinc-alume?"
- "Bedanya atap spandek sama sandwich panel apa ya?"

**Action:** Handled by RAG system (vector search + LLM)

---

### 13. **permintaan_kontak**
**Trigger Examples:**
- "Bisakah saya bicara dengan customer service atau sales?"
- "Ada nomor telepon yang bisa dihubungi?"
- "Saya mau ngobrol langsung"

**Slots:**
```typescript
{
  mode_kontak: 'telepon' | 'whatsapp' | 'email',
  kontak_pengguna: string,
  topik: string,
  urgensi: 'rendah' | 'sedang' | 'tinggi'
}
```

**Action:** Provides contact details + creates handoff ticket

---

### 14. **general_question**
**Fallback for technical questions** → Handled by RAG

### 15. **greeting**
**Trigger:** "halo", "hi", "selamat pagi"

**Action:** Returns welcoming message

---

## 🔧 How It Works

### Flow Diagram

```
User Message
    ↓
IntentDetector.detectIntent()
    ↓
Gemini LLM (Intent Classification + Slot Extraction)
    ↓
{
  intent: "permintaan_survei",
  confidence: 0.95,
  slots: { alamat_lokasi: "Cikarang", ... }
}
    ↓
Check Missing Slots
    ↓
If incomplete → Generate next question
If complete → Route to IntentHandlers
    ↓
IntentHandlers.handleIntent()
    ↓
{
  message: "...",
  action: "schedule_survey",
  data: { ... }
}
    ↓
Return to user + Execute action
```

---

## 💻 API Usage

### Example 1: Detect Intent

```typescript
import { getIntentDetector } from '@/services/intent-detector';

const detector = getIntentDetector();
const result = await detector.detectIntent(
  "Saya mau hitung material atap gudang 8x7 meter"
);

console.log(result);
/* Output:
{
  classification: {
    intent: "kalkulator_kebutuhan_atap",
    confidence: 0.98,
    reasoning: "User explicitly wants to calculate materials"
  },
  slots: {
    dimensi_panjang: 8,
    dimensi_lebar: 7,
    tipe_bangunan: "Industrial"
  },
  missing_slots: ["tipe_atap", "overstek", "sudut", "jenis_penutup"],
  is_complete: false,
  next_question: "Atapnya mau pakai model apa? Pelana, Limas, atau Datar?"
}
*/
```

### Example 2: Handle Intent

```typescript
import { getIntentHandlers } from '@/services/intent-handlers';

const handlers = getIntentHandlers();
const response = await handlers.handleIntent(
  'estimasi_biaya',
  { luas_atap: 1000, lokasi_proyek: 'Cikarang' },
  'Minta estimasi biaya 1000m2'
);

console.log(response);
/* Output:
{
  message: "Untuk estimasi biaya atap 1000m² di Cikarang:...",
  action: "provide_info",
  data: { estimated_cost: 225000000 }
}
*/
```

---

## 🧪 Testing

### Test Cases

```typescript
// Test 1: Calculator intent
const test1 = await detector.detectIntent(
  "Bantu hitung material atap pelana 10x8m pakai genteng metal"
);
expect(test1.classification.intent).toBe('kalkulator_kebutuhan_atap');
expect(test1.slots.dimensi_panjang).toBe(10);

// Test 2: Survey request
const test2 = await detector.detectIntent(
  "Mau survei ke pabrik saya di Bekasi, hubungi Pak Budi 0812XXXX"
);
expect(test2.classification.intent).toBe('permintaan_survei');
expect(test2.slots.alamat_lokasi).toContain('Bekasi');

// Test 3: Complaint
const test3 = await detector.detectIntent(
  "Atap bocor parah nih di area loading dock"
);
expect(test3.classification.intent).toBe('keluhan_kebocoran');
expect(test3.slots.tingkat_keparahan).toBe('parah');
```

---

## 🚀 Integration with Main Query Route

### Step 1: Detect Intent Before RAG

```typescript
// In /src/app/api/query/route.ts
import { getIntentDetector } from '@/services/intent-detector';
import { getIntentHandlers } from '@/services/intent-handlers';

// Detect intent
const detector = getIntentDetector();
const intentResult = await detector.detectIntent(query, conversationHistory);

// If intent is specific (not general_question or pertanyaan_produk)
if (intentResult.classification.intent !== 'general_question'
    && intentResult.classification.intent !== 'pertanyaan_produk') {

  // Check if complete
  if (!intentResult.is_complete) {
    // Ask for missing slots
    return NextResponse.json({
      answer: intentResult.next_question,
      citations: []
    });
  }

  // Handle intent
  const handlers = getIntentHandlers();
  const response = await handlers.handleIntent(
    intentResult.classification.intent,
    intentResult.slots,
    query
  );

  return NextResponse.json({
    answer: response.message,
    citations: [],
    metadata: {
      intent: intentResult.classification.intent,
      action: response.action
    }
  });
}

// Otherwise, proceed with RAG as usual
```

---

## 📊 Intent Confidence Thresholds

- **High Confidence (>= 0.9)**: Directly execute intent handler
- **Medium Confidence (0.7 - 0.9)**: Execute but add confirmation
- **Low Confidence (< 0.7)**: Fall back to RAG + log for review

---

## 🔄 Multi-turn Conversation Tracking

System maintains conversation state:
1. User asks incomplete question
2. BARI asks for missing slot
3. User provides additional info
4. System updates slots using `updateSlots()`
5. Repeat until `is_complete === true`

---

## 📝 Future Enhancements

1. **Context Persistence**: Save intent state in session/database
2. **CRM Integration**: Auto-create tickets for surveys, complaints
3. **Analytics Dashboard**: Track intent distribution, confidence scores
4. **A/B Testing**: Compare intent-based vs pure RAG responses
5. **Custom Actions**: Add more handlers (pricing API, scheduling API, etc)

---

## ✅ Status

**Current Implementation:**
- ✅ Intent types defined (15 intents)
- ✅ Slot schemas defined
- ✅ Intent detector service (Gemini-based)
- ✅ Intent handlers for all 15 intents
- ✅ Multi-turn conversation support
- ✅ TypeScript type safety

**Next Steps (OPTIONAL):**
- [ ] Integrate with main query route
- [ ] Add conversation state persistence
- [ ] Connect to actual CRM/ticketing system
- [ ] Add analytics tracking

---

**Documentation Created:** 28 November 2025
**Version:** 1.0.0 - NLU Layer Foundation
**Author:** Claude Code (Anthropic)
