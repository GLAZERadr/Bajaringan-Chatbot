-- Update embedding dimension from 1024 to 1536 (for OpenAI embeddings)
-- Run this if you're using EMBEDDING_PROVIDER=openai

-- Drop existing index
DROP INDEX IF EXISTS chunks_embedding_idx;

-- Alter column dimension
ALTER TABLE chunks ALTER COLUMN embedding TYPE vector(1536);

-- Recreate index
CREATE INDEX chunks_embedding_idx ON chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
