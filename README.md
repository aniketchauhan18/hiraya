# Hiraya – NIT Hamirpur Campus Assistant

Hiraya is an AI-powered campus guide for **National Institute of Technology Hamirpur (NIT Hamirpur / NITH)**. Students can ask questions about academics, exams, placements, and campus life through a streaming chat interface. Answers are grounded in a maintainer-managed knowledge base using RAG (retrieval-augmented generation).

## Features

- **NIT Hamirpur–focused AI guide** — Answers are scoped to NIT Hamirpur topics with a hidden chain-of-thought prompt for better reasoning without exposing internal steps.
- **Streaming chat** — Bot responses stream token-by-token as `text/plain` for a responsive UX.
- **RAG knowledge base** — Text is chunked, embedded, and stored in PostgreSQL with **pgvector**; the top relevant chunks are retrieved per query.
- **Exam paper / PDF links** — When exam resources exist in the knowledge base, Hiraya can return matching PDF links (e.g. CE 212).
- **Maintainer-only ingestion** — Only you can add embeddings via a secret-protected API (`EMBEDDINGS_API_SECRET`).
- **Authentication** — NextAuth v5 (Google OAuth + email/password credentials). Sign-in routes exist at `/auth`, `/signin`, and `/signup`.
- **Modern UI** — React 19, Tailwind CSS 4, markdown rendering with syntax highlighting and copy support.

## Architecture

```
User question
    → HuggingFace Inference API (embed query)
    → pgvector similarity search (top 5 chunks, distance threshold)
    → Groq LLM (LangChain, streamed)
    → Chat UI
```

**Knowledge ingestion (maintainers only):**

```
POST /api/v1/embeddings  (Bearer secret)
    → chunk text → HF embeddings → insert into TextData
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16, React 19 |
| Language | TypeScript 5 |
| Auth | NextAuth v5 (Auth.js) |
| Database | PostgreSQL + pgvector (e.g. Neon) |
| ORM | Prisma 7 (`@prisma/adapter-pg`) |
| Embeddings | HuggingFace Inference API (`sentence-transformers/all-MiniLM-L6-v2`, 384-dim) |
| LLM | Groq via `@langchain/groq` |
| Styling | Tailwind CSS 4 |
| Rate limiting | Upstash Redis (optional, recommended on Vercel) |
| Deployment | Vercel (serverless-friendly — no local ONNX/transformers in production) |

## Requirements

- **Node.js >= 22**
- PostgreSQL database with the **vector** extension enabled
- API keys: Groq, HuggingFace (Inference), Google OAuth (optional for Google sign-in)

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/aniketchauhan18/hiraya.git
cd hiraya
npm install
```

### 2. Environment variables

Create `.env.local` in the project root:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Auth
AUTH_SECRET=your-secret-here          # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# LLM
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant

# Embeddings (HuggingFace Inference API — required)
HUGGING_FACE_API=hf_...

# Maintainer-only embedding ingestion
EMBEDDINGS_API_SECRET=your-secret-here

# Optional: rate limiting (recommended for production)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database setup

Prisma 7 uses [`prisma.config.ts`](prisma.config.ts) for the connection URL and generates the client to `src/generated/prisma`.

```bash
npx prisma db push      # sync schema to database (dev)
npx prisma generate     # generate Prisma client
```

For production migrations:

```bash
npx prisma migrate deploy
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page redirects to `/chat`.

### 5. Build for production

```bash
npm run build
npm start
```

Production builds use `next build --webpack` (configured in `package.json`).

## API Reference

### `POST /api/v1/chat`

Stream a grounded answer for a user question.

**Request:**

```json
{ "query": "What are the library timings?" }
```

**Response:** `text/plain` streamed body.

### `POST /api/v1/embeddings` (maintainers only)

Add content to the knowledge base.

**Headers:**

```
Authorization: Bearer <EMBEDDINGS_API_SECRET>
Content-Type: application/json
```

**Request:**

```json
{ "embeddingText": "NIT Hamirpur Central Library is open 8 AM – 10 PM on weekdays..." }
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/v1/embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_EMBEDDINGS_API_SECRET" \
  -d '{"embeddingText":"Your NIT Hamirpur content here..."}'
```

### `POST /api/v1/user`

Register a new user with email and password.

```json
{
  "firstName": "Aniket",
  "lastName": "Chauhan",
  "email": "user@example.com",
  "password": "securepassword"
}
```

### `GET/POST /api/auth/*`

NextAuth handlers for Google and credentials sign-in.

## Project Structure

```
src/
├── app/
│   ├── api/v1/chat/          # Streaming RAG chat
│   ├── api/v1/embeddings/    # Maintainer knowledge ingestion
│   ├── api/v1/user/          # User registration
│   ├── auth/                 # Google sign-in entry
│   ├── chat/                 # Main chat UI
│   ├── signin/ & signup/     # Email auth forms
├── lib/
│   ├── rag/                  # embed, retrieve, stream, ingest
│   ├── prompts/              # NIT Hamirpur system prompt
│   └── db.ts                 # Prisma client (PG adapter)
├── generated/prisma/         # Generated Prisma client (gitignored)
prisma/
├── schema.prisma
└── migrations/
prisma.config.ts              # Prisma 7 config + env loading
```

## Usage Tips

- **Ask NIT Hamirpur questions** — e.g. “What is CE 212?”, “Library timings”, “Hostel rules”.
- **Request exam papers** — e.g. “Give me the Fluid Mechanics CE 212 exam paper PDF” (only if that PDF URL exists in the knowledge base).
- **Add knowledge** — Use the embeddings API with your secret to ingest notices, syllabi, exam links, and campus info.
- **Grounded answers** — If Hiraya does not have data in the knowledge base, it will say so rather than invent facts.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Generate Prisma client + production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

## Deployment (Vercel)

1. Set all environment variables in the Vercel project settings.
2. Use a Neon (or other) PostgreSQL instance with the `vector` extension.
3. Ensure `HUGGING_FACE_API` uses a token with **Inference** permissions.
4. Set `EMBEDDINGS_API_SECRET` and keep it private — never expose it as `NEXT_PUBLIC_*`.
5. Optionally configure **Upstash Redis** for rate limiting in production.
6. Run `prisma migrate deploy` against your production database before or as part of deploy.

## Contributing

Contributions are welcome! Please open issues or pull requests for features, bug fixes, or improvements.

## License

Private project — see repository owner for usage terms.
