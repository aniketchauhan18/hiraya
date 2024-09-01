import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { NextRequest, NextResponse } from "next/server";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { prisma } from "@/lib/db";
import pgvector from "pgvector";

const promptTemplate = `
You are an AI assistant called "College Companion" that acts as a "College Guide" by answering questions based on provided context. Your goal is to directly address the question concisely and to the point, without excessive elaboration. You are a friendly and helpful assistant. Please answer the question based on the context provided. If the question is outside the context or if you don't know the answer, kindly say, "I'm sorry, but I don't have that information. Would you like to provide more details? but don't say like "I can help you if you provide more context" you are an assistant user are there to interact with you and ask you about their college queries, data is provided by your mainatiner to you user's doesn't provide any context to you" 

To generate your answer:

- Carefully analyze the question and identify the key information needed to address it
- Locate the specific parts of each context that contain this key information
- Concisely summarize the relevant information from the higher-scoring context(s) in your own words
- Provide a direct answer to the question
- Use Markdown Formatting: When generating your answer, use suitable Markdown practices, including:
- Bold for emphasis on important points.
- Italics for additional emphasis or to highlight specific terms.
- Bullet points for lists to improve clarity and readability.
- Give detailed and accurate responses for long-form questions.
If no context is provided, introduce yourself and explain that the user can save content which will allow you to answer questions about that content in the future. Do not provide an answer if no context is provided.

Context: {context}

Question: {question}
`;
const embeddingModel = new HuggingFaceTransformersEmbeddings({
  model: "Xenova/all-MiniLM-L6-v2",
});

const chatModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
});

interface DBResponse {
  id: number;
  text: string;
  embedding: string; // Store the embedding as a string
}

export async function POST(
  req: NextRequest,
  res: NextResponse,
): Promise<Response> {
  try {
    // user query here
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json(
        {
          message: "Please provide query in the request body",
        },
        {
          status: 400,
        },
      );
    }
    const userQueryEmbeddings = await embeddingModel.embedQuery(query);

    // embeddings to sql format
    const sqlEmbeddings = pgvector.toSql(userQueryEmbeddings);

    const responseDb: DBResponse[] =
      await prisma.$queryRaw`SELECT id, text,  embedding::text FROM "TextData" ORDER BY embedding <-> ${sqlEmbeddings}::vector(384) LIMIT 5`;

    console.log(responseDb);

    const prompt = ChatPromptTemplate.fromTemplate(promptTemplate);
    const chain = prompt.pipe(chatModel);

    const response = await chain.invoke({
      context: responseDb.map((res) => res.text).join("\n"),
      question: query,
    });

    return NextResponse.json(
      {
        message: "response generated successfully",
        data: response.content,
      },
      {
        status: 200,
      },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      {
        message: "Internal server error while processing",
      },
      {
        status: 500,
      },
    );
  }
}