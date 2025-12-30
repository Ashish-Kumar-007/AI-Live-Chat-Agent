import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { saveMessage, getMessages as getMessagesFromRepo } from "../repositories/message.repo";
import { enqueueLLMJob } from "../queues/llm.queue";
import { 
  createConversation, 
  getConversation,
  getConversationsByUser,
  getOrCreateConversationBySessionId,
  getConversationBySessionId
} from "../repositories/conversation.repo";
import { enqueueAndWaitForLLMJob } from "../queues/llm.queue";

export async function handleChat(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let { conversationId, message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Create or validate conversation
    if (conversationId) {
      const conversation = await getConversation(conversationId);
      if (!conversation || conversation.user_id !== userId) {
        return res.status(404).json({ error: "Conversation not found" });
      }
    } else {
      conversationId = await createConversation(userId);
    }

    // Save user message
    await saveMessage(conversationId, "user", message);

    // Enqueue LLM job
    await enqueueLLMJob({
      conversationId,
      message,
      userId
    });

    res.json({ 
      conversationId, 
      status: "processing",
      message: "Your message has been queued for processing"
    });
  } catch (error) {
    console.error("Error in handleChat:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getConversationHistory(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const conversations = await getConversationsByUser(userId);
    res.json({ conversations });
  } catch (error) {
    console.error("Error getting conversation history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getMessages(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    const { conversationId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify conversation belongs to user
    const conversation = await getConversation(conversationId);
    if (!conversation || conversation.user_id !== userId) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await getMessagesFromRepo(conversationId);
    res.json({ messages });
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Synchronous chat handler that matches the assignment requirements
 * POST /chat/message
 * Body: { message: string, sessionId?: string }
 * Returns: { reply: string, sessionId: string }
 */
export async function handleChatMessage(req: Request, res: Response) {
  try {
    let { message, sessionId } = req.body;

    // Input validation
    if (!message || typeof message !== "string") {
      return res.status(400).json({ 
        error: "Message is required and must be a non-empty string" 
      });
    }

    // Trim and validate message
    message = message.trim();
    if (message.length === 0) {
      return res.status(400).json({ 
        error: "Message cannot be empty" 
      });
    }

    // Validate message length (max 5000 characters to prevent abuse)
    const MAX_MESSAGE_LENGTH = 5000;
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ 
        error: `Message is too long. Maximum length is ${MAX_MESSAGE_LENGTH} characters.` 
      });
    }

    // Generate sessionId if not provided
    if (!sessionId || typeof sessionId !== "string") {
      sessionId = uuid();
    }

    // Get or create conversation for this session
    let conversationId: string | null = null;
    let dbAvailable = false;
    try {
      conversationId = await getOrCreateConversationBySessionId(sessionId);
      dbAvailable = true;
    } catch (dbError: any) {
      console.error("Database error when getting/creating conversation:", dbError);
      console.warn("Database unavailable. Processing request without persistence.");
      // If database is down, we'll process the request but won't persist anything
      // conversationId remains null, and we'll skip all database operations
    }

    // Save user message only if database is available and conversation exists
    if (dbAvailable && conversationId) {
      try {
        await saveMessage(conversationId, "user", message);
      } catch (dbError: any) {
        console.error("Database error when saving user message:", dbError);
        // If we can't save, mark DB as unavailable for this request
        dbAvailable = false;
      }
    }

    // Use BullMQ to process LLM request (with retry logic and job tracking)
    // This gives us better error handling, retries, and job monitoring
    // while maintaining synchronous API response
    const llmConversationId = conversationId || uuid();
    let reply: string;
    try {
      console.log(`[Chat] Enqueuing LLM job for session ${sessionId}, conversation ${llmConversationId}`);
      
      // Enqueue job and wait for it to complete
      // BullMQ will handle retries, error recovery, and job tracking
      const jobResult = await enqueueAndWaitForLLMJob({
        conversationId: llmConversationId,
        message: message,
        sessionId: sessionId
      }, 60000); // 60 second timeout

      if (!jobResult.success || !jobResult.reply) {
        throw new Error(jobResult.error || "Failed to get response from AI");
      }

      reply = jobResult.reply;
      console.log(`[Chat] LLM job completed successfully for session ${sessionId}`);
      
    } catch (llmError: any) {
      console.error("[Chat] LLM job error:", llmError);
      
      // Save error message as assistant response for context (only if DB is available)
      const errorMessage = llmError.message || "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.";
      if (dbAvailable && conversationId) {
        try {
          await saveMessage(conversationId, "assistant", errorMessage);
        } catch (dbError) {
          // DB might be down, but we still want to return the error to the user
          console.error("Could not save error message to database:", dbError);
        }
      }
      
      // Return user-friendly error
      return res.status(500).json({
        error: "Failed to get response from AI agent",
        message: errorMessage,
        sessionId
      });
    }

    // Save assistant reply only if database is available and conversation exists
    if (dbAvailable && conversationId) {
      try {
        await saveMessage(conversationId, "assistant", reply);
      } catch (dbError: any) {
        console.error("Database error when saving assistant reply:", dbError);
        // Continue even if we can't save to DB - the user still gets their response
      }
    }

    // Return response matching the API spec
    res.json({
      reply: reply,
      sessionId: sessionId
    });
  } catch (error: any) {
    console.error("Error in handleChatMessage:", error);
    
    // Never crash - always return a response
    res.status(500).json({ 
      error: "An unexpected error occurred. Please try again.",
      message: error.message || "Internal server error"
    });
  }
}

/**
 * Get conversation history by sessionId (no auth required)
 * GET /chat/history?sessionId=xxx
 */
export async function getHistoryBySession(req: Request, res: Response) {
  try {
    const { sessionId } = req.query;

    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ 
        error: "sessionId query parameter is required" 
      });
    }

    const conversation = await getConversationBySessionId(sessionId);
    if (!conversation) {
      return res.json({ 
        sessionId,
        messages: [] 
      });
    }

    const messages = await getMessagesFromRepo(conversation.id);
    res.json({ 
      sessionId,
      messages: messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at
      }))
    });
  } catch (error) {
    console.error("Error getting history by session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
