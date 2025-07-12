# 📘 QuizApp – RAG-Powered Financial Chatbot

**QuizApp** is a smart chatbot designed for financial services. It leverages **semantic search**, **Google GenAI embeddings**, and **LLM responses (Groq)** to answer questions from preloaded PDFs/CSVs as well as user-uploaded files.

---

## 🚀 Key Features

| Feature            | Description                                                                 |
|--------------------|-----------------------------------------------------------------------------|
| **Preloaded Data** | Financial PDFs and CSVs are already embedded in Qdrant for instant answers |
| **Ask Questions**  | Users ask questions; bot retrieves relevant context and responds intelligently |
| **File Upload**    | Users can upload PDFs/CSVs → app processes, chunks, embeds, and stores them |
| **Embeddings**     | Uses Google GenAI for converting text into vector representations           |
| **Vector Storage** | Qdrant stores chunks for similarity-based semantic search                   |
| **LLM Response**   | Groq’s Llama 3 model generates concise answers from retrieved context       |
| **Chat Logging**   | All chats are stored in Astra DB for future retrieval and analysis          |

---

## 🛠️ Tech Stack Overview

| Area         | Tools & Services                                                                 |
|--------------|----------------------------------------------------------------------------------|
| **Frontend** | React + Next.js, Tailwind CSS, Markdown rendering, Chart.js                     |
| **Backend**  | Next.js API Routes, LangChain, Google GenAI, Groq (Llama 3), PDF/CSV parsers    |
| **Vector DB**| Qdrant – stores and searches embedded chunks                                    |
| **Metadata DB** | Prisma + PostgreSQL – stores document metadata                             |
| **Chat Logs**| Astra DB – persists chat history                                                |

---

## 🌐 API Integrations

| API               | Purpose                                       |
|-------------------|-----------------------------------------------|
| **Google GenAI**  | Create vector embeddings from text chunks and queries |
| **Qdrant**        | Store and retrieve vector embeddings           |
| **Groq (LLM)**    | Generate chatbot responses using Llama 3       |
| **Astra DB**      | Store user chat history                        |
| **Prisma/Postgres** | Save document metadata (filename, ID, etc.) |

---

## 🧭 System Architecture Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant NextAPI as Next.js API
    participant GoogleEmb as Google GenAI Embeddings
    participant Qdrant
    participant GroqLLM as Groq LLM
    participant AstraDB

    User->>Frontend: Upload PDF/CSV or Ask Question
    Frontend->>NextAPI: POST /api/pdf (file) or /api/chat (question)
    alt PDF Upload
        NextAPI->>GoogleEmb: Embed chunks (batch)
        GoogleEmb-->>NextAPI: Embeddings
        NextAPI->>Qdrant: Upsert vectors
        NextAPI->>Prisma: Store metadata
        NextAPI-->>Frontend: Success/Document ID
    else Chat
        NextAPI->>GoogleEmb: Embed question
        GoogleEmb-->>NextAPI: Embedding
        NextAPI->>Qdrant: Search similar chunks
        Qdrant-->>NextAPI: Top K chunks
        NextAPI->>GroqLLM: Send question + context
        GroqLLM-->>NextAPI: LLM answer
        NextAPI->>AstraDB: Store chat log
        NextAPI-->>Frontend: LLM answer
    end
    Frontend-->>User: Show result/answer
⛳ Getting Started
bash
Copy
Edit
# Clone the repo
git clone https://github.com/Pavankumar07s/bajaj.git
cd bajaj/QuizApp

# Install dependencies
pnpm install

# Create a `.env` file with:
# GOOGLE_GENAI_API_KEY=
# QDRANT_URL=
# GROQ_API_KEY=
# ASTRA_DB_APPLICATION_TOKEN=
# ASTRA_DB_ENDPOINT=
# DATABASE_URL= (for Prisma/Postgres)

# Start development server
pnpm run dev
📂 Folder Structure (Key)
bash
Copy
Edit
📦QuizApp
 ┣ 📂app
 ┃ ┣ 📂api
 ┃ ┃ ┣ 📂pdf        # Handles file upload, chunking, embeddings, storage
 ┃ ┃ ┗ 📂chat       # Handles RAG and chat with LLM
 ┃ ┗ 📂chat         # Chat UI
 ┣ 📂lib            # Helper functions, embedding loaders, etc.
 ┣ 📂prisma         # Prisma schema and migrations
 ┣ 📜.env.example   # Sample environment file
 ┗ 📜README.md
📬 Contact
Maintained by Pavan Kumar
For issues, please raise them in Issues

