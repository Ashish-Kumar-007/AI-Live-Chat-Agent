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
    │   ├── api/           # API routes (thin controllers)
    │   ├── services/      # Business logic (chat, LLM, RAG)
    │   ├── workers/       # BullMQ workers (async processing)
    │   ├── queues/        # Job queues (decoupled job management)
    │   ├── repositories/  # Data access layer (clean DB abstraction)
    │   ├── middlewares/   # Cross-cutting concerns (rate limit, errors)
    │   ├── db/            # PostgreSQL client & schema
    │   └── cache/         # Redis client
    └── test/              # Test suites
```

### Design Philosophy

The codebase follows a **layered architecture** with clear separation of concerns:

- **API Layer** (`api/`) - Thin route handlers that delegate to services
- **Service Layer** (`services/`) - Business logic and orchestration
- **Repository Layer** (`repositories/`) - Data access abstraction
- **Worker Layer** (`workers/`) - Background job processing
- **Queue Layer** (`queues/`) - Job management and retry logic

This structure makes it straightforward to:
- Add new communication channels (WhatsApp, Instagram) by creating new service adapters
- Swap LLM providers by implementing a new service in `services/llm/`
- Extend functionality without touching core business logic
- Test each layer independently

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
- Frontend: http://localhost:3001 || https://ai-live-chat-agent-psi.vercel.app/ (LIVE URL)
- Backend API: http://localhost:3000 || https://ai-live-chat-agent-pf21.onrender.com (LIVE URL)
- Health Check: http://localhost:3000/health || https://ai-live-chat-agent-pf21.onrender.com/health (LIVE URL)

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

- ✅ **Real-time Chat** - Synchronous AI responses with end-to-end conversation flow
- ✅ **Session Management** - Conversation history per session with automatic persistence
- ✅ **Rate Limiting** - Redis-based per session (30 req/min) with graceful degradation
- ✅ **RAG Support** - Vector search with pgvector (optional, gracefully disabled if unavailable)
- ✅ **Queue System** - BullMQ for async processing with automatic retries (3 attempts, exponential backoff)
- ✅ **Observability** - OpenTelemetry tracing for production monitoring
- ✅ **Modern UI** - Responsive design with Tailwind CSS and intuitive chat interface
- ✅ **Error Resilience** - Comprehensive error handling with user-friendly messages
- ✅ **Input Validation** - Message length limits, sanitization, and type checking
- ✅ **Database Resilience** - Continues operating even if database is temporarily unavailable

## 🏛️ Architecture Highlights

### Extensibility & Channel Support

The architecture is designed for easy extension to multiple communication channels:

- **LLM Integration**: Encapsulated in `services/llm/cerebras.service.ts` - swap providers by implementing the same interface
- **Channel Abstraction**: Service layer (`services/chat.service.ts`) handles business logic independently of transport
- **To add WhatsApp/Instagram**: Create channel-specific adapters that transform incoming messages to the standard format, then route through existing chat service
- **Schema Design**: `conversations` table supports both `user_id` (authenticated) and `session_id` (anonymous) patterns, making it flexible for different channel requirements

### Robustness & Error Handling

The system handles edge cases gracefully:

- **Network Failures**: LLM calls wrapped in retry logic (3 attempts with exponential backoff)
- **Database Outages**: Chat continues functioning, skipping persistence when DB is unavailable
- **Invalid Input**: Comprehensive validation (message length, type checking, sanitization) with clear error messages
- **Rate Limiting**: Redis-based with fallback behavior if Redis is unavailable
- **Timeout Protection**: 60-second timeout on LLM jobs prevents hanging requests
- **Error Messages**: User-friendly error responses that don't expose internal implementation details

### Code Quality & Maintainability

- **TypeScript Throughout**: Full type safety with interfaces for all data structures
- **Idiomatic Patterns**: Repository pattern for data access, service layer for business logic
- **Clear Naming**: Descriptive function and variable names (`enqueueAndWaitForLLMJob`, `getOrCreateConversationBySessionId`)
- **Separation of Concerns**: Each module has a single responsibility (routes → services → repositories → DB)
- **No Foot-guns**: Input validation, error boundaries, and defensive programming throughout

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

## 💬 User Experience & Product Quality

The chat experience is designed to feel like a real customer support agent:

- **Natural Conversations**: AI responses are cleaned of internal reasoning tags and formatted as direct, helpful answers
- **Context Awareness**: Conversation history (last 20 messages) is included in each request for coherent multi-turn conversations
- **Domain Knowledge**: Pre-configured with store policies (shipping, returns, support hours) embedded in system prompts
- **Professional Tone**: Responses are friendly, empathetic, and solution-oriented, matching real support agent behavior
- **Real-time Feedback**: Loading states, error messages, and immediate responses create a responsive feel
- **Session Continuity**: Conversations persist across page refreshes using sessionId-based tracking

The implementation balances simplicity (no auth required for basic chat) with extensibility (full user authentication support available), making it suitable as a foundation for a production support system.

## 📝 License

MIT

