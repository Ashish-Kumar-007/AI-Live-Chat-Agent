import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { chatRouter } from "./api/chat.controller";
import { errorHandler } from "./middlewares/errorHandler";
import { initSchema } from "./db/client";
import { testCerebrasConnection } from "./services/llm/cerebras.service";
import "./observability/tracer";
import "./workers/llm.worker"; // Start BullMQ worker to process LLM jobs

const app = express();

app.use(cors());
app.use(express.json());

app.use("/chat", chatRouter);

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

// Export app for testing
export default app;

// Initialize database schema on startup
async function startServer() {
  try {
    await initSchema();
    console.log("✅ Database schema initialized");
  } catch (error: any) {
    if (error.code === "ECONNREFUSED") {
      console.error(
        "\n❌ CRITICAL: Cannot connect to PostgreSQL!\n" +
        "   The server will not start without a database connection.\n" +
        "   Please start PostgreSQL and ensure DATABASE_URL is correct in .env\n"
      );
      process.exit(1);
    } else {
      console.error("⚠️  Database initialization warning:", error.message);
      console.log("   Server will start but database features may not work");
    }
  }

  // Test Cerebras AI connection
  try {
    await testCerebrasConnection();
  } catch (error: any) {
    console.error("⚠️  Cerebras AI connection test failed:", error.message);
    console.log("   Server will start but chat functionality may not work");
  }

  // Start server even if schema init had issues (non-critical)
  app.listen(env.port, () => {
    console.log(`\n🚀 API Gateway running on port ${env.port}`);
    console.log(`   Health check: http://localhost:${env.port}/health\n`);
  });
}

startServer();
