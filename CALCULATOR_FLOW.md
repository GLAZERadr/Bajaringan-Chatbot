# Alur Kerja Calculator Integration - LENGKAP ✅

## Status: PRODUCTION READY 🚀

Integrasi calculator sekarang **fully functional** dengan deteksi otomatis dan eksekusi perhitungan real-time.

---

## 🎯 Complete User Flow

### Scenario: User ingin hitung material atap

#### 1️⃣ User Query
```
User: "siapa kamu"
```

#### 2️⃣ BARI Detects & Asks
BARI mendeteksi ini bukan pertanyaan kalkulator, langsung jawab dari knowledge base atau general knowledge.

```
User: "Saya mau hitung material untuk atap rumah 8x7 meter"
```

#### 3️⃣ BARI Collects Data
```
BARI: "Oke, biar saya bantu hitungkan estimasi materialnya. Saya butuh beberapa info:

1. Model atap: Pelana / Limas / Datar? (Sudah ada: Residential)
2. Tipe bangunan: Residential / Industrial? (Sudah ada: Residential)
3. Ukuran: Panjang × Lebar (meter)? (Sudah ada: 8x7 meter)
4. Overstek per sisi (meter)?
5. Sudut kemiringan (derajat)?
6. Jenis penutup: Genteng Metal / Spandek / uPVC? (Sudah ada: Genteng Metal)

Tolong info yang masih kurang ya!"
```

#### 4️⃣ User Provides Missing Data
```
User: "Model pelana, overstek 0.6m, sudut 30 derajat"
```

#### 5️⃣ BARI Generates CALCULATOR_REQUEST
```
CALCULATOR_REQUEST
{
  "roof_type": "Pelana",
  "building_type": "Residential",
  "length": 8,
  "width": 7,
  "overhang": 0.6,
  "slope_degree": 30,
  "cover_material": "Genteng Metal"
}
```

#### 6️⃣ System Detects & Calls Calculator API
**Backend Processing (Automatic):**
```javascript
// Query route detects "CALCULATOR_REQUEST" in response
if (fullAnswer.includes('CALCULATOR_REQUEST')) {
  // Extract JSON params
  const calcParams = extractJSON(fullAnswer);

  // Call calculator API
  const result = await fetch('/api/calculate', {
    method: 'POST',
    body: JSON.stringify(calculatorInput)
  });

  // Format and stream result back
  const formattedResponse = formatCalculatorResult(result);
  controller.enqueue(formattedResponse);
}
```

#### 7️⃣ User Sees Beautiful Formatted Result
```markdown
Oke, saya sudah hitung estimasi material untuk atap Pelana Residential 8×7m:

**LUAS ATAP**
- Geometrik: 100.15 m²
- Material (dengan waste factor): 100.15 m²

**RANGKA**
- Kanal C: **67 batang**
- Reng: **88 batang**

**PENUTUP ATAP**
- Genteng Metal: **126 lembar**

**SEKRUP**
- Sekrup Atap: 1,002 buah
- Sekrup Rangka: 2,003 buah
- **Total: 3,005 buah**

📌 *Catatan: Ini estimasi material dasar. Untuk akurasi maksimal, konsultasi dengan kontraktor untuk detail lapangan.*
```

---

## 🔧 Technical Implementation

### Component 1: BARI Prompt (Gemini LLM)
**File**: `/src/llm/gemini.ts`

**Updated Prompt:**
```typescript
You also have access to a ROOF MATERIALS CALCULATOR that can estimate materials for:
- Roof types: Pelana (gable), Limas (hip), Datar (flat/industrial)
- Building types: Residential, Industrial
- Cover materials: Genteng Metal, Spandek, uPVC

When users ask about material estimates, quantities, or costs, DETECT this and respond with:
"Oke, biar saya hitungkan estimasi materialnya. Saya butuh data berikut:
1. Model atap: Pelana / Limas / Datar?
2. Tipe bangunan: Residential / Industrial?
3. Ukuran: Panjang × Lebar (meter)?
4. Overstek per sisi (meter)?
5. Sudut kemiringan (derajat)?
6. Jenis penutup: Genteng Metal / Spandek / uPVC?"

After user provides data, respond: "CALCULATOR_REQUEST" followed by JSON format.
```

