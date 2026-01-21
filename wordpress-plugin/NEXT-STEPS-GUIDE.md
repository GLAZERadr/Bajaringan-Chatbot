# 🚀 NEXT STEPS - After WordPress Plugin Installation

**Current Status:** ✅ Plugin Installed & Activated
**Version:** 1.0.3
**Date:** 2026-01-21

---

## 📋 QUICK START CHECKLIST

### ✅ Phase 1: WordPress Setup (Do This Now!)

#### 1.1 Verify Database Tables

**Run SQL verification script:**

Upload `verify-installation.sql` to phpMyAdmin and execute it.

**Expected Results:**
```
✓ PASS - Tables: 7/7
✓ PASS - Categories: 5/5
✓ PASS - Plugin Version: 1.0.3
✓ PASS - Webhook Secret: Generated
```

**Alternative: Quick Manual Check**
```sql
SHOW TABLES LIKE 'wp0b_bari_%';
SELECT COUNT(*) FROM wp0b_bari_categories;
```

---

#### 1.2 Generate Production API Key

**Steps:**
1. WordPress Admin → **BARI Knowledge → Settings**
2. Scroll to **API Keys** section
3. Key name: `Production` (or `Next.js Production`)
4. Click: **Generate New Key**
5. **COPY THE KEY IMMEDIATELY** - It's shown only once!

**Example Key Format:**
```
bari_sk_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
```

**Save this in a secure location!**

---

#### 1.3 Configure Webhook URL

**In the same Settings page:**

1. **Next.js Webhook URL:**
   - Production: `https://bajaringan.com`
   - Local: `http://localhost:3000`

2. **Webhook Secret:**
   - Copy the auto-generated secret
   - Format: 32-character random string

3. Click: **Save Settings**

**Note these values for Next.js `.env.local`:**
```bash
WORDPRESS_API_URL=https://bajaringan.com
WORDPRESS_API_KEY=bari_sk_xxxxx...
WEBHOOK_SECRET=xxxxx...
```

---

#### 1.4 Create First Test Knowledge

**Manual Test via WordPress Admin:**

1. Go to: **BARI Knowledge → Add Knowledge**

2. Fill in:
   ```
   Title: Cara Menggunakan Kalkulator Baja Ringan

   Content:
   Untuk menggunakan kalkulator baja ringan di website Bajaringan:

   1. Masukkan panjang atap (dalam meter)
   2. Masukkan lebar atap (dalam meter)
   3. Pilih jenis atap (pelana, limas, atau datar)
   4. Klik tombol "Hitung"
   5. Hasil akan menampilkan kebutuhan material lengkap

   Kalkulator akan otomatis menghitung:
   - Jumlah reng
   - Jumlah rangka atap
   - Jumlah canal C dan baut
   - Estimasi biaya total

   Category: Kalkulator
   Tags: kalkulator, tutorial, cara-pakai
   Keywords: kalkulator baja ringan, cara hitung, tutorial
   ```

3. (Optional) Test **AI Preview:**
   ```
   Test Query: "gimana cara pakai kalkulator baja ringan?"
   Click: Test AI Response
   ```

4. Click: **Create** (to publish) or **Save as Draft**

---

### ✅ Phase 2: API Testing

#### 2.1 Test Health Endpoint (No Auth)

**Command:**
```bash
curl https://bajaringan.com/wp-json/bari/v1/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "version": "1.0.3",
  "timestamp": "2026-01-21T..."
}
```

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

#### 2.2 Test Categories Endpoint (No Auth)

**Command:**
```bash
curl https://bajaringan.com/wp-json/bari/v1/categories
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {"id": 1, "name": "Kalkulator", "slug": "kalkulator", ...},
    {"id": 2, "name": "Produk", ...},
    ...
  ]
}
```

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

#### 2.3 Test Search Endpoint (Requires API Key)

**Command (replace YOUR_API_KEY):**
```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  "https://bajaringan.com/wp-json/bari/v1/knowledge/search?q=kalkulator"
```

**Expected Response (if knowledge exists):**
```json
{
  "success": true,
  "query": "kalkulator",
  "data": [
    {
      "id": 1,
      "title": "Cara Menggunakan Kalkulator...",
      "content": "Untuk menggunakan...",
      "category_name": "Kalkulator",
      "relevance": 0.95
    }
  ],
  "total": 1
}
```

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

#### 2.4 Test Create Knowledge via API

**Command:**
```bash
curl -X POST \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Harga Baja Ringan Per Meter",
    "content": "Harga baja ringan di Bajaringan mulai dari Rp 50.000 per meter untuk rangka atap standar...",
    "category_id": 2,
    "tags": ["harga", "produk"],
    "keywords": "harga baja ringan, biaya, per meter"
  }' \
  "https://bajaringan.com/wp-json/bari/v1/knowledge"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Knowledge created successfully",
  "data": {
    "id": 2,
    "title": "Harga Baja Ringan Per Meter",
    "status": "draft"
  }
}
```

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

