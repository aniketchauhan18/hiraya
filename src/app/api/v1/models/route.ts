import { NextResponse } from "next/server";
import {
  DEFAULT_GROQ_MODEL,
  GROQ_CHAT_ALLOWLIST,
  labelForGroqModel,
  resolveGroqModel,
  type GroqChatModel,
} from "@/lib/rag/groq-models";

type GroqModelRow = {
  id: string;
  active?: boolean;
};

type CacheEntry = {
  models: GroqChatModel[];
  expiresAt: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: CacheEntry | null = null;

function fallbackModels(): GroqChatModel[] {
  return GROQ_CHAT_ALLOWLIST.map((m) => ({ id: m.id, label: m.label }));
}

async function fetchActiveAllowlistedModels(): Promise<GroqChatModel[]> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.models;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return fallbackModels();
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error("Groq models list failed:", res.status, await res.text());
      return fallbackModels();
    }

    const json = (await res.json()) as { data?: GroqModelRow[] };
    const activeIds = new Set(
      (json.data ?? [])
        .filter((m) => m.active !== false)
        .map((m) => m.id),
    );

    const models = GROQ_CHAT_ALLOWLIST.filter((m) => activeIds.has(m.id)).map(
      (m) => ({ id: m.id, label: labelForGroqModel(m.id) }),
    );

    const result =
      models.length > 0
        ? models
        : [{ id: DEFAULT_GROQ_MODEL, label: labelForGroqModel(DEFAULT_GROQ_MODEL) }];

    cache = { models: result, expiresAt: Date.now() + CACHE_TTL_MS };
    return result;
  } catch (err) {
    console.error("Groq models list error:", err);
    return fallbackModels();
  }
}

export async function GET() {
  const models = await fetchActiveAllowlistedModels();
  const defaultModel = resolveGroqModel(
    models.some((m) => m.id === DEFAULT_GROQ_MODEL)
      ? DEFAULT_GROQ_MODEL
      : models[0]?.id,
  );

  return NextResponse.json(
    { models, defaultModel },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    },
  );
}
