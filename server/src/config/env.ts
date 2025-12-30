import dotenv from "dotenv";
dotenv.config();

// Validate required environment variables
if (!process.env.CEREBRAS_API_KEY) {
  console.warn("⚠️  WARNING: CEREBRAS_API_KEY is not set. Chat functionality will not work.");
}

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  WARNING: DATABASE_URL is not set. Database features will not work.");
}

export const env = {
  port: parseInt(process.env.PORT || "3000", 10),
  db: process.env.DATABASE_URL || "",
  redis: process.env.REDIS_URL || "redis://localhost:6379",
  jwtSecret: process.env.JWT_SECRET || "default-secret-change-in-production",
  
  // Cerebras AI Configuration (REQUIRED for chat functionality)
  // Reference: https://inference-docs.cerebras.ai/
  // Get API key from: https://cloud.cerebras.ai/
  cerebrasApiKey: process.env.CEREBRAS_API_KEY || "",
  cerebrasApiUrl: process.env.CEREBRAS_API_URL || "https://api.cerebras.ai/v1",
  // Available models: llama-3.3-70b, qwen2.5-72b, gpt-oss-120b, qwen3-coder-480b, etc.
  // See latest models: https://cloud.cerebras.ai/ or https://www.cerebras.net/model-zoo/
  cerebrasModel: process.env.CEREBRAS_MODEL || "llama-3.3-70b",
  
  // Embeddings Configuration (OPTIONAL - only needed for RAG)
  // Note: Cerebras may support embeddings in the future
  // For now, use OpenAI or other embedding services for RAG
  openaiKey: process.env.OPENAI_API_KEY || "",
  vectorDbEnabled: process.env.VECTOR_DB_ENABLED === "true"
};
