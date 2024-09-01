import pgvector from "pgvector";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
// import { db } from "@/lib/db";
import chunkText from "@/helpers/chunker";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const embeddingModel = new HuggingFaceTransformersEmbeddings({
  model: "Xenova/all-MiniLM-L6-v2",
});

// storing embedding in the database
export async function POST(
  req: NextRequest,
  res: NextResponse,
): Promise<Response> {
  try {
    const { embeddingText } = await req.json();

    // create chunks from this embedding text
    const chunks = chunkText(embeddingText, 1536); // array of strings (overlapping strings)

    // generating embeddings from these chunks
    const embeddings = await embeddingModel.embedDocuments(chunks); // array of multiple dimension vector embedding current 384 as of now

    // storing in the database
    for (let i = 0; i < chunks.length; i++) {
      if (embeddings[i].length > 0) {
        // insert vector
        const embgs = pgvector.toSql(embeddings[i]);
        console.log(embgs);
        const dbRes =
          await prisma.$executeRaw`INSERT INTO "TextData" ("text", "embedding") VALUES (${chunks[i]}, ${embgs}::vector)`;
        console.log("Data inserted successfully:", dbRes);
      }
    }
    return NextResponse.json(
      {
        message: "embeddings stored successfully",
      },
      {
        status: 201,
      },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      {
        message: "Internal server error while adding embeddings",
      },
      {
        status: 500,
      },
    );
  }
}
