import { NextRequest, NextResponse } from "next/server";
import {
  extractStreamChunk,
  retrieveContext,
  streamAnswer,
} from "@/lib/rag";

function extractChunkText(chunk: unknown): string {
  return extractStreamChunk(chunk);
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json(
        { message: "Please provide query in the request body" },
        { status: 400 },
      );
    }

    const { context } = await retrieveContext(query);
    const llmStream = await streamAnswer(context, query);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of llmStream) {
            const text = extractChunkText(chunk);
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Internal server error while processing" },
      { status: 500 },
    );
  }
}
