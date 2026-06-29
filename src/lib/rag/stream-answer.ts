import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { HIRAYA_NITH_SYSTEM_PROMPT } from "@/lib/prompts/hiraya-system-prompt";

const chatModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
  temperature: 0.1,
});

function extractChunkText(chunk: unknown): string {
  if (!chunk) return "";
  if (typeof chunk === "string") return chunk;
  if (typeof chunk === "object" && chunk !== null && "content" in chunk) {
    const content = (chunk as { content: unknown }).content;
    return typeof content === "string" ? content : "";
  }
  return "";
}

export async function streamAnswer(context: string, question: string) {
  const prompt = ChatPromptTemplate.fromTemplate(HIRAYA_NITH_SYSTEM_PROMPT);
  const chain = prompt.pipe(chatModel);
  return chain.stream({ context, question });
}

export function extractStreamChunk(chunk: unknown): string {
  return extractChunkText(chunk);
}
