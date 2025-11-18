# RAG Chatbot Deployment Runbook

Panduan lengkap deployment RAG Chatbot ke Vercel dengan Neon Database.

---

## Prerequisites

1. **Node.js** v18+ dan npm/yarn
2. **Vercel Account** - [https://vercel.com](https://vercel.com)
3. **Neon Account** - [https://neon.tech](https://neon.tech)
4. **API Keys**:
   - Gemini API Key - [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   - Hugging Face API Key - [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
   - (Optional) OpenAI API Key - [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

---

## Step 1: Setup Neon Database

### 1.1 Create Neon Project

1. Login ke [Neon Console](https://console.neon.tech)
2. Click **"New Project"**
3. Berikan nama: `rag-chatbot-db`
4. Pilih region terdekat (Singapore/US)
5. Click **"Create Project"**

### 1.2 Enable pgvector Extension

1. Di Neon Console, buka **SQL Editor**
2. Jalankan query:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

3. Verify dengan:

```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### 1.3 Get Connection String

1. Di Neon Console, klik **"Connection Details"**
2. Copy **Connection String** (format: `postgresql://user:pass@host.neon.tech/db`)
3. Save untuk digunakan nanti

---

## Step 2: Local Development Setup

### 2.1 Install Dependencies

```bash
npm install
```

### 2.2 Configure Environment Variables

1. Copy `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

2. Edit `.env` dan isi semua values:

```env
# Database
NEON_DB_URL=postgresql://user:password@host.neon.tech/database?sslmode=require

# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Embeddings (pilih salah satu)
EMBEDDING_PROVIDER=bge-m3
HUGGINGFACE_API_KEY=your_huggingface_key

# atau gunakan OpenAI
# EMBEDDING_PROVIDER=openai
# OPENAI_API_KEY=your_openai_key

# Document Processing
CHUNK_SIZE=800
CHUNK_OVERLAP=200
```

### 2.3 Run Database Migrations

```bash
npm run migrate
```

Expected output:
```
✅ Migrations completed successfully!
📊 Tables created:
  - documents
  - chunks
  - query_logs
```

### 2.4 Test Locally

```bash
npm run dev
```

Buka:
- Chat: [http://localhost:3000/chat](http://localhost:3000/chat)
- Admin: [http://localhost:3000/admin/upload](http://localhost:3000/admin/upload)

---

## Step 3: Deploy to Vercel

### 3.1 Install Vercel CLI (Optional)

```bash
npm i -g vercel
```

### 3.2 Deploy via Vercel Dashboard

1. Login ke [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import repository GitHub/GitLab
4. **Framework Preset**: Next.js (auto-detected)
5. **Build Command**: `next build`
6. **Output Directory**: `.next`

### 3.3 Configure Environment Variables

Di Vercel Project Settings → Environment Variables, tambahkan:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEON_DB_URL` | `postgresql://...` | Production, Preview, Development |
| `GEMINI_API_KEY` | `your_key` | Production, Preview, Development |
| `EMBEDDING_PROVIDER` | `bge-m3` | Production, Preview, Development |
| `HUGGINGFACE_API_KEY` | `your_key` | Production, Preview, Development |
| `CHUNK_SIZE` | `800` | Production, Preview, Development |
| `CHUNK_OVERLAP` | `200` | Production, Preview, Development |

**Note**: Pastikan semua environment variables ada di **Production**, **Preview**, dan **Development**.

### 3.4 Deploy

```bash
vercel --prod
```

Atau push ke branch `main` untuk auto-deploy.

---

## Step 4: Post-Deployment Verification

### 4.1 Verify Database Connection

1. Check Vercel deployment logs
2. Look for: `✅ NeonDB initialized successfully`

### 4.2 Test Upload

1. Buka `https://your-app.vercel.app/admin/upload`
2. Upload sample PDF/DOCX
3. Verify di logs: chunks processed successfully

### 4.3 Test Chat

1. Buka `https://your-app.vercel.app/chat`
2. Ask question related to uploaded document
3. Verify answer + citations

---

## Step 5: Batch Indexing (Optional)

Untuk batch upload dari local folder:

### 5.1 Prepare Documents Folder

```bash
mkdir documents
# Copy PDF/DOCX/TXT/MD files ke folder ini
```

### 5.2 Run Batch Index

```bash
npm run index documents
```

Expected output:
```
📁 Indexing folder: documents
📄 Found 10 files to index

[1/10] Processing: document1.pdf
  ✂️  50 chunks
  🔮 50 embeddings
  ✅ Indexed successfully
...
✅ Successfully indexed: 10 files
```

### 5.3 Reindex (Drop & Rebuild)

```bash
npm run reindex documents
```

**WARNING**: Ini akan DELETE semua data!

---

## Step 6: Monitoring & Maintenance

### 6.1 Check Database Stats

Buka admin page untuk melihat:
- Total Documents
- Total Chunks
- Total Queries

### 6.2 Monitor Vercel Logs

```bash
vercel logs --follow
```

### 6.3 Database Maintenance

Neon akan auto-scale, tapi monitor:
- Storage usage di Neon Console
- Connection pool limits
- Query performance

### 6.4 Backup Strategy

Neon provides automatic backups:
1. Buka Neon Console → Backups
2. Set retention policy
3. Enable point-in-time recovery

---

## Troubleshooting

### Issue: "pgvector extension not found"

**Solution**:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Issue: "Connection timeout"

**Solution**:
- Check NEON_DB_URL format
- Verify SSL mode: `?sslmode=require`
- Check Neon project is not suspended

### Issue: "Embedding API rate limit"

**Solution**:
- Reduce batch size di `embedBatch()` function
- Add delay between requests
- Upgrade HuggingFace/OpenAI plan

### Issue: "Vercel deployment timeout"

**Solution**:
- Vercel has 10s timeout for Hobby plan
- Optimize chunking (reduce chunk size)
- Use streaming for large responses

### Issue: "Out of memory during indexing"

**Solution**:
- Process files in smaller batches
- Increase Vercel function memory limit (Pro plan)
- Use batch indexing script locally

---

## Performance Optimization

### 1. Chunking Strategy

Adjust di `.env`:
```env
CHUNK_SIZE=600        # Smaller chunks = more granular search
CHUNK_OVERLAP=150     # Balance between context & duplicates
```

### 2. Vector Search Tuning

Edit `database/schema.sql`:
```sql
-- Adjust HNSW index parameters
CREATE INDEX chunks_embedding_idx ON chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 24, ef_construction = 100);  -- Higher = better recall, slower build
```

### 3. Embedding Provider

**BGE-M3** (default):
- Pros: Free, 1024-dim, multilingual
- Cons: Slower than OpenAI

**OpenAI**:
- Pros: Faster, reliable
- Cons: Paid, 1536-dim

Switch via:
```env
EMBEDDING_PROVIDER=openai
```

### 4. LLM Model

Edit `src/llm/gemini.ts`:
```typescript
private model: string = 'gemini-2.0-flash-exp';  // Faster
// or
private model: string = 'gemini-pro';            // More accurate
```

---

## Security Best Practices

1. **Never commit `.env`** to Git
2. **Rotate API keys** regularly
3. **Enable Vercel authentication** for admin routes
4. **Set rate limits** on API routes
5. **Use Vercel Edge Config** for secrets
6. **Monitor query logs** for abuse

---

## Cost Estimation (Per Month)

| Service | Free Tier | Paid Plan |
|---------|-----------|-----------|
| Vercel | Hobby (Free) | Pro ($20/mo) |
| Neon | Free 0.5GB | Scale ($19/mo) |
| Gemini API | Free quota | Pay-as-you-go |
| HuggingFace | Free inference | Pro ($9/mo) |
| OpenAI (fallback) | - | Pay-per-token |

**Estimated**: $0-50/month depending on usage.

---

## Scaling Considerations

### When to Scale

- \> 1000 documents
- \> 100k chunks
- \> 10k queries/month
- Database \> 5GB

### Scaling Options

1. **Database**: Upgrade Neon to Scale plan
2. **Compute**: Upgrade Vercel to Pro (longer timeouts)
3. **Embeddings**: Use dedicated inference server
4. **Caching**: Add Redis for frequently asked queries

---

## Support & Resources

- **Neon Docs**: [https://neon.tech/docs](https://neon.tech/docs)
- **Vercel Docs**: [https://vercel.com/docs](https://vercel.com/docs)
- **Gemini API**: [https://ai.google.dev/docs](https://ai.google.dev/docs)
- **pgvector**: [https://github.com/pgvector/pgvector](https://github.com/pgvector/pgvector)

---

## Checklist

- [ ] Neon database created & pgvector enabled
- [ ] All environment variables configured
- [ ] Database migrations run successfully
- [ ] Local development tested
- [ ] Deployed to Vercel
- [ ] Upload & chat tested on production
- [ ] Monitoring setup
- [ ] Backup strategy configured

---

**Deployment complete!** 🎉

Untuk pertanyaan atau issues, buka GitHub Issues atau contact support.
