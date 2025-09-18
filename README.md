# RAG-Chatbot-backend
# 📰 RAG-Powered News Chatbot – Backend

This is the **backend service** for a Retrieval-Augmented Generation (RAG) powered chatbot that answers queries over a news corpus.  
It fetches news articles from RSS feeds, embeds them into a vector database, and uses **Google Gemini** to answer user queries.

---

## 🚀 Features
- Ingests news articles from RSS feeds (~50 or configurable).
- Embeds text using **JINA Embeddings**.
- Stores embeddings in **Chroma VectorDB**.
- Chatbot queries → retrieve top-k relevant passages → send to **Gemini API** for final answer.
- Session-based:
  - Each new user = new session (UUID).
  - Redis used for in-memory session history.
- REST API endpoints for:
  - New session
  - Chat query
  - Fetch session history
  - Clear session

---

### 🛠️ Tech Stack
- **Backend Framework**: Node.js + Express  
- **Embeddings**: JINA Embedings
- **Vector DB**: ChromaDB  
- **LLM API**: Google Gemini API 
- **Cache / Sessions**: Redis  

---
### 📂 Project Structure
```
backend/
src/
index.js # Express server entry point
routes/chat.js # Chat routes
services/
chroma.js # VectorDB service (Chroma in this case)
getEmbedings.js
embeddings.py # To implement JINA embeddings
gemini.js # LLM integration (Gemini/OpenAI)
redisClient.js # Redis session cache
utils/
chunker.js
promptBuilder.js # Builds final prompt for LLM
package.json
README.md
```

---

### ⚙️ Setup Instructions

```
### 1. Clone Repository
git clone https://github.com/your-username/rag-news-backend.git
cd rag-news-backend

### 2. Install Dependencies
npm install

### 3. Configure Environment
(Create a .env file:)
PORT=4000
# LLM APIs
GEMINI_API_URL=https://api.gemini.google.com/v1/generate
GEMINI_API_KEY=your_gemini_key
# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

### 4. Run Services
(Start Redis and Chroma locally)
redis-server
chroma run --path ./chroma-data

### 5. Start Backend
npm run dev

```
---

### 🔗 API Endpoints

**Create Session**
```
POST /api/session
Response:
{ "sessionId": "123e4567-e89b-12d3-a456-426614174000" }
```

**Chat Query**
```
POST /api/chat
{
  "sessionId": "...",
  "query": "What is the latest news on India economy?"
}
```

**Fetch Session History**
```
GET /api/session/:id/history
```

**Clear Session**
```
DELETE /api/session/:id
```

---

### 📹 Demo Workflow
```
Start backend server. 
Ingest news articles → embed → store in Chroma.
Send query → backend retrieves top-k → LLM (Gemini) generates response.
Redis caches session history.
```

---

### Deployment
The backend is deployed and accessible here:
Base URL: https://rag-chatbot-backend-vkcz.onrender.com

