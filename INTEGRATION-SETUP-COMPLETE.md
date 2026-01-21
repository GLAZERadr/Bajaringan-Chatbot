# ✅ WordPress Knowledge Manager ↔ Next.js Integration Setup

**Date:** 2026-01-21
**Status:** ✅ **CONFIGURED & READY TO TEST**

---

## 🎉 Configuration Complete!

Your WordPress Knowledge Manager plugin is now connected to your Next.js chatbot application!

---

## 📋 What Was Configured

### 1. WordPress Plugin (v1.0.4) ✅

**Location:** `https://bajaringan.com/wp-admin`

**Settings Configured:**
- ✅ Next.js Webhook URL: `https://bajaringan-chatbot.vercel.app/api/webhooks/knowledge-updated`
- ✅ Webhook Secret: `uCsTx8KoNTLBzMZfS9QlG7Pyxj32CDWm`
- ✅ API Key Generated: `bari_sk_02e31cf2b46ade244cf04cd9fa0da265ab05b2d57918e819ae27379dd9ddec85`

**Plugin Status:**
- Version: 1.0.4
- Database: All tables created ✅
- Auto-upgrade: Enabled ✅

---

### 2. Next.js Application Environment ✅

**Location:** `/Users/adrianglazer/Freelance/bajaringan-calculator/.env`

**Variables Added:**
```bash
# WordPress Knowledge Manager Integration
WORDPRESS_URL=https://bajaringan.com
WORDPRESS_API_KEY=bari_sk_02e31cf2b46ade244cf04cd9fa0da265ab05b2d57918e819ae27379dd9ddec85
WEBHOOK_SECRET=uCsTx8KoNTLBzMZfS9QlG7Pyxj32CDWm
```

---

### 3. Integration Components ✅

**WordPress Service:**
- ✅ `src/services/wordpress-knowledge.service.ts` - Configured
- ✅ Search endpoint: `/wp-json/bari/v1/knowledge/search`
- ✅ Get knowledge: `/wp-json/bari/v1/knowledge/{id}`
- ✅ Track usage: `/wp-json/bari/v1/knowledge/{id}/track`

**Webhook Handler:**
- ✅ `src/app/api/webhooks/knowledge-updated/route.ts` - Ready
- ✅ Endpoint: `https://bajaringan-chatbot.vercel.app/api/webhooks/knowledge-updated`
- ✅ Secret validation: Enabled
- ✅ Cache clearing: Automatic

---

## 🔄 How It Works

### Publishing Knowledge Flow:

```
1. WordPress Admin creates/updates knowledge
   ↓
2. User clicks "Publish" in WordPress
   ↓
3. WordPress sends webhook to Next.js:
   POST /api/webhooks/knowledge-updated
   Header: X-Webhook-Secret: uCsTx8KoNTLBzMZfS9QlG7Pyxj32CDWm
   Body: { event: "knowledge.published", data: {...} }
   ↓
4. Next.js webhook validates secret
   ↓
5. Next.js clears WordPress knowledge cache
   ↓
6. Next query fetches fresh data from WordPress
```

### User Query Flow:

```
1. User asks chatbot a question
   ↓
2. Chatbot checks WordPress knowledge:
   GET /wp-json/bari/v1/knowledge/search?q=user+question
   Header: X-API-Key: bari_sk_02e31...
   ↓
3. WordPress returns relevant knowledge entries
   ↓
4. Chatbot uses knowledge to answer (via Gemini AI)
   ↓
5. Chatbot tracks usage:
   POST /wp-json/bari/v1/knowledge/{id}/track
```

---

## 🧪 Testing Checklist

### Phase 1: WordPress REST API ✅

- [x] API key generated successfully
- [x] Webhook secret configured
- [ ] **Next:** Create test knowledge entry
- [ ] Test REST API endpoint with Postman/curl

### Phase 2: Knowledge Creation & Search

**Test in WordPress Admin:**

1. **Create Test Knowledge:**
   ```
   BARI Knowledge → Add Knowledge

   Title: "Cara Menghitung Kebutuhan Baja Ringan"
   Content: "Untuk menghitung kebutuhan baja ringan..."
   Category: Kalkulator
   Keywords: ["baja ringan", "kalkulator", "material"]
   Status: Published
   ```