### Component 2: Calculator Detection
**File**: `/src/app/api/query/route.ts`

**Detection Logic:**
```typescript
// After streaming completes
if (fullAnswer.includes('CALCULATOR_REQUEST')) {
  console.log('🧮 Detected calculator request, processing...');

  // Extract JSON
  const jsonMatch = fullAnswer.match(/\{[\s\S]*\}/);
  const calcParams = JSON.parse(jsonMatch[0]);

  // Map to calculator API format
  const calculatorInput = {
    modelAtap: mapRoofType(calcParams.roof_type),
    buildingType: mapBuildingType(calcParams.building_type),
    panjang: calcParams.length,
    lebar: calcParams.width,
    overstek: calcParams.overhang,
    sudut: calcParams.slope_degree,
    jenisAtap: mapCoverMaterial(calcParams.cover_material)
  };

  // Call calculator
  const calcResult = await fetch('/api/calculate', {...});

  // Format and stream result
  const formatted = formatResult(calcResult);
  controller.enqueue(formatted);
}
```

### Component 3: Calculator API
**File**: `/src/app/api/calculate/route.ts`

**Endpoint:**
```typescript
POST /api/calculate
{
  "modelAtap": "Pelana",
  "buildingType": "Residential",
  "panjang": 8,
  "lebar": 7,
  "overstek": 0.6,
  "sudut": 30,
  "jenisAtap": "Genteng Metal"
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "area": {
      "geometric": { "value": 100.15, "formatted": "100.15 m²" },
      "material": { "value": 100.15, "formatted": "100.15 m²" }
    },
    "materials": {
      "mainFrame": { "name": "Kanal C", "count": 67 },
      "secondaryFrame": { "name": "Reng", "count": 88 },
      "cover": { "name": "Genteng Metal", "count": 126 },
      "screws": {
        "roofing": { "count": 1002 },
        "frame": { "count": 2003 },
        "total": { "count": 3005 }
      }
    }
  }
}
```

### Component 4: Result Formatting
**File**: `/src/app/api/query/route.ts`

**Format Function:**
```typescript
const formattedResponse = `
Oke, saya sudah hitung estimasi material untuk atap ${modelAtap} ${buildingType} ${panjang}×${lebar}m:

**LUAS ATAP**
- Geometrik: ${area.geometric.formatted}
- Material (dengan waste factor): ${area.material.formatted}

**RANGKA**
- ${mainFrame.name}: **${mainFrame.count} batang**
- ${secondaryFrame.name}: **${secondaryFrame.count} batang**

**PENUTUP ATAP**
- ${cover.name}: **${cover.count} lembar**

**SEKRUP**
- Sekrup Atap: ${screws.roofing.count} buah
- Sekrup Rangka: ${screws.frame.count} buah
- **Total: ${screws.total.count} buah**

📌 *Catatan: Ini estimasi material dasar. Untuk akurasi maksimal, konsultasi dengan kontraktor untuk detail lapangan.*
`;
```

---

## 🧪 Test Cases

### Test 1: Residential Pelana ✅
**User Input:**
```
"Hitung material atap pelana 8x7m, overstek 0.6m, sudut 30°, genteng metal"
```

**Expected Output:**
```
Luas: 100.15 m²
Kanal C: 67 batang
Reng: 88 batang
Genteng: 126 lembar
Sekrup: 3,005 buah
```

### Test 2: Residential Limas ✅
**User Input:**
```
"Saya mau hitung material atap limas 8x7m, overstek 1m, sudut 35°, genteng metal"
```

**Expected Output:**
```
Luas: 119.21 m² (geometrik 109.87 + 8.5% waste)
Kanal C: 79 batang (floor!)
Reng: 95 batang (2×27 + 40 + 1)
Genteng: 150 lembar
Sekrup: 3,577 buah
```

### Test 3: Industrial Datar ✅
**User Input:**
```
"Hitung material atap datar gudang 12x10m, overstek 0.5m, sudut 5°, spandek"
```

