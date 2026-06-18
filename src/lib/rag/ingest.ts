import { prisma } from "@/lib/db";
import { embedDocuments } from "./embed";
import pgvector from "pgvector";

export async function storeTextChunks(chunks: string[]): Promise<number> {
  const embeddings = await embedDocuments(chunks);
  let inserted = 0;

  for (let i = 0; i < chunks.length; i++) {
    if (embeddings[i]?.length > 0) {
      const sqlEmbedding = pgvector.toSql(embeddings[i]);
      await prisma.$executeRaw`
        INSERT INTO "TextData" ("text", "embedding")
        VALUES (${chunks[i]}, ${sqlEmbedding}::vector)
      `;
      inserted++;
    }
  }

  return inserted;
}
