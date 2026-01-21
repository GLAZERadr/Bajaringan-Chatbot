# Tutorial Lengkap - BARI Knowledge Management System

**Panduan Step-by-Step dari Instalasi sampai Penggunaan**

---

## Daftar Isi

1. [Persiapan](#1-persiapan)
2. [Instalasi WordPress Plugin](#2-instalasi-wordpress-plugin)
3. [Konfigurasi WordPress](#3-konfigurasi-wordpress)
4. [Konfigurasi Next.js](#4-konfigurasi-nextjs)
5. [Testing Integrasi](#5-testing-integrasi)
6. [Penggunaan untuk Admin](#6-penggunaan-untuk-admin)
7. [Penggunaan untuk End User](#7-penggunaan-untuk-end-user)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Persiapan

### 1.1 Requirement Check

Pastikan sistem Anda memenuhi requirement berikut:

```bash
# Check WordPress Version (minimum 6.0)
wp core version

# Check PHP Version (minimum 8.0)
php -v

# Check PostgreSQL (minimum 14)
psql --version

# Check Node.js (minimum 18)
node -v

# Check npm
npm -v
```

**Output yang diharapkan:**
```
WordPress version: 6.x.x
PHP 8.0.x atau lebih tinggi
psql (PostgreSQL) 14.x atau lebih tinggi
v18.x.x atau lebih tinggi
10.x.x atau lebih tinggi
```

### 1.2 Backup Database

**PENTING:** Selalu backup database sebelum instalasi!

```bash
# Backup WordPress database
wp db export backup-$(date +%Y%m%d-%H%M%S).sql

# Atau via PostgreSQL
pg_dump -U postgres wordpress_db > backup-$(date +%Y%m%d).sql
```

### 1.3 Siapkan Access

Pastikan Anda punya:
- ✅ WordPress admin access (Administrator role)
- ✅ Server SSH access (untuk upload files)
- ✅ Database access
- ✅ Next.js deployment access

---

## 2. Instalasi WordPress Plugin

### Metode 1: Via WordPress Admin (Recommended untuk Non-Technical)

#### Step 1: Buat ZIP File

```bash
cd /Users/adrianglazer/Freelance/bajaringan-calculator/wordpress-plugin
zip -r bajaringan-knowledge-manager.zip bajaringan-knowledge-manager/
```

**Output:**
```
  adding: bajaringan-knowledge-manager/ (stored 0%)
  adding: bajaringan-knowledge-manager/bajaringan-knowledge-manager.php (deflated 65%)
  adding: bajaringan-knowledge-manager/includes/ (stored 0%)
  ...
```

#### Step 2: Upload ke WordPress

1. Login ke WordPress Admin: `https://your-site.com/wp-admin`
2. Klik **Plugins → Add New**
3. Klik **Upload Plugin**
4. Klik **Choose File** dan pilih `bajaringan-knowledge-manager.zip`
5. Klik **Install Now**
6. Tunggu proses upload dan instalasi
7. Klik **Activate Plugin**

**Screenshot point:**
```
Plugins → Add New → Upload Plugin → Choose File → Install Now → Activate
```

#### Step 3: Verifikasi Instalasi

Setelah aktivasi, Anda akan melihat:
- ✅ Menu baru **"BARI Knowledge"** di sidebar kiri
- ✅ Success message: "Plugin activated successfully"

### Metode 2: Via Command Line (Recommended untuk Technical)

```bash
# 1. Upload plugin ke server
scp bajaringan-knowledge-manager.zip user@your-server:/tmp/

# 2. SSH ke server
ssh user@your-server

# 3. Pindah ke WordPress directory
cd /var/www/html

# 4. Install plugin
wp plugin install /tmp/bajaringan-knowledge-manager.zip

# 5. Activate plugin
wp plugin activate bajaringan-knowledge-manager
```

**Output yang diharapkan:**
```
Unpacking the package...
Installing the plugin...
Plugin installed successfully.
Activating 'bajaringan-knowledge-manager'...
Plugin 'bajaringan-knowledge-manager' activated.
Success: Installed 1 of 1 plugins.
```

### Step 4: Verifikasi Database Tables

```bash
wp db query "SHOW TABLES LIKE 'wp_bari_%';"
```

**Output yang diharapkan:**
```
+--------------------------------+
| Tables_in_wordpress (wp_bari_%) |
+--------------------------------+
| wp_bari_api_keys               |
| wp_bari_categories             |
| wp_bari_conversations          |
| wp_bari_knowledge              |
| wp_bari_knowledge_tags         |
| wp_bari_knowledge_versions     |
| wp_bari_tags                   |
+--------------------------------+
```

✅ **Jika 7 tables muncul, instalasi berhasil!**

### Step 5: Check Default Categories

```bash
wp db query "SELECT * FROM wp_bari_categories;"
```

**Output yang diharapkan:**
```
+----+-------------+-------------+----------------------------------+---------------+
| id | name        | slug        | description                      | display_order |
+----+-------------+-------------+----------------------------------+---------------+
|  1 | Kalkulator  | kalkulator  | Pertanyaan tentang kalkulasi...  |             1 |
|  2 | Produk      | produk      | Informasi produk dan harga       |             2 |
|  3 | Teknis      | teknis      | Pertanyaan teknis pemasangan     |             3 |
|  4 | Maintenance | maintenance | Perawatan dan perbaikan          |             4 |
|  5 | Garansi     | garansi     | Informasi garansi produk         |             5 |
+----+-------------+-------------+----------------------------------+---------------+
```

---

## 3. Konfigurasi WordPress

### Step 1: Akses Settings Page

1. Login ke WordPress Admin
2. Klik **BARI Knowledge → Settings** di sidebar

### Step 2: Set Next.js Webhook URL

```
Field: Next.js Webhook URL
Value: https://your-nextjs-app.com
```

**Contoh:**
- Production: `https://bajaringan-ai.vercel.app`
- Staging: `https://bajaringan-ai-staging.vercel.app`
- Local: `http://localhost:3000`

**PENTING:** Jangan pakai trailing slash (/)

✅ Benar: `https://your-app.com`
❌ Salah: `https://your-app.com/`

### Step 3: Copy Webhook Secret

Plugin secara otomatis generate webhook secret saat aktivasi.

1. Lihat field **"Webhook Secret"**
2. Klik tombol **"Copy"** di sebelah kanan
3. **Simpan** secret ini untuk Step 4 (Next.js configuration)

**Contoh:**
```
Webhook Secret: 5f8a7b3c2d1e9f4a6b8c7d5e3f1a9b7c
```

### Step 4: Generate API Key

1. Scroll ke section **"API Keys"**
2. Di field **"Key name"**, masukkan nama: `Production` atau `Next.js`
3. Klik **"Generate New Key"**
4. **COPY KEY SEKARANG!** Key hanya ditampilkan sekali!

**Warning yang muncul:**
```
⚠️ Save Your API Key
This key will only be shown once. Please copy it now:

bari_sk_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z

[Copy] ← Klik ini!
```

5. Simpan API key ini untuk Step 4 (Next.js configuration)

### Step 5: Save Settings

1. Klik tombol **"Save Settings"** di bagian atas
2. Tunggu success message: "Settings saved!"

### Step 6: Verify Configuration

Check apakah settings tersimpan:

```bash
# Check webhook URL
wp option get bkm_nextjs_webhook_url

# Check webhook secret
wp option get bkm_webhook_secret

# Check API keys
wp db query "SELECT id, name, key_prefix, is_active FROM wp_bari_api_keys;"
```

**Output:**
```
# Webhook URL
https://your-nextjs-app.com

# Webhook Secret
5f8a7b3c2d1e9f4a6b8c7d5e3f1a9b7c

# API Keys
+----+------------+-----------------+-----------+
| id | name       | key_prefix      | is_active |
+----+------------+-----------------+-----------+
|  1 | Production | bari_sk_1a2b3c4 |         1 |
+----+------------+-----------------+-----------+
```

---

## 4. Konfigurasi Next.js

### Step 1: Update Environment Variables

```bash
cd /Users/adrianglazer/Freelance/bajaringan-calculator

# Edit .env.local
nano .env.local
```

Tambahkan 3 baris ini di bagian bawah file:

```bash
# WordPress Knowledge Management Integration
WORDPRESS_API_URL=https://your-wordpress-site.com
WORDPRESS_API_KEY=bari_sk_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z
WEBHOOK_SECRET=5f8a7b3c2d1e9f4a6b8c7d5e3f1a9b7c
```

**Ganti dengan:**
- `WORDPRESS_API_URL`: URL WordPress Anda (dari Step 3.2)
- `WORDPRESS_API_KEY`: API Key yang di-copy dari Step 3.4
- `WEBHOOK_SECRET`: Webhook Secret yang di-copy dari Step 3.3

**Contoh lengkap .env.local:**
```bash
# Database
NEON_DB_URL=postgresql://user:password@host.neon.tech/db

# Gemini API
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash

# Embeddings
EMBEDDING_PROVIDER=bge-m3
HUGGINGFACE_API_KEY=your_hf_key

# WordPress Integration (NEW!)
WORDPRESS_API_URL=https://your-wordpress.com
WORDPRESS_API_KEY=bari_sk_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z
WEBHOOK_SECRET=5f8a7b3c2d1e9f4a6b8c7d5e3f1a9b7c
```

Save file (Ctrl+O, Enter, Ctrl+X di nano).

### Step 2: Rebuild Next.js

```bash
# Install dependencies (jika ada yang baru)
npm install

# Build untuk production
npm run build
```

**Output yang diharapkan:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (10/10)
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
...
```

### Step 3: Deploy/Restart

**Local Development:**
```bash
npm run dev
```

**Production (Vercel):**
```bash
# Set environment variables di Vercel dashboard
vercel env add WORDPRESS_API_URL production
vercel env add WORDPRESS_API_KEY production
vercel env add WEBHOOK_SECRET production

# Deploy
vercel --prod
```

**Production (Self-Hosted dengan PM2):**
```bash
# Restart aplikasi
pm2 restart nextjs

# Check logs
pm2 logs nextjs
```

---

## 5. Testing Integrasi

### Test 1: WordPress REST API

```bash
# Set variables
export WORDPRESS_API_URL="https://your-wordpress.com"
export WORDPRESS_API_KEY="bari_sk_..."

# Test endpoint
curl -H "X-API-Key: $WORDPRESS_API_KEY" \
  "$WORDPRESS_API_URL/wp-json/bari/v1/knowledge"
```

**Output yang diharapkan:**
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "total": 0,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

✅ **Jika muncul JSON response, API works!**

### Test 2: Webhook Endpoint

```bash
export WEBHOOK_SECRET="your-webhook-secret"
export NEXTJS_URL="https://your-nextjs-app.com"

curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $WEBHOOK_SECRET" \
  -d '{"event": "knowledge.updated", "data": {"id": 1}}' \
  "$NEXTJS_URL/api/webhooks/knowledge-updated"
```

**Output yang diharapkan:**
```json
{
  "success": true,
  "message": "Cache cleared successfully",
  "timestamp": "2025-12-21T10:30:00.000Z"
}
```

✅ **Jika success: true, webhook works!**

### Test 3: Create Knowledge → AI Uses It

#### 3.1 Create Knowledge di WordPress

1. Login WordPress Admin
2. **BARI Knowledge → Add Knowledge**
3. Isi form:
   ```
   Title: Test Integration
   Content: Ini adalah test untuk verifikasi integrasi antara WordPress dan Next.js berhasil.
   Category: Kalkulator
   Keywords: test, integration, verifikasi
   Status: Published
   ```
4. Klik **Publish**

#### 3.2 Test Search API

```bash
curl -H "X-API-Key: $WORDPRESS_API_KEY" \
  "$WORDPRESS_API_URL/wp-json/bari/v1/knowledge/search?q=test+integration"
```

**Output yang diharapkan:**
```json
{
  "success": true,
  "query": "test integration",
  "data": [
    {
      "id": 1,
      "title": "Test Integration",
      "content": "Ini adalah test...",
      "category_name": "Kalkulator",
      "relevance": 0.95
    }
  ],
  "total_results": 1
}
```

✅ **Jika knowledge muncul, search works!**

#### 3.3 Test AI Query

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "test integration", "stream": false}' \
  "$NEXTJS_URL/api/query"
```

**Output yang diharapkan:**
```json
{
  "answer": "Ini adalah test untuk verifikasi integrasi antara WordPress dan Next.js berhasil.",
  "citations": [
    {
      "source": "wordpress_knowledge",
      "title": "Test Integration",
      "category": "Kalkulator"
    }
  ],
  "metadata": {
    "source": "wordpress_knowledge",
    "knowledge_id": 1,
    "relevance": 0.95,
    "latency_ms": 234
  }
}
```

✅ **Jika AI menggunakan WordPress knowledge, INTEGRATION SUCCESS!** 🎉

---

## 6. Penggunaan untuk Admin

### 6.1 Akses Dashboard

1. Login WordPress Admin: `https://your-site.com/wp-admin`
2. Klik **BARI Knowledge** di sidebar kiri
3. Anda akan melihat Dashboard dengan:
   - **Statistics Cards**: Total Knowledge, Views, Questions Answered
   - **Popular Knowledge**: 5 knowledge paling sering digunakan
   - **Recent Activity**: Activity log terbaru
   - **Quick Actions**: Shortcut ke halaman penting

**Dashboard Screenshot (text representation):**
```
┌─────────────────────────────────────────────────────────┐
│ BARI Knowledge Management                               │
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│ │ 📚 Total │  │ 👁️ Views │  │ 💬 Quest │               │
│ │    248   │  │  12,453  │  │  8,921   │               │
│ └──────────┘  └──────────┘  └──────────┘               │
│                                                         │
│ 📈 Popular Knowledge                                    │
│ 1. Cara menghitung baja ringan ... 1,234 views         │
│ 2. Harga genteng metal ... 892 views                   │
│                                                         │
│ ⚡ Quick Actions                                        │
│ [+ Add Knowledge] [📋 View All] [⚙️ Settings]           │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Membuat Knowledge Baru

#### Step 1: Buka Form

**BARI Knowledge → Add Knowledge** atau klik **[+ Add Knowledge]** di dashboard

#### Step 2: Isi Form

**A. Title (Required)**
```
Field: Title
Value: Cara menghitung kebutuhan baja ringan untuk atap pelana
```

**Tips:**
- Gunakan bahasa natural seperti pertanyaan user
- Jelas dan deskriptif
- Max 500 karakter

**B. Content (Required)**

Gunakan WYSIWYG editor untuk format content:

```markdown
Untuk menghitung kebutuhan baja ringan untuk atap pelana, Anda perlu data berikut:

**1. Ukuran Bangunan:**
- Panjang bangunan (meter)
- Lebar bangunan (meter)

**2. Spesifikasi Atap:**
- Sudut kemiringan atap (derajat)
- Overstek/tritisan (biasanya 80-120cm)

**3. Material:**
- Jenis penutup atap (genteng metal, spandek, dll)

**Cara Mudah:**
Gunakan kalkulator BARI di website untuk estimasi otomatis:
1. Pilih model atap: Pelana
2. Masukkan ukuran bangunan
3. Pilih jenis material
4. Klik "Hitung"

**Hasil Perhitungan:**
- Rangka utama (Canal C): XX batang
- Rangka sekunder (Reng): XX batang
- Penutup atap: XX lembar
- Sekrup: XX buah

Untuk konsultasi lebih detail, hubungi tim teknis kami.
```

**Tips:**
- Gunakan formatting (bold, bullets, numbering)
- Tambahkan links jika perlu
- Jelas dan mudah dipahami
- Gunakan bahasa Indonesia yang baik

**C. Category**
```
Select: Kalkulator
```

Categories tersedia:
- Kalkulator - Pertanyaan tentang kalkulasi
- Produk - Info produk dan harga
- Teknis - Pertanyaan teknis
- Maintenance - Perawatan
- Garansi - Info garansi

**D. Tags (Optional)**
```
Field: Tags
Value: kalkulator, baja ringan, atap pelana, rangka, estimasi
```

**Tips:** Pisahkan dengan koma (,)

**E. Keywords (Optional)**
```
Field: Keywords
Value: hitung, kalkulator, estimasi, material, baja ringan, rangka, atap pelana
```

**Tips:**
- Keywords untuk improve search matching
- Gunakan sinonim dan variasi kata
- Pisahkan dengan koma

**F. Options**
```
☐ Requires Image
```

Check jika AI harus expect user upload image untuk pertanyaan ini.

#### Step 3: Preview dengan AI (Optional tapi Recommended!)

Sebelum publish, test dulu response AI:

1. Scroll ke section **"💡 AI Preview"**
2. Di field **"Test Query"**, masukkan: `gimana cara hitung kebutuhan baja ringan?`
3. Klik **[🔍 Test AI Response]**
4. Tunggu beberapa detik
5. Lihat **AI Response** yang muncul

**Contoh Output:**
```
AI Response:
Untuk menghitung kebutuhan baja ringan untuk atap pelana, Anda perlu data berikut:

1. Ukuran Bangunan:
- Panjang bangunan (meter)
- Lebar bangunan (meter)
...

Confidence: 95% | Latency: 1234ms
```

**Jika response tidak sesuai:**
- Edit content untuk lebih jelas
- Tambah keywords yang relevan
- Test lagi sampai puas

#### Step 4: Publish

**Pilihan Save:**

**A. Save as Draft** (simpan tanpa publish)
```
Status: Draft
Klik: [💾 Save Draft]
```

Draft bisa di-edit lagi nanti sebelum publish.

**B. Publish** (langsung publish)
```
Status: Published
Klik: [🚀 Publish]
```

Knowledge langsung available untuk AI.

**Success Message:**
```
✅ Knowledge created successfully! [Edit]
```

#### Step 5: Verifikasi

1. Buka **BARI Knowledge → All Knowledge**
2. Cari knowledge yang baru dibuat
3. Status harus **Published** (badge hijau)

### 6.3 Edit Knowledge

#### Step 1: Buka Knowledge

**BARI Knowledge → All Knowledge** → Klik row knowledge yang ingin di-edit

Atau klik **[✏️ Edit]** di row actions.

#### Step 2: Edit Content

- Edit title, content, category, tags, keywords sesuai kebutuhan
- Semua perubahan akan di-versioning otomatis
- Lihat **Version: X** di sidebar kanan

#### Step 3: Save Changes

Klik **[📝 Update]**

**Success Message:**
```
✅ Knowledge updated successfully!
```

**Yang Terjadi:**
1. Knowledge di-update di database
2. Version number naik (+1)
3. Snapshot lama disimpan di version history
4. Webhook triggered ke Next.js
5. Cache di Next.js cleared
6. AI langsung pakai knowledge terbaru

#### Step 4: View Version History

1. Di halaman edit, lihat **Version: 3** di sidebar
2. Klik **[📜 View Version History]** (future feature)
3. Lihat semua perubahan yang pernah dibuat
4. Bisa rollback ke versi sebelumnya

### 6.4 Bulk Operations

Untuk manage banyak knowledge sekaligus:

#### Step 1: Select Knowledge

1. **BARI Knowledge → All Knowledge**
2. Check ☑️ checkbox di knowledge yang ingin di-manage
3. Atau check **Select All** untuk pilih semua

#### Step 2: Choose Action

Di dropdown **Bulk Actions**, pilih:
- **Publish** - Publish semua selected knowledge
- **Move to Draft** - Ubah ke draft
- **Delete** - Hapus semua selected (hati-hati!)

#### Step 3: Apply

Klik **[Apply]**

**Confirm Dialog:**
```
Are you sure you want to [action] X knowledge entries?
[Cancel] [OK]
```

**Success Message:**
```
✅ X knowledge entries published.
```

### 6.5 Search & Filter

#### Search Knowledge

1. **BARI Knowledge → All Knowledge**
2. Di search box, ketik keyword: `baja ringan`
3. Klik **[Search]**
4. Hasil akan show semua knowledge yang match

#### Filter by Status

Klik tab di atas list:
- **Published** - Show semua knowledge yang published
- **Draft** - Show draft saja
- **Archived** - Show archived

#### Filter by Category

1. Dropdown **All Categories**
2. Pilih category: `Kalkulator`
3. Klik **[Filter]**
4. Hasil show knowledge di category tersebut saja

#### Kombinasi Filter

Bisa combine:
```
Status: Published
Category: Kalkulator
Search: "cara hitung"
```

### 6.6 Analytics & Monitoring

#### View Statistics

**Dashboard** shows:
- Total knowledge entries
- Total views (usage_count)
- Total questions answered

#### Popular Knowledge

List 5 knowledge paling sering digunakan (sorted by usage_count):
```
1. Cara menghitung baja ringan ... 1,234 views
2. Harga genteng metal ... 892 views
...
```

**Action:**
- Identify popular topics
- Create more similar content
- Update outdated popular content

#### Recent Activity

Log aktivitas terbaru:
```
🟢 Bu Sinta published "Harga Genteng Metal" 2 mins ago
🟡 Pak Budi created draft "Perawatan Atap" 1 hour ago
...
```

**Icons:**
- 🟢 Green = Published
- 🟡 Yellow = Draft
- 🔵 Blue = Archived

---

## 7. Penggunaan untuk End User

### 7.1 Guest User (Tidak Login)

#### Scenario: User Bertanya di Chatbot

**User membuka chatbot di website:**
```
https://your-nextjs-app.com
```

**User mengetik pertanyaan:**
```
User: gimana cara hitung kebutuhan baja ringan untuk rumah 10x12 meter?
```

**AI Processing:**
1. Intent Detection → `kalkulator`
2. Q&A Matching → No exact match
3. **WordPress Knowledge Search** → FOUND! (relevance: 0.95)
4. Return WordPress knowledge content

**AI Response:**
```
Untuk menghitung kebutuhan baja ringan untuk atap pelana, Anda perlu data berikut:

1. Ukuran Bangunan:
- Panjang: 10 meter ✓ (Anda sudah kasih)
- Lebar: 12 meter ✓ (Anda sudah kasih)

2. Spesifikasi Atap:
- Sudut kemiringan atap (derajat) → Berapa derajat yang Anda mau?
- Overstek/tritisan (biasanya 80-120cm) → Pakai berapa cm?

3. Material:
- Jenis penutup atap → Mau pakai genteng metal, spandek, atau apa?

Kalau Anda kasih info di atas, saya bisa bantu hitung estimasi materialnya! 🔧
```

**Advantages untuk Guest User:**
- ✅ **Unlimited queries** (no 8-query limit!)
- ✅ Fast responses (WordPress knowledge cached)
- ✅ Conversation history (7 days di localStorage)
- ❌ Can't access across devices

### 7.2 Logged-In User

**User login via WordPress:**
```
https://your-wordpress-site.com/wp-login.php
```

**After login, user visits chatbot:**
```
https://your-nextjs-app.com
```

**AI Response dengan Personalization:**
```
Halo Pak Budi! 👋

[Same answer as above, tapi dengan:]
- Personalized greeting
- User history context
- Procurement whisper (jika user = procurement team)
```

**Advantages untuk Logged-In User:**
- ✅ **Unlimited queries** (no 50/day limit!)
- ✅ Personalized responses
- ✅ **Cross-device conversation history**
- ✅ Procurement whisper (untuk procurement team)
- ✅ Better analytics untuk admin

**Conversation History:**

Semua conversation disimpan di `wp_bari_conversations` table:

```sql
SELECT * FROM wp_bari_conversations WHERE user_id = 123 ORDER BY created_at DESC LIMIT 10;
```

Purpose:
- Analytics (popular questions, trends)
- Cross-device sync
- Quality monitoring
- **NOT for limiting queries!**

---

## 8. Troubleshooting

### Issue 1: Plugin Activation Failed

**Error:**
```
Plugin requires PostgreSQL database
```

**Diagnosis:**
```bash
# Check database type
wp db query "SELECT version();"
```

**Solution:**

A. **Jika menggunakan MySQL:**

WordPress plugin ini **memerlukan PostgreSQL**. Anda perlu:
1. Migrate database ke PostgreSQL
2. Install PostgreSQL support di WordPress
3. Update `wp-config.php`:
   ```php
   define('DB_TYPE', 'pgsql');
   ```

B. **Jika sudah PostgreSQL tapi error:**

Check connection:
```bash
# Test connection
psql -h localhost -U postgres -d wordpress_db -c "SELECT 1;"
```

### Issue 2: API Returns 401 Unauthorized

**Error:**
```json
{
  "error": "Invalid API key",
  "status": 401
}
```

**Diagnosis:**
```bash
# Check API key di Next.js
echo $WORDPRESS_API_KEY

# Check API key di WordPress
wp db query "SELECT id, name, key_prefix, is_active FROM wp_bari_api_keys;"
```

**Solution:**

A. **API key salah atau tidak ada:**

Generate new API key:
1. WordPress Admin → **BARI Knowledge → Settings**
2. Scroll ke **API Keys**
3. Enter name: `Next.js`
4. Click **Generate New Key**
5. **COPY KEY** (shown once!)
6. Update `.env.local` di Next.js:
   ```bash
   WORDPRESS_API_KEY=bari_sk_NEW_KEY_HERE
   ```
7. Rebuild Next.js: `npm run build`
8. Restart: `pm2 restart nextjs` atau `vercel --prod`

B. **API key tidak aktif:**

```bash
# Activate API key
wp db query "UPDATE wp_bari_api_keys SET is_active = 1 WHERE id = 1;"
```

### Issue 3: Webhook Not Triggering

**Symptom:**
- Knowledge updated di WordPress
- Cache di Next.js tidak cleared
- AI masih pakai data lama

**Diagnosis:**

A. **Check webhook URL:**
```bash
wp option get bkm_nextjs_webhook_url
```

Expected: `https://your-nextjs-app.com` (no trailing slash)

B. **Check webhook secret:**
```bash
# WordPress
wp option get bkm_webhook_secret

# Next.js .env.local
cat .env.local | grep WEBHOOK_SECRET
```

Harus sama!

C. **Test webhook manually:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: YOUR_SECRET" \
  -d '{"event": "test"}' \
  https://your-nextjs-app.com/api/webhooks/knowledge-updated
```

Expected response:
```json
{"success": true, "message": "Cache cleared successfully"}
```

**Solution:**

A. **Update webhook URL di WordPress:**
1. **BARI Knowledge → Settings**
2. Update **Next.js Webhook URL**: `https://your-nextjs-app.com`
3. **Save Settings**

B. **Sync webhook secret:**
```bash
# Get secret from WordPress
SECRET=$(wp option get bkm_webhook_secret)

# Update Next.js .env.local
echo "WEBHOOK_SECRET=$SECRET" >> .env.local

# Rebuild & restart
npm run build && pm2 restart nextjs
```

C. **Check firewall/network:**
```bash
# Test if Next.js can reach WordPress
curl -I https://your-wordpress.com

# Test if WordPress can reach Next.js
# (run this from WordPress server)
curl -I https://your-nextjs-app.com
```

### Issue 4: Knowledge Not Appearing in AI Responses

**Symptom:**
- Knowledge created & published di WordPress
- API returns knowledge correctly
- But AI tidak gunakan knowledge tersebut

**Diagnosis:**

A. **Check knowledge status:**
```bash
wp db query "SELECT id, title, status FROM wp_bari_knowledge WHERE id = 1;"
```

Expected: `status = 'published'` (not `draft`)

B. **Test WordPress search API:**
```bash
curl -H "X-API-Key: $WORDPRESS_API_KEY" \
  "$WORDPRESS_API_URL/wp-json/bari/v1/knowledge/search?q=test"
```

Expected: Knowledge muncul di results

C. **Check Next.js logs:**
```bash
# Local
npm run dev

# Production
pm2 logs nextjs | grep "WordPress"
```

Look for:
```
🔍 Searching WordPress knowledge: "test"
✅ Found 1 results from WordPress
```

**Solution:**

A. **Publish knowledge:**
1. Edit knowledge di WordPress
2. Change status to **Published**
3. Click **Update**

B. **Improve keywords:**
1. Edit knowledge
2. Add more keywords: `test, integration, verifikasi`
3. Update

C. **Clear cache manually:**
```bash
curl -X POST \
  -H "X-Webhook-Secret: $WEBHOOK_SECRET" \
  https://your-nextjs-app.com/api/webhooks/knowledge-updated
```

D. **Restart Next.js:**
```bash
pm2 restart nextjs
```

### Issue 5: Autosave Tidak Bekerja

**Symptom:**
- Edit knowledge di WordPress
- Tidak ada message "Draft saved"
- Changes tidak tersimpan

**Diagnosis:**

Check browser console (F12 → Console):
```
Failed to load resource: the server responded with a status of 403 (Forbidden)
```

**Solution:**

A. **Check user permissions:**
```bash
# Check current user capabilities
wp user get admin --field=capabilities
```

Expected: `bkm_create_knowledge` ada di list

B. **Add missing capabilities:**
```bash
# For administrator
wp cap add administrator bkm_create_knowledge
wp cap add administrator bkm_edit_knowledge

# For editor
wp cap add editor bkm_create_knowledge
wp cap add editor bkm_edit_knowledge
```

C. **Re-activate plugin:**
```bash
wp plugin deactivate bajaringan-knowledge-manager
wp plugin activate bajaringan-knowledge-manager
```

### Issue 6: AI Preview Timeout

**Symptom:**
- Click "Test AI Response"
- Loading... tidak selesai
- Timeout error

**Diagnosis:**

A. **Check Next.js URL di WordPress settings:**
```bash
wp option get bkm_nextjs_webhook_url
```

B. **Test Next.js /api/query endpoint:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "stream": false}' \
  https://your-nextjs-app.com/api/query
```

**Solution:**

A. **Update Next.js URL:**
WordPress Settings → Update webhook URL

B. **Increase timeout di `class-bkm-core.php`:**
```php
// Line ~75
'timeout' => 30  // Increase from 10 to 30 seconds
```

C. **Disable AI Preview temporarily:**
Comment out the preview section di `knowledge-edit.php` lines ~200-250

---

## 9. Best Practices

### 9.1 Untuk Admin

✅ **DO:**
- Preview dengan AI sebelum publish
- Gunakan keywords yang vary (sinonim)
- Categorize knowledge dengan benar
- Update knowledge yang outdated
- Monitor popular knowledge dan optimize
- Backup database regularly

❌ **DON'T:**
- Publish tanpa test preview
- Pakai title yang terlalu general
- Duplicate content
- Delete knowledge yang masih digunakan
- Ignore analytics

### 9.2 Untuk Developer

✅ **DO:**
- Always use environment variables
- Test di staging sebelum production
- Monitor API response times
- Check webhook logs
- Keep plugin updated
- Backup before major updates

❌ **DON'T:**
- Hardcode API keys
- Deploy tanpa testing
- Skip backups
- Ignore error logs
- Modify core plugin files (use hooks)

### 9.3 Security

✅ **DO:**
- Use strong API keys (32+ chars)
- Rotate API keys periodically
- Use HTTPS for all connections
- Limit API key permissions
- Monitor unusual activity
- Keep WordPress & PHP updated

❌ **DON'T:**
- Share API keys publicly
- Use same key for dev & prod
- Disable SSL verification
- Give unnecessary permissions
- Ignore security warnings

---

## 10. FAQ

**Q: Berapa lama knowledge muncul di AI setelah publish?**

A: **Instant!** Webhook triggered saat publish, cache cleared, knowledge langsung available.

**Q: Apakah ada limit untuk jumlah knowledge?**

A: **Tidak ada limit**. Anda bisa create unlimited knowledge entries.

**Q: Bagaimana cara backup knowledge?**

A: Export via database:
```bash
wp db export knowledge-backup.sql
```

Atau via WordPress admin (future feature: Export to CSV/JSON)

**Q: Bisa import knowledge dari file?**

A: Saat ini belum ada UI untuk import. Tapi bisa via SQL:
```sql
INSERT INTO wp_bari_knowledge (title, content, status, ...) VALUES (...);
```

Future: Import CSV/JSON feature.

**Q: Knowledge bisa multi-language?**

A: Saat ini Bahasa Indonesia only. Multi-language support bisa ditambahkan di future.

**Q: Bagaimana cara rollback ke version sebelumnya?**

A: Version history sudah tracked di `wp_bari_knowledge_versions`. UI untuk rollback akan ditambahkan di future version.

**Q: Apakah knowledge bisa schedule publish?**

A: Saat ini belum support. Bisa pakai Draft → manually publish nanti.

**Q: Berapa lama conversation history disimpan?**

A:
- Guest users: 7 days di localStorage
- Logged-in users: Unlimited di WordPress database

**Q: Apakah ada limit untuk guest users?**

A: **Tidak!** No query limits untuk siapapun (guest atau logged-in).

---

## 11. Support & Resources

### Documentation

| Resource | Path |
|----------|------|
| Full System Docs | `docs/KNOWLEDGE_MANAGEMENT_SYSTEM.md` |
| Implementation Plan | `docs/IMPLEMENTATION_PLAN.md` |
| Quick Summary | `docs/IMPLEMENTATION_SUMMARY.md` |
| Final Status | `docs/FINAL_IMPLEMENTATION_STATUS.md` |
| **This Tutorial** | `docs/TUTORIAL_LENGKAP.md` |

### Links

- WordPress REST API Docs: `https://your-site.com/wp-json/bari/v1/`
- Webhook Endpoint: `https://your-nextjs-app.com/api/webhooks/knowledge-updated`

### Contact

- Email: support@bajaringan.com
- Phone: +62 812-3456-7890

---

**Selamat menggunakan BARI Knowledge Management System!** 🎉

© 2025 Bajaringan. All rights reserved.