### ✅ Phase 3: Next.js Integration

#### 3.1 Configure Environment Variables

**File:** `/path/to/nextjs-project/.env.local`

```bash
# WordPress Knowledge Base Integration
WORDPRESS_API_URL=https://bajaringan.com
WORDPRESS_API_KEY=bari_sk_xxxxx...  # From Step 1.2
WEBHOOK_SECRET=xxxxx...             # From Step 1.3

# OpenAI (if using AI features)
OPENAI_API_KEY=sk-xxxxx...
```

---

#### 3.2 Test Connection from Next.js

**Create test script:** `scripts/test-wp-connection.ts`

```typescript
async function testWordPressConnection() {
  const baseUrl = process.env.WORDPRESS_API_URL;
  const apiKey = process.env.WORDPRESS_API_KEY;

  // Test 1: Health Check
  console.log('Testing health endpoint...');
  const health = await fetch(`${baseUrl}/wp-json/bari/v1/health`);
  const healthData = await health.json();
  console.log('Health:', healthData);

  // Test 2: Search
  console.log('\nTesting search endpoint...');
  const search = await fetch(
    `${baseUrl}/wp-json/bari/v1/knowledge/search?q=kalkulator`,
    {
      headers: { 'X-API-Key': apiKey! }
    }
  );
  const searchData = await search.json();
  console.log('Search results:', searchData);
}

testWordPressConnection();
```

**Run:**
```bash
npx tsx scripts/test-wp-connection.ts
```

**Status:** ⬜ Not Tested | ✅ Pass | ❌ Fail

---

#### 3.3 Implement Webhook Handler

**File:** `app/api/webhooks/knowledge/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const signature = request.headers.get('X-Webhook-Signature');
    const secret = process.env.WEBHOOK_SECRET;

    // TODO: Verify signature matches

    const body = await request.json();
    const { event, data } = body;

    console.log(`Webhook received: ${event}`, data);

    switch (event) {
      case 'knowledge.created':
        // Sync new knowledge to vector database
        await syncKnowledgeToVectorDB(data);
        break;

      case 'knowledge.updated':
        // Update existing knowledge in vector DB
        await updateKnowledgeInVectorDB(data);
        break;

      case 'knowledge.deleted':
        // Remove from vector DB
        await deleteKnowledgeFromVectorDB(data.id);
        break;

      case 'knowledge.published':
        // Mark as active in vector DB
        await activateKnowledgeInVectorDB(data.id);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function syncKnowledgeToVectorDB(data: any) {
  // TODO: Implement vector DB sync
  console.log('Syncing to vector DB:', data.id);
}

async function updateKnowledgeInVectorDB(data: any) {
  // TODO: Implement vector DB update
  console.log('Updating in vector DB:', data.id);
}

async function deleteKnowledgeFromVectorDB(id: number) {
  // TODO: Implement vector DB deletion
  console.log('Deleting from vector DB:', id);
}

async function activateKnowledgeInVectorDB(id: number) {
  // TODO: Implement activation
  console.log('Activating in vector DB:', id);
}
```

**Status:** ⬜ Not Implemented | ✅ Implemented | ❌ Error

---

#### 3.4 Create WordPress Client Library

**File:** `lib/wordpress-client.ts`

