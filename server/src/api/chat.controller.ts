import { Router } from "express";
import { authMiddleware } from "../auth/jwt.middleware";
import { rateLimiter, rateLimiterBySession } from "../middlewares/rateLimiter";
import { handleChat, getConversationHistory, getMessages, handleChatMessage, getHistoryBySession } from "../services/chat.service";

export const chatRouter = Router();

// Main chat endpoint - matches assignment requirements (no auth required)
// POST /chat/message
// Body: { message: string, sessionId?: string }
// Returns: { reply: string, sessionId: string }
chatRouter.post(
  "/message",
  rateLimiterBySession,
  handleChatMessage
);

// Get conversation history by sessionId (no auth required)
// GET /chat/history?sessionId=xxx
chatRouter.get(
  "/history",
  getHistoryBySession
);

// Legacy endpoints (with auth) - kept for backward compatibility
// Send a chat message (async queue-based)
chatRouter.post(
  "/message/async",
  authMiddleware,
  rateLimiter,
  handleChat
);

// Get conversation history for user
chatRouter.get(
  "/conversations",
  authMiddleware,
  getConversationHistory
);

// Get messages for a specific conversation
chatRouter.get(
  "/conversations/:conversationId/messages",
  authMiddleware,
  getMessages
);
