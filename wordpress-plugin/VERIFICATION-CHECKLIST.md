# 🔍 BAJARINGAN KNOWLEDGE MANAGER - VERIFICATION CHECKLIST

**Plugin Version:** 1.0.3
**Date:** 2026-01-21
**Status:** Installed & Activated ✅

---

## 📋 VERIFICATION STEPS

### ✅ Step 1: Database Tables Verification

Run this SQL query in **phpMyAdmin** or MySQL client:

```sql
-- Check if all 7 tables exist
SHOW TABLES LIKE 'wp0b_bari_%';
```

**Expected Result:** 7 tables
- `wp0b_bari_knowledge`
- `wp0b_bari_categories`
- `wp0b_bari_tags`
- `wp0b_bari_knowledge_tags`
- `wp0b_bari_knowledge_versions`
- `wp0b_bari_conversations`
- `wp0b_bari_api_keys`

---

### ✅ Step 2: Default Categories Check

```sql
-- Check default categories
SELECT id, name, slug, description
FROM wp0b_bari_categories
ORDER BY id;
```

**Expected Result:** 5 categories
1. Kalkulator
2. Produk
3. Teknis
4. Maintenance
5. Garansi

---

### ✅ Step 3: WordPress Admin UI Check

**Check in WordPress Admin:**

- [ ] Menu "BARI Knowledge" muncul di sidebar
- [ ] Dashboard accessible (BARI Knowledge → Dashboard)
- [ ] Settings accessible (BARI Knowledge → Settings)
- [ ] Add Knowledge accessible (BARI Knowledge → Add Knowledge)
- [ ] All Knowledge accessible (BARI Knowledge → All Knowledge)
- [ ] No PHP warnings/errors in dashboard
- [ ] Icons are professional (no emoji)

---

### ✅ Step 4: Generate API Key

**In WordPress Admin:**

1. Go to: **BARI Knowledge → Settings**
2. Scroll to: **API Keys** section
3. Enter key name: `Production`
4. Click: **Generate New Key**
5. Copy the generated key (starts with `bari_sk_`)
6. **SAVE IT IMMEDIATELY** - shown only once!

**Format:**
```
bari_sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### ✅ Step 5: Configure Webhook URL

**In WordPress Admin:**

1. Still in: **BARI Knowledge → Settings**
2. Find: **Integration Settings** section
3. **Next.js Webhook URL:** Enter your Next.js URL
   - Production: `https://your-domain.com`
   - Local: `http://localhost:3000`
4. **Webhook Secret:** Copy this value
5. Click: **Save Settings**

**Note the values:**
```bash
WORDPRESS_API_URL=https://bajaringan.com
WORDPRESS_API_KEY=bari_sk_xxxxx...
WEBHOOK_SECRET=xxxxx...
```

---

### ✅ Step 6: Test REST API Endpoints

**Run these tests via Terminal or Postman:**

#### 6.1 Health Check (No Auth Required)
```bash
curl https://bajaringan.com/wp-json/bari/v1/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "version": "1.0.3",
  "timestamp": "2026-01-21T00:00:00+00:00"
}
```

---

#### 6.2 Get Categories (No Auth Required)
```bash
curl https://bajaringan.com/wp-json/bari/v1/categories
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Kalkulator",
      "slug": "kalkulator",
      "description": "Informasi tentang kalkulator baja ringan"
    },
    ...
  ]
}
```

---

#### 6.3 Search Knowledge (Requires API Key)

**Replace `YOUR_API_KEY` with actual key:**

```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  "https://bajaringan.com/wp-json/bari/v1/knowledge/search?q=test"
```

**Expected Response (if no data yet):**
```json
{
  "success": true,
  "query": "test",
  "data": [],
  "total": 0
}
```

---

#### 6.4 Create Knowledge via API (Requires API Key)

```bash
curl -X POST \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Knowledge Entry",
    "content": "This is a test knowledge entry for the BARI AI Assistant.",
    "category_id": 1,
    "tags": ["test", "demo"],
    "keywords": "test, demo, sample"
  }' \
  "https://bajaringan.com/wp-json/bari/v1/knowledge"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Knowledge created successfully",
  "data": {
    "id": 1,
    "title": "Test Knowledge Entry",
    "status": "draft"
  }
}
```

---

### ✅ Step 7: Create Knowledge via WordPress Admin

**Manual Test:**

1. Go to: **BARI Knowledge → Add Knowledge**
2. Fill in:
   - **Title:** "Cara menghitung kebutuhan baja ringan"
   - **Content:** "Untuk menghitung kebutuhan baja ringan, gunakan kalkulator di website kami..."
   - **Category:** Kalkulator
   - **Tags:** kalkulator, hitung, baja ringan
   - **Keywords:** kalkulator, hitung, kebutuhan, baja ringan
3. (Optional) Test **AI Preview:**
   - Enter test query: "gimana cara hitung baja ringan?"
   - Click: **Test AI Response**
   - Should show preview of AI response
