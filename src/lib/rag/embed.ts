const HF_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}/pipeline/feature-extraction`;
export const EMBEDDING_DIM = 384;

function getApiKey(): string {
  const key = process.env.HUGGING_FACE_API;
  if (!key) {
    throw new Error("HUGGING_FACE_API is not configured");
  }
  return key;
}

function meanPool(tokenEmbeddings: number[][]): number[] {
  const dim = tokenEmbeddings[0]?.length ?? EMBEDDING_DIM;
  const pooled = new Array(dim).fill(0);
  for (const token of tokenEmbeddings) {
    for (let i = 0; i < dim; i++) {
      pooled[i] += token[i];
    }
  }
  return pooled.map((v) => v / tokenEmbeddings.length);
}

function parseSingleEmbedding(raw: unknown): number[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("Invalid embedding response from HuggingFace API");
  }

  if (typeof raw[0] === "number") {
    return raw as number[];
  }

  if (Array.isArray(raw[0])) {
    return meanPool(raw as number[][]);
  }

  throw new Error("Unexpected embedding shape from HuggingFace API");
}

async function fetchEmbedding(text: string): Promise<number[]> {
  const response = await fetch(HF_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `HuggingFace embedding API failed (${response.status}): ${body}`,
    );
  }

  const data = await response.json();
  return parseSingleEmbedding(data);
}

export async function embedQuery(text: string): Promise<number[]> {
  return fetchEmbedding(text);
}

export async function embedDocuments(texts: string[]): Promise<number[][]> {
  return Promise.all(texts.map((text) => embedQuery(text)));
}
