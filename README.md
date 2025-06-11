# Hiraya – Your AI College Guide

Hiraya is an AI-powered college assistant web application built with Next.js. It helps students and users by answering college-related questions, providing contextual information, and sharing study resources—all via an intuitive chat interface.

## Features

- **AI Chatbot College Guide:**  
  Hiraya answers questions about your college, exams, and resources using advanced AI and stored contextual data.

- **Authentication:**  
  Secure sign-in with Google or email/password using NextAuth. User data and sessions are handled safely.

- **Smart Context & Memory:**  
  Stores and retrieves information using vector embeddings, enabling context-aware responses and the ability to remember uploaded materials.

- **Resource Sharing:**  
  Maintainers can upload exam papers and study materials. Users can request and get links to specific resources (e.g., “Fluid Mechanics - CE 212 exam paper”).

- **Modern UI:**  
  Responsive chat interface with markdown support, code highlighting, sharing, and copy features. Built with React and TailwindCSS.

- **Extensible Backend:**  
  Modular structure with easy-to-extend API endpoints for chat and context management. Uses Prisma and PostgreSQL for data storage, with vector search powered by HuggingFace and pgvector.

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/aniketchauhan18/hiraya.git
   cd hiraya
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Set environment variables:**
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for Google Auth
   - `NEXTAUTH_SECRET`
   - `GROQ_API_KEY`
   - `HUGGING_FACE_API`
   - Database connection string for Prisma

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Visit:**  
   Open [http://localhost:3000](http://localhost:3000) to use the app.

## Usage

- **Ask College Questions:**  
  Interact with the AI assistant for any college-related queries.
- **Request Exam Papers:**  
  Ask for specific papers (e.g., “Give me the PDF for CE 212”) and receive direct download links if available.
- **Sign In:**  
  Use Google or email/password to personalize your experience and save your chat history.

## Tech Stack

- Next.js & React
- NextAuth (Google and Credentials providers)
- Prisma ORM & PostgreSQL with pgvector
- HuggingFace Transformers for embeddings
- TailwindCSS for styling
- Vercel for deployment

## Contribution

Contributions are welcome! Please open issues or pull requests for features, bug fixes, or improvements.
