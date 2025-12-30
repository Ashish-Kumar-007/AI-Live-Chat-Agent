# AI Chat Platform

A scalable AI-powered chat application with RAG (Retrieval Augmented Generation), built with Next.js frontend and Express backend, powered by Cerebras AI.

## 🏗️ Architecture

```
Frontend (Next.js) → API Gateway (Express) → Auth + Rate Limit (Redis) 
→ Chat Service → Queue (BullMQ) → Worker → LLM API (Cerebras AI)
```

## 🚀 Tech Stack

### Frontend
- **Next.js 16** (App Router)
- **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **Zustand** (State Management)
- **Axios** (HTTP Client)

### Backend
- **Express.js** (API Gateway)
- **PostgreSQL** (Chat History)
- **Redis** (Auth & Rate Limiting)
- **BullMQ** (Job Queue)
- **Cerebras AI** (LLM Provider)
- **OpenAI** (Embeddings for RAG)
- **OpenTelemetry** (Observability)

## 📁 Project Structure

```
spur-assignment/
├── client/                 # Next.js Frontend
│   ├── app/               # Pages & API routes
│   ├── components/        # React components
│   ├── lib/               # Utilities & API client
│   └── store/             # Zustand stores
└── server/                # Express Backend
    ├── src/
    │   ├── api/           # API routes
    │   ├── services/      # Business logic
    │   ├── workers/       # BullMQ workers
    │   ├── queues/        # Job queues
    │   ├── db/            # PostgreSQL client
    │   └── cache/         # Redis client
    └── test/              # Test suites
```

## ⚙️ Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 5+ (or Docker)

### 1. Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 2. Environment Variables

**Backend (`server/.env`):**
```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/spur_assignment
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
CEREBRAS_API_KEY=your-cerebras-api-key
CEREBRAS_API_URL=https://api.cerebras.ai/v1
CEREBRAS_MODEL=llama-3.3-70b
OPENAI_API_KEY=your-openai-key-for-embeddings
VECTOR_DB_ENABLED=true
```

**Frontend (`client/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_JWT_SECRET=your-super-secret-jwt-key
```

### 3. Database Setup

```bash
# Start PostgreSQL (Docker)
docker run -d --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=spur_assignment \
  -p 5432:5432 \
  postgres:15

# Start Redis (Docker)
docker run -d --name redis \
  -p 6379:6379 \
  redis:7
```

### 4. Run the Application

```bash
# Terminal 1: Backend Server
cd server
npm run dev

# Terminal 2: LLM Worker
cd server
npm run worker

# Terminal 3: Frontend
cd client
npm run dev
```

**Access:**
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/health

## 📡 API Endpoints

### Main Chat (No Auth Required)
- `POST /chat/message` - Send message, get synchronous reply
  ```json
  { "message": "Hello", "sessionId": "optional" }
  ```
- `GET /chat/history?sessionId=xxx` - Get conversation history

### Legacy Endpoints (Auth Required)
- `POST /chat/message/async` - Async message (queue-based)
- `GET /chat/conversations` - List conversations
- `GET /chat/conversations/:id/messages` - Get messages

## ✨ Features

- ✅ **Real-time Chat** - Synchronous AI responses
- ✅ **Session Management** - Conversation history per session
- ✅ **Rate Limiting** - Redis-based per session (30 req/min)
- ✅ **RAG Support** - Vector search with pgvector (optional)
- ✅ **Queue System** - BullMQ for async processing
- ✅ **Observability** - OpenTelemetry tracing
- ✅ **Modern UI** - Responsive design with Tailwind CSS

## 🧪 Testing

```bash
cd server
npm test
```

## 📦 Build

```bash
# Backend
cd server
npm run build
npm start

# Frontend
cd client
npm run build
npm start
```

## 🔑 Key Configuration

- **Cerebras AI**: Get API key from https://cloud.cerebras.ai/
- **Models**: `llama-3.3-70b`, `qwen2.5-72b`, `gpt-oss-120b`, etc.
- **Rate Limit**: 30 requests per minute per session
- **Vector DB**: Enable with `VECTOR_DB_ENABLED=true` (requires pgvector)

## 📚 Documentation

- Backend: `server/README.md`
- Frontend: `client/README.md`

## 🛠️ Development

- Backend runs on port **3000**
- Frontend runs on port **3001**
- Worker processes LLM jobs from BullMQ queue
- Database schema auto-initializes on server start

## 📝 License

MIT