```typescript
export class WordPressKnowledgeClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.WORDPRESS_API_URL!;
    this.apiKey = process.env.WORDPRESS_API_KEY!;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/wp-json/bari/v1${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.statusText}`);
    }

    return response.json();
  }

  async search(query: string, limit = 10) {
    return this.request(`/knowledge/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  async getKnowledge(id: number) {
    return this.request(`/knowledge/${id}`);
  }

  async getCategories() {
    return this.request('/categories');
  }

  async createKnowledge(data: {
    title: string;
    content: string;
    category_id: number;
    tags?: string[];
    keywords?: string;
  }) {
    return this.request('/knowledge', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateKnowledge(id: number, data: Partial<KnowledgeData>) {
    return this.request(`/knowledge/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteKnowledge(id: number) {
    return this.request(`/knowledge/${id}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const wpKnowledge = new WordPressKnowledgeClient();
```

**Status:** ⬜ Not Implemented | ✅ Implemented | ❌ Error

---

### ✅ Phase 4: AI Chatbot Integration

#### 4.1 Integrate Knowledge Search in Chatbot

**File:** `app/api/chat/route.ts` (or similar)

```typescript
import { wpKnowledge } from '@/lib/wordpress-client';

export async function POST(request: Request) {
  const { message } = await request.json();

  // Search WordPress knowledge base
  const knowledgeResults = await wpKnowledge.search(message, 5);

  // Build context from knowledge base
  const context = knowledgeResults.data
    .map((item: any) => `${item.title}\n${item.content}`)
    .join('\n\n');

  // Send to OpenAI with context
  const systemPrompt = `You are BARI AI Assistant for Bajaringan.com.

Use this knowledge base to answer questions:

${context}

Answer based on the knowledge base. If not found, say you don't have that information.`;

  // ... rest of OpenAI chat completion logic
}
```

**Status:** ⬜ Not Implemented | ✅ Implemented | ❌ Error

---

## 🎯 FUNCTIONALITY CHECKLIST

### WordPress Plugin ✅

- [x] Plugin installed & activated
- [ ] Database tables created (7 tables)
- [ ] Default categories exist (5 categories)
- [ ] Admin UI accessible
- [ ] No PHP warnings/errors
- [ ] Professional icons (no emoji)
- [ ] API key generated
- [ ] Webhook URL configured

### REST API Endpoints

- [ ] `/health` - Health check (public)
- [ ] `/categories` - Get categories (public)
- [ ] `/knowledge/search` - Search knowledge (auth required)
- [ ] `/knowledge/{id}` - Get single knowledge (auth required)
- [ ] `/knowledge` POST - Create knowledge (auth required)
- [ ] `/knowledge/{id}` PUT - Update knowledge (auth required)
- [ ] `/knowledge/{id}` DELETE - Delete knowledge (auth required)

### Next.js Integration

- [ ] Environment variables configured
- [ ] WordPress client library created
- [ ] Webhook handler implemented
- [ ] Connection test successful
- [ ] Knowledge search integrated in chatbot

### Data & Content

- [ ] Test knowledge entry created
- [ ] Knowledge searchable via API
- [ ] Webhooks firing correctly
- [ ] AI chatbot retrieving knowledge
- [ ] User queries being answered

---

## 📞 WHAT TO DO IF SOMETHING FAILS

### Database Tables Not Created

**Solution:**
1. Deactivate plugin
2. Activate plugin again
3. Check: `wp-content/debug.log`
4. Run: `verify-installation.sql`

---

### API Returns 401 Unauthorized

**Check:**
- API key starts with `bari_sk_`
- Header is exactly: `X-API-Key: YOUR_KEY`
- Key is active (not deleted)
- Key exists in `wp0b_bari_api_keys` table

**Test:**
```sql
SELECT * FROM wp0b_bari_api_keys WHERE is_active = 1;
```

---

### Search Returns Empty Results

**Check:**
1. Knowledge entries exist:
   ```sql
   SELECT COUNT(*) FROM wp0b_bari_knowledge WHERE status = 'published';
   ```

2. Entries are published (not draft)

3. Search query matches content

**Debug:**
```bash
curl -H "X-API-Key: YOUR_KEY" \
  "https://bajaringan.com/wp-json/bari/v1/knowledge?status=published"
```

---

### Webhooks Not Firing

**Check:**
1. Webhook URL is correct in Settings
2. Next.js server is running
3. Route `/api/webhooks/knowledge` exists
4. Check Next.js console for incoming requests

**Test manually:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "event": "knowledge.created",
    "data": {"id": 1, "title": "Test"}
  }' \
  "http://localhost:3000/api/webhooks/knowledge"
```

---

## 📊 CURRENT STATUS SUMMARY

**WordPress Plugin:**
- Installation: ✅ Complete
- Configuration: ⏳ Pending (API key, webhook)
- Testing: ⏳ Pending

**REST API:**
- Endpoints: ✅ Available
- Authentication: ⏳ Pending (generate API key)
- Testing: ⏳ Pending

**Next.js Integration:**
- Environment: ⏳ Pending (`.env.local`)
- Client Library: ⏳ Pending (create `wordpress-client.ts`)
- Webhook Handler: ⏳ Pending (create route)
- Chatbot Integration: ⏳ Pending

---

## 🚀 RECOMMENDED ORDER

**Do these in order for best results:**

1. ✅ Install WordPress plugin (DONE!)
2. ⏳ Run `verify-installation.sql` to check database
3. ⏳ Generate API key in WordPress Settings
4. ⏳ Create 1-2 test knowledge entries
5. ⏳ Test REST API endpoints via curl
6. ⏳ Configure Next.js `.env.local`
7. ⏳ Create WordPress client library
8. ⏳ Implement webhook handler
9. ⏳ Test Next.js connection
10. ⏳ Integrate knowledge search in chatbot
11. ⏳ Test end-to-end with real user queries

---

## 📝 WHAT TO REPORT BACK

Please provide:

1. **Database verification results:**
   - Run `verify-installation.sql`
   - Screenshot or copy summary results

2. **API key status:**
   - Generated? (yes/no)
   - Saved securely? (yes/no)

3. **Test knowledge created:**
   - Title of test entry
   - Can you see it in "All Knowledge"?

4. **API endpoint tests:**
   - Health endpoint response
   - Search endpoint response

5. **Next.js status:**
   - URL of your Next.js app
   - Is it deployed or local?
   - Do you have the integration files ready?

---

**Ready to proceed?** 🚀

Let me know which phase you'd like to start with, or if you encounter any issues!

---

© 2026 Bajaringan. All rights reserved.
