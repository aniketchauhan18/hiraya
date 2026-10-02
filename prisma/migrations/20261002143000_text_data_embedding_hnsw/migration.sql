-- HNSW requires a fixed vector dimension; column was unbounded `vector`.
ALTER TABLE "TextData"
  ALTER COLUMN embedding TYPE vector(384)
  USING embedding::vector(384);

CREATE INDEX IF NOT EXISTS "TextData_embedding_hnsw_idx"
  ON "TextData"
  USING hnsw (embedding vector_cosine_ops);
