# RAG Chatbot - Next.js + Gemini + NeoDB

Production-ready RAG (Retrieval Augmented Generation) chatbot built with Next.js, Google Gemini LLM, and Neon PostgreSQL with pgvector.

## Features

- **Semantic Search**: Vector similarity search dengan pgvector
- **Multi-format Support**: PDF, DOCX, TXT, Markdown
- **Smart Chunking**: Intelligent document chunking dengan overlap
- **Citation Tracking**: Automatic source citations untuk setiap answer
- **Admin Dashboard**: Upload & manage knowledge base
- **Chat Interface**: ChatGPT-style UI dengan streaming support
- **Batch Indexing**: CLI scripts untuk bulk document processing
- **Scalable**: Deploy ke Vercel dengan Neon serverless database

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Neon PostgreSQL + pgvector
- **Embeddings**: BGE-M3 (HuggingFace) / OpenAI text-embedding-3-small
- **LLM**: Google Gemini 2.0 Flash
- **Deployment**: Vercel

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
NEON_DB_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require
GEMINI_API_KEY=your_gemini_key
EMBEDDING_PROVIDER=bge-m3
HUGGINGFACE_API_KEY=your_hf_key
CHUNK_SIZE=800
CHUNK_OVERLAP=200
```

### 3. Run Migrations

```bash
npm run migrate
```

### 4. Start Development Server

```bash
npm run dev
```

Open:
- Chat: [http://localhost:3000/chat](http://localhost:3000/chat)
- Admin: [http://localhost:3000/admin/upload](http://localhost:3000/admin/upload)

## Project Structure

```
bajaringan-calculator/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── query/route.ts          # RAG query endpoint
│   │   │   ├── upload/route.ts         # File upload endpoint
│   │   │   └── documents/route.ts      # Document management
│   │   ├── chat/page.tsx               # Chat interface
│   │   └── admin/upload/page.tsx       # Admin dashboard
│   ├── vector/
│   │   └── neondb.ts                   # Vector DB layer
│   ├── embeddings/
│   │   └── index.ts                    # Embeddings providers
│   ├── llm/
│   │   └── gemini.ts                   # Gemini LLM integration
│   └── utils/
│       └── document-processor.ts       # Document extraction & chunking
├── database/
│   ├── schema.sql                      # Database schema
│   └── migrate.ts                      # Migration script
├── scripts/
│   ├── index.ts                        # Batch indexing script
│   └── reindex.ts                      # Reindex script
├── .env.example                        # Environment template
└── RUNBOOK-DEPLOY.md                   # Deployment guide
```

## Usage

### Upload Documents (Web UI)

1. Navigate to `/admin/upload`
2. Click "Select File" dan pilih PDF/DOCX/TXT/MD
3. Click "Upload & Index"
4. Wait for processing to complete

### Chat with Documents

1. Navigate to `/chat`
2. Type your question
3. Receive answer dengan citations dari knowledge base

### Batch Indexing (CLI)

Index semua files dalam folder:

```bash
npm run index ./documents
```

Reindex (drop & rebuild):

```bash
npm run reindex ./documents
```

## API Endpoints

### POST /api/query

Query RAG system.

**Request**:
```json
{
  "query": "What is RAG?",
  "k": 5
}
```

**Response**:
```json
{
  "answer": "RAG stands for...",
  "citations": [
    {
      "document_name": "intro.pdf",
      "content": "...",
      "page": 1
    }
  ],
  "metadata": {
    "chunks_retrieved": 5,
    "latency_ms": 1234
  }
}
```

### POST /api/upload

Upload and index document.

**Request**: `multipart/form-data` dengan field `file`

**Response**:
```json
{
  "success": true,
  "document_id": "uuid",
  "filename": "doc.pdf",
  "total_chunks": 42
}
```

### GET /api/documents

List all documents.

**Response**:
```json
{
  "documents": [...],
  "stats": {
    "total_documents": 10,
    "total_chunks": 500,
    "total_queries": 1000
  }
}
```

### DELETE /api/documents

Delete documents.

**Request**:
```json
{
  "document_ids": ["uuid1", "uuid2"]
}
```

## Configuration

### Embedding Providers

**BGE-M3** (default):
```env
EMBEDDING_PROVIDER=bge-m3
HUGGINGFACE_API_KEY=your_key
```

**OpenAI**:
```env
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=your_key
```

### Chunking Parameters

Adjust di `.env`:
```env
CHUNK_SIZE=800        # Characters per chunk
CHUNK_OVERLAP=200     # Overlap between chunks
```

### LLM Model

Edit `src/llm/gemini.ts`:
```typescript
private model: string = 'gemini-2.0-flash-exp';
```

## Deployment

See [RUNBOOK-DEPLOY.md](./RUNBOOK-DEPLOY.md) untuk deployment guide lengkap.

### Quick Deploy to Vercel

```bash
vercel --prod
```

Jangan lupa set environment variables di Vercel Dashboard.

## Development

### Type Checking

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Troubleshooting

### "pgvector extension not found"

Run di Neon SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### "Embedding API rate limit"

- Reduce batch size di `embedBatch()`
- Add delays between requests
- Upgrade API plan

### "Vercel timeout"

- Optimize chunk size
- Use streaming responses
- Upgrade to Vercel Pro

See [RUNBOOK-DEPLOY.md](./RUNBOOK-DEPLOY.md) untuk lebih banyak troubleshooting tips.

## License

MIT

## Support

Untuk questions atau issues, buka GitHub Issues.

---

Built with ❤️ using Next.js, Gemini, and Neon
