# AI Chat Backend

TypeScript backend for AI-powered customer support chat using Cerebras AI.

## Architecture

```
Client Request
  ↓
Express API (Rate Limiting via Redis)
  ↓
Chat Service
  ├── Input Validation
  ├── Session Management
  └── BullMQ Job Queue (Redis)
        ↓
     Worker Process
        ↓
     Cerebras AI API
        ↓
     PostgreSQL (Message Persistence)
```

## Key Components

### 1. **API Endpoints**
- `POST /chat/message` - Send message, get AI reply (synchronous)
- `GET /chat/history?sessionId=xxx` - Get conversation history
- `GET /health` - Health check

### 2. **Session Management**
- SessionId-based conversations (no auth required)
- Auto-generates sessionId if not provided
- Persists messages per session

### 3. **Queue System (BullMQ + Redis)**
- Jobs queued in Redis via BullMQ
- Worker processes jobs asynchronously
- Automatic retries (3 attempts with exponential backoff)
- Job tracking and monitoring

### 4. **Rate Limiting**
- 30 requests per minute per session
- Redis-based rate limiting
- Graceful degradation if Redis unavailable

### 5. **LLM Integration**
- Cerebras AI SDK for chat completions
- FAQ/domain knowledge embedded in prompts
- Conversation history included in context
- Response cleaning (removes reasoning tags)

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables** (`.env`)
   ```env
   PORT=3000
   DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
   REDIS_URL=redis://localhost:6379
   CEREBRAS_API_KEY=your_api_key
   CEREBRAS_MODEL=llama-3.3-70b
   ```

3. **Start Services**
   ```bash
   # Start PostgreSQL and Redis
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres
   docker run -d -p 6379:6379 redis:7
   ```

4. **Run Server**
   ```bash
   npm run dev
   ```

## API Usage

### Send Message
```bash
POST /chat/message
Content-Type: application/json

{
  "message": "What's your return policy?",
  "sessionId": "optional-session-id"
}

Response:
{
  "reply": "We offer a 30-day return window...",
  "sessionId": "session-id-here"
}
```

### Get History
```bash
GET /chat/history?sessionId=xxx

Response:
{
  "sessionId": "xxx",
  "messages": [
    { "id": "...", "role": "user", "content": "...", "timestamp": "..." },
    { "id": "...", "role": "assistant", "content": "...", "timestamp": "..." }
  ]
}
```

## Data Flow

1. **Request Arrives** → Rate limiter checks Redis
2. **Validation** → Input sanitized and validated
3. **Session** → Get/create conversation by sessionId
4. **Queue Job** → Add LLM job to BullMQ queue (Redis)
5. **Worker Processes** → Calls Cerebras AI API
6. **Save Response** → Store in PostgreSQL
7. **Return Reply** → Send response to client

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (conversations, messages)
- **Cache/Queue**: Redis + BullMQ
- **LLM**: Cerebras AI (llama-3.3-70b)
- **Testing**: Jest + Supertest

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

## Project Structure

```
server/
├── src/
│   ├── api/           # Route handlers
│   ├── services/      # Business logic (chat, LLM)
│   ├── workers/       # BullMQ workers
│   ├── queues/        # Queue definitions
│   ├── repositories/  # Database access
│   ├── middlewares/   # Rate limiting, error handling
│   ├── config/        # Environment config
│   └── db/            # Database client & schema
├── test/              # Test files
└── dist/              # Compiled JavaScript
```

