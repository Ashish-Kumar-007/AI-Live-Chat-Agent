import { db } from "../db/client";
import { v4 as uuid } from "uuid";

// Legacy functions for auth-based system
export async function createConversation(userId: string) {
  const id = uuid();
  await db.query(
    `INSERT INTO conversations (id, user_id) VALUES ($1, $2)`,
    [id, userId]
  );
  return id;
}

export async function getConversation(conversationId: string) {
  const result = await db.query(
    `SELECT * FROM conversations WHERE id = $1`,
    [conversationId]
  );
  return result.rows[0] || null;
}

export async function getConversationsByUser(userId: string) {
  const result = await db.query(
    `SELECT * FROM conversations WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

// New functions for sessionId-based system (no auth required)
export async function getOrCreateConversationBySessionId(sessionId: string): Promise<string> {
  // Try to get existing conversation by sessionId
  const existing = await db.query(
    `SELECT id FROM conversations WHERE session_id = $1`,
    [sessionId]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  // Create new conversation with sessionId
  const id = uuid();
  await db.query(
    `INSERT INTO conversations (id, session_id) VALUES ($1, $2)`,
    [id, sessionId]
  );
  return id;
}

export async function getConversationBySessionId(sessionId: string) {
  const result = await db.query(
    `SELECT * FROM conversations WHERE session_id = $1`,
    [sessionId]
  );
  return result.rows[0] || null;
}
