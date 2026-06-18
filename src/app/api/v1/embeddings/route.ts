import chunkText from "@/helpers/chunker";
import { storeTextChunks } from "@/lib/rag";
import { verifyEmbeddingsSecret } from "@/lib/verify-embeddings-secret";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<Response> {
  if (!process.env.EMBEDDINGS_API_SECRET) {
    return NextResponse.json(
      { message: "Embeddings API is not configured on the server" },
      { status: 503 },
    );
  }

  if (!verifyEmbeddingsSecret(req)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { embeddingText } = await req.json();

    if (!embeddingText || typeof embeddingText !== "string") {
      return NextResponse.json(
        { message: "Please provide embeddingText in the request body" },
        { status: 400 },
      );
    }

    const chunks = chunkText(embeddingText, 1536);
    const inserted = await storeTextChunks(chunks);

    return NextResponse.json(
      {
        message: "embeddings stored successfully",
        chunksInserted: inserted,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Internal server error while adding embeddings" },
      { status: 500 },
    );
  }
}
