export type GroqChatModel = {
  id: string;
  label: string;
};

export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";

/** Curated chat LLMs only — no Whisper, Guard, TTS, or other non-chat models. */
export const GROQ_CHAT_ALLOWLIST: readonly GroqChatModel[] = [
  { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B" },
  { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B" },
  { id: "qwen/qwen3.8-27b", label: "Qwen 3.8 27B" },
  { id: "allam-2-7b", label: "ALLaM 2 7B" },
] as const;

const ALLOWED_IDS = new Set(GROQ_CHAT_ALLOWLIST.map((m) => m.id));

export function isAllowedGroqModel(id: string): boolean {
  return ALLOWED_IDS.has(id);
}

export function resolveGroqModel(model?: string | null): string {
  if (model && isAllowedGroqModel(model)) {
    return model;
  }
  const fromEnv = process.env.GROQ_MODEL;
  if (fromEnv && isAllowedGroqModel(fromEnv)) {
    return fromEnv;
  }
  return DEFAULT_GROQ_MODEL;
}

export function labelForGroqModel(id: string): string {
  return GROQ_CHAT_ALLOWLIST.find((m) => m.id === id)?.label ?? id;
}
