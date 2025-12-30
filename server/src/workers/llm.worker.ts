import { Worker } from "bullmq";
import { redis } from "../cache/redis.client";
import { callLLM } from "../services/llm/cerebras.service";
import { saveMessage } from "../repositories/message.repo";
import { LLMJobData, LLMJobResult } from "../queues/llm.queue";

const worker = new Worker(
  "llm",
  async (job): Promise<LLMJobResult> => {
    try {
      const { conversationId, message, sessionId } = job.data as LLMJobData;
      
      console.log(`[Worker] Processing LLM job ${job.id} for conversation ${conversationId || sessionId}`);

      // Call LLM with conversation context and RAG
      const reply = await callLLM(conversationId, message);

      // Validate reply
      if (!reply || typeof reply !== "string" || reply.trim().length === 0) {
        throw new Error("Received empty response from AI");
      }

      // Truncate reply if too long (safety measure)
      const MAX_REPLY_LENGTH = 10000;
      const finalReply = reply.length > MAX_REPLY_LENGTH 
        ? reply.substring(0, MAX_REPLY_LENGTH) + "..." 
        : reply;

      // Save assistant response to database
      try {
        await saveMessage(conversationId, "assistant", finalReply);
      } catch (dbError) {
        console.warn(`[Worker] Could not save message to database (continuing):`, dbError);
        // Continue even if DB save fails - we still return the reply
      }

      console.log(`[Worker] Completed LLM job ${job.id} for conversation ${conversationId || sessionId}`);
      
      // Return the reply so the API can return it synchronously
      return { 
        success: true, 
        conversationId,
        reply: finalReply
      };
    } catch (error: any) {
      console.error(`[Worker] Error processing LLM job ${job.id}:`, error);
      
      // Return error in result format so API can handle it
      const errorMessage = error.message || "Failed to process LLM request";
      throw new Error(errorMessage);
    }
  },
  { 
    connection: redis,
    concurrency: 5, // Process up to 5 jobs concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 1000, // Per second (rate limiting)
    }
  }
);

worker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err?.message || err);
});

worker.on("error", (err) => {
  console.error(`[Worker] Worker error:`, err);
});

console.log("✅ LLM Worker started and ready to process jobs");
