import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { HIRAYA_NITH_SYSTEM_PROMPT } from "@/lib/prompts/hiraya-system-prompt";
import { DEFAULT_GROQ_MODEL } from "@/lib/rag/groq-models";

function extractChunkText(chunk: unknown): string {
  if (!chunk) return "";
  if (typeof chunk === "string") return chunk;
  if (typeof chunk === "object" && chunk !== null && "content" in chunk) {
    const content = (chunk as { content: unknown }).content;
    return typeof content === "string" ? content : "";
  }
  return "";
}

export async function streamAnswer(
  context: string,
  question: string,
  modelId: string = DEFAULT_GROQ_MODEL,
) {
  const chatModel = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: modelId,
    temperature: 0.1,
  });
  const prompt = ChatPromptTemplate.fromTemplate(HIRAYA_NITH_SYSTEM_PROMPT);
  const chain = prompt.pipe(chatModel);
  return chain.stream({ context, question });
}

export function extractStreamChunk(chunk: unknown): string {
  return extractChunkText(chunk);
}