4. Click: **Save as Draft** or **Create** (publish)
5. Verify: Entry appears in **All Knowledge** list

---

### ✅ Step 8: Test Knowledge Search

After creating knowledge entry, test search:

```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  "https://bajaringan.com/wp-json/bari/v1/knowledge/search?q=kalkulator"
```

**Expected Response:**
```json
{
  "success": true,
  "query": "kalkulator",
  "data": [
    {
      "id": 1,
      "title": "Cara menghitung kebutuhan baja ringan",
      "content": "Untuk menghitung kebutuhan...",
      "category_name": "Kalkulator",
      "relevance": 0.95
    }
  ],
  "total": 1
}
```

---

### ✅ Step 9: Test Webhook (Optional - for Next.js Integration)

**When you create/update/delete knowledge, webhook should fire.**

Check if webhook is sent to Next.js:

```bash
# In your Next.js logs, you should see:
# POST /api/webhooks/knowledge
# Event: knowledge.created / knowledge.updated / knowledge.deleted
```

---

## 🔧 TROUBLESHOOTING

### Issue 1: Tables Not Created

**Solution:**
```sql
-- Manually trigger table creation
-- Go to: Plugins → Deactivate → Activate again
```

### Issue 2: API Returns 401 Unauthorized

**Check:**
- API key is correct (starts with `bari_sk_`)
- Header is: `X-API-Key: YOUR_KEY`
- Key is not expired (check in Settings → API Keys)

### Issue 3: Search Returns Empty

**Check:**
- Knowledge entries exist (`SELECT COUNT(*) FROM wp0b_bari_knowledge`)
- Entries are published (`status = 'published'`)
- Search query matches title/content/keywords

### Issue 4: Webhook Not Received

**Check:**
- Webhook URL is correct in Settings
- Next.js server is running
- `/api/webhooks/knowledge/route.ts` exists
- Webhook secret matches in both systems

---

## 📊 SYSTEM INFORMATION

**Check in:** BARI Knowledge → Settings → System Information

Should show:
- **Plugin Version:** 1.0.3
- **WordPress Version:** 6.8.3
- **PHP Version:** 8.2.29
- **Database Type:** MySQL
- **Total Knowledge:** (number)

---

## 🎯 NEXT.JS INTEGRATION CHECKLIST

Once WordPress setup is complete, configure Next.js:

### Step 1: Environment Variables

Create/update `.env.local` in Next.js project:

```bash
# WordPress Integration
WORDPRESS_API_URL=https://bajaringan.com
WORDPRESS_API_KEY=bari_sk_xxxxx...
WEBHOOK_SECRET=xxxxx...

# Optional: OpenAI for AI features
OPENAI_API_KEY=sk-xxxxx...
```

---

### Step 2: Test Next.js API Connection

Create test script: `scripts/test-wordpress-connection.ts`

```typescript
const response = await fetch(
  `${process.env.WORDPRESS_API_URL}/wp-json/bari/v1/knowledge/search?q=test`,
  {
    headers: {
      'X-API-Key': process.env.WORDPRESS_API_KEY!
    }
  }
);

const data = await response.json();
console.log('WordPress connection:', data);
```

Run: `npx tsx scripts/test-wordpress-connection.ts`

---

### Step 3: Implement Webhook Handler

File: `app/api/webhooks/knowledge/route.ts`

Should handle:
- `knowledge.created` - Sync new entry to vector DB
- `knowledge.updated` - Update entry in vector DB
- `knowledge.deleted` - Remove from vector DB
- `knowledge.published` - Make entry active

---

## ✅ FINAL VERIFICATION

### All Systems Functional?

- [ ] WordPress plugin installed & activated
- [ ] 7 database tables created
- [ ] 5 default categories exist
- [ ] API key generated & saved
- [ ] Webhook URL configured
- [ ] REST API health check passes
- [ ] Can create knowledge via admin
- [ ] Can search knowledge via API
- [ ] Webhooks firing (if Next.js running)
- [ ] Next.js can fetch from WordPress
- [ ] AI chatbot can retrieve knowledge

---

## 📞 SUPPORT

If any step fails:

1. **Check error logs:**
   - WordPress: `wp-content/debug.log`
   - Next.js: Console output
   - Server: Error logs

2. **Enable debug mode:**
   ```php
   // wp-config.php
   define('WP_DEBUG', true);
   define('WP_DEBUG_LOG', true);
   define('WP_DEBUG_DISPLAY', false);
   ```

3. **Review documentation:**
   - `docs/TUTORIAL_LENGKAP.md`
   - `docs/KNOWLEDGE_MANAGEMENT_SYSTEM.md`
   - `RELEASE-v1.0.3-SINGLETON-FIX.md`

---

**Status:** Ready for verification ✅

**Next Step:** Run through this checklist and report results!

---

© 2026 Bajaringan. All rights reserved.
