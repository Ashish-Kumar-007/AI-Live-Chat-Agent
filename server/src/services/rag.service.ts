import OpenAI from "openai";
import { env } from "../config/env";
import { db } from "../db/client";
import { v4 as uuid } from "uuid";

/**
 * RAG (Retrieval-Augmented Generation) Service
 * 
 * Note: Currently uses OpenAI for embeddings as Cerebras doesn't have
 * a dedicated embeddings API yet. This may change in future updates.
 * 
 * For chat completions, we use Cerebras AI (see cerebras.service.ts)
 * For embeddings, we use OpenAI (or can be configured to use other services)
 */
const embeddingsClient = env.openaiKey ? new OpenAI({ apiKey: env.openaiKey }) : null;

export async function getContext(query: string): Promise<string> {
  if (!env.vectorDbEnabled || !embeddingsClient) {
    return "";
  }

  try {
    // Generate embedding for the query
    // Note: Using OpenAI for embeddings (Cerebras doesn't have embeddings API yet)
    const embeddingResponse = await embeddingsClient.embeddings.create({
      model: "text-embedding-3-small",
      input: query
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Try vector search first (requires pgvector extension)
    try {
      const result = await db.query(
        `SELECT text, metadata 
         FROM embeddings 
         ORDER BY embedding <-> $1::vector 
         LIMIT 3`,
        [JSON.stringify(queryEmbedding)]
      );

      if (result.rows.length > 0) {
        return result.rows
          .map((row: any) => row.text)
          .join("\n\n");
      }
    } catch (vectorError: any) {
      // If pgvector is not available, fall back to text search
      if (vectorError.message?.includes("vector") || vectorError.message?.includes("operator")) {
        console.log("pgvector not available, using text search fallback");
        const result = await db.query(
          `SELECT text, metadata 
           FROM embeddings 
           WHERE text ILIKE $1 
           LIMIT 3`,
          [`%${query}%`]
        );

        if (result.rows.length > 0) {
          return result.rows
            .map((row: any) => row.text)
            .join("\n\n");
        }
      } else {
        throw vectorError;
      }
    }

    return "";
  } catch (error) {
    console.error("RAG search error:", error);
    // Fallback to empty context if vector search fails
    return "";
  }
}

export async function storeEmbedding(
  text: string,
  embedding: number[],
  metadata?: Record<string, any>
) {
  if (!env.vectorDbEnabled) {
    return;
  }

  try {
    const id = uuid();
    
    // Try to store with vector type, fallback to JSONB if pgvector not available
    try {
      await db.query(
        `INSERT INTO embeddings (id, text, embedding, metadata) 
         VALUES ($1, $2, $3::vector, $4)`,
        [id, text, JSON.stringify(embedding), JSON.stringify(metadata || {})]
      );
    } catch (vectorError: any) {
      // If pgvector is not available, store embedding as JSONB
      if (vectorError.message?.includes("vector")) {
        await db.query(
          `INSERT INTO embeddings (id, text, embedding, metadata) 
           VALUES ($1, $2, $3::jsonb, $4)`,
          [id, text, JSON.stringify(embedding), JSON.stringify(metadata || {})]
        );
      } else {
        throw vectorError;
      }
    }
  } catch (error) {
    console.error("Error storing embedding:", error);
  }
}