2. **Verify API Response:**
   ```bash
   curl -X GET "https://bajaringan.com/wp-json/bari/v1/knowledge/search?q=baja+ringan&limit=5" \
     -H "X-API-Key: bari_sk_02e31cf2b46ade244cf04cd9fa0da265ab05b2d57918e819ae27379dd9ddec85"
   ```

   **Expected Response:**
   ```json
   {
     "success": true,
     "data": [
       {
         "id": 1,
         "title": "Cara Menghitung Kebutuhan Baja Ringan",
         "content": "...",
         "category_name": "Kalkulator",
         "relevance": 0.95
       }
     ]
   }
   ```

### Phase 3: Webhook Testing

1. **Publish/Update Knowledge in WordPress**
2. **Check Next.js logs for webhook:**
   ```
   🔔 Webhook received: knowledge.published
   📦 Payload: { knowledge_id: 1, title: "...", ... }
   ✅ Cache cleared, fresh data will be fetched on next query
   ```

3. **Verify webhook endpoint:**
   ```bash
   curl -X POST "https://bajaringan-chatbot.vercel.app/api/webhooks/knowledge-updated" \
     -H "X-Webhook-Secret: uCsTx8KoNTLBzMZfS9QlG7Pyxj32CDWm" \
     -H "Content-Type: application/json" \
     -d '{"event":"knowledge.published","data":{"id":1}}'
   ```

### Phase 4: End-to-End Chatbot Test

1. **Ask chatbot:** "Bagaimana cara menghitung kebutuhan baja ringan?"
2. **Expected:**
   - Chatbot searches WordPress knowledge
   - Finds relevant knowledge entry
   - Uses it to generate accurate answer
   - Tracks usage in WordPress analytics

---

## 📊 WordPress REST API Endpoints

All endpoints: `https://bajaringan.com/wp-json/bari/v1/`

### 1. Search Knowledge
```
GET /knowledge/search
Query Params:
  - q: search query (required)
  - limit: max results (default: 5)
Headers:
  - X-API-Key: bari_sk_02e31...
```

### 2. Get Single Knowledge
```
GET /knowledge/{id}
Headers:
  - X-API-Key: bari_sk_02e31...
```

### 3. Get All Knowledge
```
GET /knowledge
Query Params:
  - status: published|draft (default: published)
  - limit: 20
  - offset: 0
Headers:
  - X-API-Key: bari_sk_02e31...
```

### 4. Track Usage
```
POST /knowledge/{id}/track
Headers:
  - X-API-Key: bari_sk_02e31...
  - Content-Type: application/json
Body:
{
  "session_id": "uuid",
  "user_id": null,
  "query": "user question",
  "matched": true
}
```

### 5. Create Knowledge (Admin only)
```
POST /knowledge
Headers:
  - X-API-Key: bari_sk_02e31...
  - Content-Type: application/json
Body:
{
  "title": "...",
  "content": "...",
  "category_id": 1,
  "keywords": ["..."],
  "status": "published"
}
```

### 6. Update Knowledge (Admin only)
```
PUT /knowledge/{id}
Headers:
  - X-API-Key: bari_sk_02e31...
  - Content-Type: application/json
```

### 7. Delete Knowledge (Admin only)
```
DELETE /knowledge/{id}
Headers:
  - X-API-Key: bari_sk_02e31...
```

---

## 🔒 Security Features

### API Key Authentication
- ✅ 64-character cryptographic key
- ✅ Hashed in database (password_hash)
- ✅ Prefix stored for identification (`bari_sk_07a857a...`)
- ✅ Shown only once during generation
- ✅ Can be revoked anytime

### Webhook Security
- ✅ Secret validation on every webhook
- ✅ 32-character random secret
- ✅ Rejects requests without valid secret
- ✅ Can regenerate secret anytime

### WordPress Security
- ✅ Nonce validation for admin actions
- ✅ Capability checks (bkm_create_knowledge, bkm_manage_settings)
- ✅ Input sanitization
- ✅ SQL injection prevention
- ✅ XSS protection

