# 🚀 Quick Start Guide - WordPress Knowledge Manager

**Version:** 1.0.4
**Date:** 2026-01-21

---

## ✅ Setup Complete!

Your WordPress Knowledge Manager is configured and connected to Next.js!

---

## 📋 Your Credentials

### API Key (Keep Secret!)
```
bari_sk_02e31cf2b46ade244cf04cd9fa0da265ab05b2d57918e819ae27379dd9ddec85
```

### Webhook Secret (Keep Secret!)
```
uCsTx8KoNTLBzMZfS9QlG7Pyxj32CDWm
```

### WordPress URL
```
https://bajaringan.com
```

### Next.js Webhook URL
```
https://bajaringan-chatbot.vercel.app/api/webhooks/knowledge-updated
```

---

## 🧪 Quick Test (5 Minutes)

### 1. Create Test Knowledge

**WordPress Admin → BARI Knowledge → Add Knowledge**

```
Title: Cara Menghitung Baja Ringan
Content:
Untuk menghitung kebutuhan baja ringan untuk atap rumah:
1. Ukur luas atap (panjang x lebar)
2. Tambahkan 10% untuk overlap
3. Gunakan kalkulator kami untuk hasil akurat

Category: Kalkulator
Keywords: baja ringan, kalkulator, material, atap
Status: Published
```

Click: **Publish**

---

### 2. Test REST API

**Option A: Using curl (Terminal)**

```bash
curl -X GET "https://bajaringan.com/wp-json/bari/v1/knowledge/search?q=baja+ringan&limit=5" \
  -H "X-API-Key: bari_sk_02e31cf2b46ade244cf04cd9fa0da265ab05b2d57918e819ae27379dd9ddec85"
```

**Option B: Using Browser**

Open: `https://bajaringan.com/wp-json/bari/v1/knowledge/search?q=baja+ringan&limit=5`

Add header manually or use extension like "ModHeader"

**Expected Result:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Cara Menghitung Baja Ringan",
      "content": "...",
      "category_name": "Kalkulator"
    }
  ]
}
```

---

### 3. Test Webhook

**Terminal:**

```bash
curl -X POST "https://bajaringan-chatbot.vercel.app/api/webhooks/knowledge-updated" \
  -H "X-Webhook-Secret: uCsTx8KoNTLBzMZfS9QlG7Pyxj32CDWm" \
  -H "Content-Type: application/json" \
  -d '{"event":"knowledge.published","data":{"id":1,"title":"Test"}}'
```

**Expected Result:**
```json
{
  "success": true,
  "message": "Cache cleared successfully",
  "timestamp": "2026-01-21T..."
}
```

---

### 4. Test Chatbot

**Open chatbot and ask:**
```
"Bagaimana cara menghitung kebutuhan baja ringan?"
```

**Expected:**
- Chatbot finds your knowledge entry
- Provides accurate answer based on content
- Usage tracked in WordPress analytics

---

## 📊 Check Results

### WordPress Dashboard

**Go to:** `BARI Knowledge → Dashboard`

You should see:
- ✅ Total knowledge: 1
- ✅ Total views: 1 (after chatbot query)
- ✅ Recent queries shown

### Next.js Logs (if deployed)

**Vercel Dashboard or terminal:**
```bash
vercel logs --follow
```

Look for:
```
🔔 Webhook received: knowledge.published
✅ Cache cleared
🔍 Searching WordPress knowledge: "baja ringan"
📊 Tracked usage for knowledge #1
```

---

## 🎯 Common Tasks

### Add New Knowledge

```
1. WordPress Admin → BARI Knowledge → Add Knowledge
2. Fill in title, content, category, keywords
3. Click "Publish"
4. Knowledge immediately available via API
5. Webhook notifies Next.js to clear cache
```

### Update Existing Knowledge

```
1. BARI Knowledge → All Knowledge
2. Click knowledge to edit
3. Make changes
4. Click "Update"
5. Webhook notifies Next.js automatically
```

### Revoke API Key

```
1. BARI Knowledge → Settings
2. Find key in table
3. Click "Revoke"
4. Generate new key
5. Update .env in Next.js
6. Redeploy Next.js
```

### Regenerate Webhook Secret

```
1. BARI Knowledge → Settings
2. Check "Regenerate webhook secret"
3. Click "Save Settings"
4. Update WEBHOOK_SECRET in Next.js .env
5. Redeploy Next.js
```

---

## 🔧 Deployment Checklist

### When deploying to production:

- [ ] Upload plugin ZIP to WordPress
- [ ] Activate plugin
- [ ] Generate API key
- [ ] Configure webhook URL (use production domain!)
- [ ] Set environment variables in Vercel
- [ ] Deploy Next.js
- [ ] Test API endpoints
- [ ] Test webhook
- [ ] Test chatbot queries
- [ ] Monitor logs for 24 hours

---

## 🆘 Emergency Fixes

### Plugin won't activate?
```bash
# Check WordPress debug.log
tail -f wp-content/debug.log
```

### API returns 401?
```bash
# Verify API key in .env
cat .env | grep WORDPRESS_API_KEY

# Test manually
curl -X GET "https://bajaringan.com/wp-json/bari/v1/knowledge/search?q=test" \
  -H "X-API-Key: YOUR_KEY_HERE"
```

### Webhook not working?
```bash
# Test webhook endpoint
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "X-Webhook-Secret: YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"event":"test"}'
```

### Cache not clearing?
```bash
# Manually clear cache by restarting Next.js
# Or wait 5 minutes (cache TTL)
```

---

## 📞 Quick Links

### WordPress
- Admin: https://bajaringan.com/wp-admin
- Knowledge Manager: https://bajaringan.com/wp-admin/admin.php?page=bari-knowledge
- Settings: https://bajaringan.com/wp-admin/admin.php?page=bari-knowledge-settings

### REST API
- Base URL: https://bajaringan.com/wp-json/bari/v1
- Search: `/knowledge/search?q=query`
- Get: `/knowledge/{id}`
- Track: `/knowledge/{id}/track`

### Documentation
- Full docs: `/Users/adrianglazer/Freelance/bajaringan-calculator/wordpress-plugin/`
- Integration guide: `INTEGRATION-SETUP-COMPLETE.md`
- Troubleshooting: `TROUBLESHOOT-AJAX-ERROR.md`
- Hotfixes: `HOTFIX-*.md`

---

## 🎉 You're All Set!

**Status:** ✅ Ready to use!

**Next steps:**
1. Create your first real knowledge entry
2. Test chatbot integration
3. Monitor analytics
4. Add more knowledge content

---

**Need help?** Check `INTEGRATION-SETUP-COMPLETE.md` for detailed guides.

© 2026 Bajaringan. All rights reserved.
