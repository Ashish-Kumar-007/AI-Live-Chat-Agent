import { db } from "../db/client";
import { v4 as uuid } from "uuid";

export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
) {
  const id = uuid();
  await db.query(
    `INSERT INTO messages (id, conversation_id, role, content) VALUES ($1, $2, $3, $4)`,
    [id, conversationId, role, content]
  );
  return id;
}

export async function getMessages(conversationId: string, limit: number = 50) {
  const result = await db.query(
    `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT $2`,
    [conversationId, limit]
  );
  return result.rows;
}