---

## 🚀 Deployment Steps

### Production Deployment:

1. **Deploy Next.js to Vercel:**
   ```bash
   cd /Users/adrianglazer/Freelance/bajaringan-calculator
   vercel --prod
   ```

2. **Set Production Environment Variables:**
   ```bash
   vercel env add WORDPRESS_URL production
   # Enter: https://bajaringan.com

   vercel env add WORDPRESS_API_KEY production
   # Paste: bari_sk_02e31cf2b46ade244cf04cd9fa0da265ab05b2d57918e819ae27379dd9ddec85

   vercel env add WEBHOOK_SECRET production
   # Paste: uCsTx8KoNTLBzMZfS9QlG7Pyxj32CDWm
   ```

3. **Update WordPress Webhook URL:**
   ```
   WordPress Admin → BARI Knowledge → Settings
   Change: https://bajaringan-chatbot.vercel.app/api/webhooks/knowledge-updated
   To: https://your-production-domain.com/api/webhooks/knowledge-updated
   ```

4. **Test Production:**
   - Create test knowledge in WordPress
   - Check Vercel logs for webhook
   - Test chatbot queries

---

## 📈 Monitoring & Analytics

### WordPress Analytics

**Dashboard:** `BARI Knowledge → Dashboard`

Metrics:
- Total knowledge entries
- Total views/usage
- Top performing knowledge
- Recent queries
- API usage statistics

### Next.js Logs

Monitor webhook activity:
```bash
vercel logs --follow
```

Look for:
- `🔔 Webhook received: knowledge.published`
- `✅ Cache cleared`
- `🔍 Searching WordPress knowledge`
- `📊 Tracked usage for knowledge #X`

---

## 🆘 Troubleshooting

### Issue: API returns 401 Unauthorized

**Solution:**
1. Check API key is correct in `.env`
2. Verify key is active in WordPress admin
3. Check header format: `X-API-Key: bari_sk_...`

### Issue: Webhook not received

**Solution:**
1. Check webhook URL is correct in WordPress
2. Verify webhook secret matches in both systems
3. Check Next.js logs for webhook errors
4. Test webhook endpoint manually with curl

### Issue: Old data returned after update

**Solution:**
1. Verify webhook was sent by WordPress
2. Check webhook was received by Next.js
3. Manually clear cache: Restart Next.js server
4. Cache TTL is 5 minutes - may need to wait

### Issue: Knowledge not found

**Solution:**
1. Verify knowledge status is "published" (not draft)
2. Check knowledge exists in WordPress admin
3. Test API endpoint directly with curl
4. Check WordPress REST API is enabled

---

## 📝 Next Steps

### Immediate:
- [ ] Create test knowledge entries
- [ ] Test REST API with Postman/curl
- [ ] Test webhook by publishing knowledge
- [ ] Test chatbot queries

### Short-term:
- [ ] Add more knowledge entries
- [ ] Configure categories properly
- [ ] Set up proper keywords/tags
- [ ] Monitor usage analytics

### Long-term:
- [ ] Implement knowledge recommendations
- [ ] Add A/B testing for answers
- [ ] Create knowledge quality metrics
- [ ] Build admin dashboard for insights

---

## 🎯 Success Criteria

Integration is successful when:

✅ **WordPress → Next.js:**
- Knowledge published in WordPress
- Webhook received by Next.js
- Cache cleared automatically

✅ **Next.js → WordPress:**
- Chatbot searches knowledge via API
- Relevant results returned
- Usage tracked in WordPress analytics

✅ **End-to-End:**
- User asks question
- Chatbot finds relevant knowledge
- Accurate answer provided
- Usage logged for analytics

---

## 📞 Support

**Developer:** Adrian Glazer
**Project:** Bajaringan Calculator & Chatbot
**WordPress:** https://bajaringan.com
**Next.js:** `/Users/adrianglazer/Freelance/bajaringan-calculator`

---

**Status:** 🚀 **READY FOR TESTING**

**Next Action:** Create test knowledge entry in WordPress and verify API response!

---

© 2026 Bajaringan. All rights reserved.
