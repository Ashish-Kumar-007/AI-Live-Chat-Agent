import { Pool } from "pg";
import { env } from "../config/env";

export const db = new Pool({
  connectionString: env.db,
  // Connection pool settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased to 10 seconds
  // Additional connection options
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  // Retry connection on failure
  allowExitOnIdle: false
});

// Handle connection errors
db.on("error", (err: Error) => {
  const pgError = err as any;
  console.error("PostgreSQL connection error:", pgError.message || err.message);
  if (pgError.code === "ECONNREFUSED") {
    console.error(
      "❌ PostgreSQL is not running. Please start PostgreSQL:\n" +
      "   - Windows: Install PostgreSQL from https://www.postgresql.org/download/windows/\n" +
      "   - Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres\n" +
      "   - Or update DATABASE_URL in .env to point to your PostgreSQL instance"
    );
  }
});

// Test connection on startup with retry logic
async function testConnection(retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await db.connect();
      await client.query("SELECT NOW()");
      client.release();
      console.log("✅ PostgreSQL connected successfully");
      return true;
    } catch (err: any) {
      const isLastAttempt = i === retries - 1;
      
      if (err.code === "ECONNREFUSED") {
        console.error(
          "\n❌ Cannot connect to PostgreSQL. Please ensure:\n" +
          "   1. PostgreSQL is running\n" +
          "   2. DATABASE_URL in .env is correct\n" +
          "   3. Database exists and credentials are valid\n" +
          `   Attempt ${i + 1}/${retries}${isLastAttempt ? " - Giving up" : ` - Retrying in ${delay/1000}s...`}\n`
        );
      } else if (err.code === "ETIMEDOUT" || err.message?.includes("timeout")) {
        console.error(
          `\n⏱️  PostgreSQL connection timeout (attempt ${i + 1}/${retries}):\n` +
          "   Possible causes:\n" +
          "   1. PostgreSQL is slow to respond\n" +
          "   2. Network/firewall blocking connection\n" +
          "   3. PostgreSQL is overloaded\n" +
          "   4. Wrong host/port in DATABASE_URL\n" +
          `   ${isLastAttempt ? "Giving up" : `Retrying in ${delay/1000}s...`}\n`
        );
      } else if (err.code === "ENOTFOUND") {
        console.error(
          `\n❌ PostgreSQL host not found (attempt ${i + 1}/${retries}):\n` +
          "   Check DATABASE_URL - hostname might be incorrect\n" +
          `   ${isLastAttempt ? "Giving up" : `Retrying in ${delay/1000}s...`}\n`
        );
      } else {
        console.error(
          `PostgreSQL connection test failed (attempt ${i + 1}/${retries}):`,
          err.message
        );
      }
      
      if (!isLastAttempt) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
}

// Run connection test
testConnection().catch(() => {
  // Error already logged
});

// Initialize database schema
export async function initSchema() {
  try {
    // Enable pgvector extension if available (only needed for RAG/vector search)
    let pgvectorAvailable = false;
    try {
      await db.query(`CREATE EXTENSION IF NOT EXISTS vector`);
      pgvectorAvailable = true;
      console.log("✅ pgvector extension enabled (RAG/vector search available)");
    } catch (error: any) {
      // Only show message if vector DB is enabled in config
      if (process.env.VECTOR_DB_ENABLED === "true") {
        console.warn(
          "⚠️  pgvector extension not available. Vector search will be disabled.\n" +
          "   To enable: Install pgvector in PostgreSQL or set VECTOR_DB_ENABLED=false"
        );
      }
    }

    await db.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY,
        user_id UUID,
        created_at TIMESTAMP DEFAULT now()
      )
    `);

    // Make user_id nullable if it's not already (for sessionId-based conversations)
    // This is needed for sessionId-based conversations that don't require authentication
    try {
      // Check if column is currently NOT NULL by querying the information schema
      const constraintCheck = await db.query(`
        SELECT is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'user_id'
      `);
      
      // If column exists and is NOT NULL, make it nullable
      if (constraintCheck.rows.length > 0 && constraintCheck.rows[0].is_nullable === 'NO') {
        await db.query(`
          ALTER TABLE conversations 
          ALTER COLUMN user_id DROP NOT NULL
        `);
        console.log("✅ Made user_id column nullable for sessionId-based conversations");
      }
    } catch (alterError: any) {
      // Column might already be nullable, or there might be an issue
      // Try the ALTER anyway - it will fail gracefully if already nullable
      try {
        await db.query(`
          ALTER TABLE conversations 
          ALTER COLUMN user_id DROP NOT NULL
        `);
      } catch (innerError: any) {
        // If it fails, the column is likely already nullable or doesn't have the constraint
        if (!innerError.message?.includes("does not exist") && 
            !innerError.message?.includes("constraint") &&
            !innerError.message?.includes("already")) {
          console.warn("Could not make user_id nullable:", innerError.message);
        }
      }
    }

    // Add session_id column if it doesn't exist (for migration from old schema)
    try {
      await db.query(`
        ALTER TABLE conversations 
        ADD COLUMN IF NOT EXISTS session_id TEXT
      `);
      
      // Add unique constraint if session_id column was just added
      // Note: This might fail if there are existing rows with NULL session_id, which is fine
      try {
        await db.query(`
          ALTER TABLE conversations 
          ADD CONSTRAINT conversations_session_id_unique UNIQUE (session_id)
        `);
      } catch (constraintError: any) {
        // Constraint might already exist or there might be NULL values, which is fine
        if (!constraintError.message?.includes("already exists")) {
          console.warn("Could not add unique constraint on session_id:", constraintError.message);
        }
      }
    } catch (alterError: any) {
      // Column might already exist, which is fine
      if (!alterError.message?.includes("already exists") && !alterError.message?.includes("duplicate")) {
        console.warn("Could not add session_id column:", alterError.message);
      }
    }

    // Create index for session lookups
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_session_id 
      ON conversations(session_id)
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY,
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT now()
      )
    `);

    // Create index for faster lookups
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
      ON messages(conversation_id)
    `);

    // Create table for vector embeddings (for RAG)
    // Try with VECTOR type first, fallback to JSONB if pgvector not available
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS embeddings (
          id UUID PRIMARY KEY,
          text TEXT NOT NULL,
          embedding VECTOR(1536),
          metadata JSONB,
          created_at TIMESTAMP DEFAULT now()
        )
      `);

      // Try to create vector index (only if pgvector is available)
      if (pgvectorAvailable) {
        try {
          await db.query(`
            CREATE INDEX IF NOT EXISTS idx_embeddings_vector 
            ON embeddings USING ivfflat (embedding vector_cosine_ops)
          `);
          console.log("✅ Vector index created successfully");
        } catch (indexError) {
          console.warn("⚠️  Could not create vector index, continuing without it");
        }
      }
    } catch (vectorError: any) {
      // Fallback to JSONB if VECTOR type not available
      if (vectorError.message?.includes("vector")) {
        await db.query(`
          CREATE TABLE IF NOT EXISTS embeddings (
            id UUID PRIMARY KEY,
            text TEXT NOT NULL,
            embedding JSONB,
            metadata JSONB,
            created_at TIMESTAMP DEFAULT now()
          )
        `);
      } else {
        throw vectorError;
      }
    }

    console.log("Database schema initialized successfully");
  } catch (error) {
    console.error("Error initializing database schema:", error);
    throw error;
  }
}