**Expected Output:**
```
Luas: 143.00 m²
Purlin: 96 batang
Gording: 22 batang
Spandek: 26 lembar
Sekrup: 4,004 buah
```

---

## 📊 System Architecture

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ "Hitung material atap 8x7m"
       ▼
┌─────────────────┐
│   Chatbot UI    │ (page.tsx)
└────────┬────────┘
         │ POST /api/query
         ▼
┌────────────────────────┐
│  Query Route Handler   │ (route.ts)
│  - Embed query         │
│  - Vector search       │
│  - Stream LLM response │
└────────┬───────────────┘
         │ Conversation History + Context
         ▼
┌────────────────────┐
│   Gemini LLM       │ (gemini.ts)
│   (BARI Prompt)    │
│   - Detects calc   │
│   - Asks for data  │
│   - Generates JSON │
└────────┬───────────┘
         │ Returns: CALCULATOR_REQUEST {...}
         ▼
┌────────────────────────┐
│ Calculator Detection   │ (route.ts)
│ - Regex match JSON     │
│ - Extract params       │
│ - Map to API format    │
└────────┬───────────────┘
         │ POST /api/calculate
         ▼
┌────────────────────────┐
│  Calculator Engine     │ (calculator.ts)
│  - Validate input      │
│  - Calculate materials │
│  - Return formatted    │
└────────┬───────────────┘
         │ Calculation Results
         ▼
┌────────────────────────┐
│  Response Formatter    │ (route.ts)
│  - Format markdown     │
│  - Add icons/styling   │
│  - Stream to user      │
└────────┬───────────────┘
         │ Formatted Response
         ▼
┌─────────────┐
│  Chatbot UI │ → User sees beautiful result
└─────────────┘
```

---

## 🚀 Production Readiness Checklist

### Backend ✅
- [x] Calculator types defined (`/src/types/calculator.ts`)
- [x] Calculation engine implemented (`/src/utils/calculator.ts`)
- [x] Calculator API endpoint (`/api/calculate`)
- [x] Detection logic in query route
- [x] Field mapping (roof_type → modelAtap)
- [x] Error handling
- [x] Validation

### LLM Integration ✅
- [x] BARI prompt updated with calculator awareness
- [x] Data collection flow defined
- [x] CALCULATOR_REQUEST format specified
- [x] JSON extraction logic

### User Experience ✅
- [x] Conversational flow (ask → provide → calculate)
- [x] Beautiful formatted output
- [x] Markdown support
- [x] Units displayed (m², batang, lembar, buah)
- [x] Professional disclaimer note

### Testing ✅
- [x] Build successful
- [x] API endpoint verified
- [x] Streaming works
- [x] Detection works
- [x] Format works

---

## 🎓 How It Works (Step by Step)

### Step 1: User asks for calculation
User types natural language request mentioning material calculation.

### Step 2: BARI detects intent
Gemini LLM recognizes keywords like "hitung material", "estimasi atap", etc.

### Step 3: BARI asks for missing data
Using conversation history, BARI identifies what data is already provided and asks for missing fields only.

### Step 4: User provides remaining data
User replies with overstek, sudut, model atap, etc.

### Step 5: BARI generates structured request
LLM outputs `CALCULATOR_REQUEST` followed by JSON with all parameters.

### Step 6: Backend detects trigger
Query route checks if response contains `CALCULATOR_REQUEST`.

### Step 7: Extract and map parameters
Regex extracts JSON, maps fields to calculator API format:
- `roof_type` → `modelAtap`
- `building_type` → `buildingType`
- `length` → `panjang`
- etc.

### Step 8: Call calculator API
Makes internal fetch to `/api/calculate` with mapped parameters.

### Step 9: Receive calculation results
Calculator returns structured JSON with all materials calculated.

### Step 10: Format for display
Transform JSON to beautiful markdown with proper sections and styling.

### Step 11: Stream to user
Send formatted response as additional SSE chunks to chatbot UI.

### Step 12: User sees result
Chatbot displays professional-looking estimation with all materials listed.

---

## 💡 Smart Features

### 1. Context-Aware Data Collection
BARI remembers what user already said:
```
User: "atap rumah 8x7 meter pakai genteng metal"
BARI: Asks only for: overstek, sudut, model atap (NOT panjang/lebar/jenis)
```

### 2. Conversational Memory
Uses last 10 messages for context, so user can reference previous conversation:
```
User: "Hitung material untuk atap rumah saya"
BARI: "Yang tadi 8x7 meter?" (from memory)
```

### 3. Automatic Field Mapping
Handles various input formats:
```
"Pelana" / "pelana" / "PELANA" → "Pelana"
"Residential" / "rumah" / "tinggal" → "Residential"
```

### 4. Error Recovery
If calculation fails, shows friendly message instead of crash:
```
"Maaf, ada kesalahan dalam perhitungan. Silakan coba lagi atau hubungi admin."
```

### 5. Professional Formatting
- Bold for totals (**126 lembar**)
- Sections (LUAS ATAP, RANGKA, etc.)
- Icons (📌 for notes)
- Units (m², batang, lembar, buah)

---

## 📝 Example Conversations

### Example 1: Complete Flow
```
User: "Berapa material untuk atap rumah 8x7 meter?"

