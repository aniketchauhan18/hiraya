import { prisma } from "@/lib/db";
import pgvector from "pgvector";
import { embedQuery } from "./embed";

export const NO_CONTEXT_MARKER = "[NO CONTEXT RETRIEVED]";
const RETRIEVAL_LIMIT = 5;
const MAX_DISTANCE = 1.2;

export interface RetrievedChunk {
  id: number;
  text: string;
  distance: number;
}

export async function retrieveContext(query: string): Promise<{
  context: string;
  chunks: RetrievedChunk[];
}> {
  const queryEmbedding = await embedQuery(query);
  const sqlEmbeddings = pgvector.toSql(queryEmbedding);

  const rows = await prisma.$queryRaw<
    { id: number; text: string; distance: number }[]
  >`
    SELECT id, text, (embedding <-> ${sqlEmbeddings}::vector(384))::float AS distance
    FROM "TextData"
    ORDER BY distance
    LIMIT ${RETRIEVAL_LIMIT}
  `;

  const chunks = rows.filter((row) => row.distance <= MAX_DISTANCE);

  const context =
    chunks
      .map((row) => row.text.trim())
      .filter(Boolean)
      .join("\n\n") || NO_CONTEXT_MARKER;

  return { context, chunks };
}