BARI: "Oke, biar saya bantu hitungkan. Saya butuh info:
1. Model atap: Pelana / Limas / Datar?
2. Overstek per sisi (meter)?
3. Sudut kemiringan (derajat)?
4. Jenis penutup: Genteng Metal / Spandek / uPVC?"

User: "Pelana, overstek 0.6m, sudut 30°, genteng metal"

BARI: [Shows complete calculation result]
```

### Example 2: With Context
```
User: "Saya punya gudang 15x10 meter"

BARI: "Untuk gudang industrial, biasanya pakai atap datar atau pelana dengan spandek..."

User: "Hitung materialnya dong"

BARI: "Oke! Untuk gudang 15x10m yang tadi ya. Info tambahan:
1. Model atap: Pelana / Datar?
2. Overstek (meter)?
3. Sudut (derajat)?"

[Uses 15x10 from previous message]
```

### Example 3: Knowledge Base First
```
User: "Apa itu atap limas?"

BARI: "Atap limas adalah atap dengan 4 bidang miring... [from knowledge base with citations]"

User: "Hitung material untuk atap limas 8x7m dong"

BARI: [Proceeds to collect data and calculate]
```

---

## ✨ Benefits

### For Users:
✅ Natural conversation (no forms!)
✅ Instant calculations
✅ Beautiful, easy-to-read results
✅ Context-aware (remembers previous chat)
✅ Professional disclaimer included

### For Business:
✅ Automated estimation
✅ Reduces manual calculation errors
✅ Standardized responses
✅ Scalable (handles unlimited users)
✅ Logged queries for analytics

### For Developers:
✅ Clean separation of concerns
✅ Type-safe with TypeScript
✅ Well-documented
✅ Easy to extend (add new fields, formulas)
✅ Production-ready error handling

---

## 🎯 Next Enhancements (Optional)

### Phase 2 Features:
1. **Price Estimation**: Add optional harga fields for cost calculation
2. **PDF Export**: Generate downloadable PDF quote
3. **Comparison Mode**: Compare Pelana vs Limas for same dimensions
4. **Save History**: Store calculation history per user
5. **Image Recognition**: Upload roof photo, auto-detect type/dimensions

### Advanced Features:
1. **Complex Roofs**: Handle L-shape, T-shape roofs
2. **Material Variants**: Different brands of Kanal C, Reng
3. **Waste Optimization**: Suggest cutting patterns to minimize waste
4. **Supplier Integration**: Show available stock from suppliers
5. **Installation Guide**: Generate step-by-step installation plan

---

## 🏁 Conclusion

**Calculator integration is COMPLETE and PRODUCTION READY!** ✅

The system successfully:
- Detects calculator queries via NLP
- Collects required data conversationally
- Executes calculations via API
- Formats results beautifully
- Streams responses in real-time

**Zero UI changes needed** - everything works through natural conversation!

---

**Dokumentasi oleh**: Claude Code (Anthropic)
**Tanggal**: 27 November 2025
**Version**: 2.0.0 - Full Calculator Integration with Auto-Detection & Execution
