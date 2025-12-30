import { Queue } from "bullmq";
import { redis } from "../cache/redis.client";

export const llmQueue = new Queue("llm", {
  connection: redis
});

export interface LLMJobData {
  conversationId: string;
  message: string;
  userId?: string; // Optional for sessionId-based requests
  sessionId?: string; // For sessionId-based requests
}

export interface LLMJobResult {
  success: boolean;
  conversationId: string;
  reply: string; // The AI response
  error?: string; // Error message if failed
}

/**
 * Enqueue an LLM job and wait for it to complete
 * This allows us to use BullMQ's retry logic and job tracking
 * while maintaining a synchronous API response
 */
export async function enqueueAndWaitForLLMJob(
  data: LLMJobData,
  timeout: number = 60000 // 60 second timeout
): Promise<LLMJobResult> {
  const job = await llmQueue.add("chat", data, {
    attempts: 3, // Retry up to 3 times on failure
    backoff: { 
      type: "exponential", 
      delay: 2000 // Start with 2s delay, exponential backoff
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 100 // Keep last 100 completed jobs
    },
    removeOnFail: {
      age: 24 * 3600 // Keep failed jobs for 24 hours
    }
  });

  // Wait for the job to complete (with timeout)
  // Use polling approach since waitUntilFinished() has issues with event emitters
  const startTime = Date.now();
  const pollInterval = 500; // Poll every 500ms
  
  return new Promise<LLMJobResult>((resolve, reject) => {
    const poll = async () => {
      try {
        // Check timeout
        if (Date.now() - startTime > timeout) {
          reject(new Error("Job timeout - request took too long"));
          return;
        }

        // Get job state
        const state = await job.getState();
        
        if (state === "completed") {
          // Job completed successfully - get the return value
          // Refresh the job to get the latest data
          if (!job.id) {
            reject(new Error("Job ID is missing"));
            return;
          }
          const completedJob = await llmQueue.getJob(job.id);
          if (!completedJob) {
            reject(new Error("Job completed but could not retrieve job data"));
            return;
          }
          
          const returnValue = completedJob.returnvalue;
          if (returnValue && typeof returnValue === "object" && returnValue.reply) {
            resolve(returnValue as LLMJobResult);
          } else {
            reject(new Error("Job completed but no reply in result"));
          }
        } else if (state === "failed") {
          // Job failed
          const failedReason = job.failedReason || "Unknown error";
          reject(new Error(failedReason));
        } else if (state === "active" || state === "waiting" || state === "delayed") {
          // Job still processing, poll again
          setTimeout(poll, pollInterval);
        } else {
          // Unknown state, poll again
          setTimeout(poll, pollInterval);
        }
      } catch (error: any) {
        // If we can't get state, check if job is still in queue
        try {
          const state = await job.getState();
          if (state === "failed") {
            const failedReason = job.failedReason || "Unknown error";
            reject(new Error(failedReason));
          } else {
            // Continue polling
            setTimeout(poll, pollInterval);
          }
        } catch (stateError) {
          // If we can't get state at all, reject with original error
          reject(error);
        }
      }
    };

    // Start polling
    poll();
  });
}

/**
 * Legacy function for async processing (returns immediately)
 */
export async function enqueueLLMJob(data: LLMJobData) {
  const job = await llmQueue.add("chat", data, {
    attempts: 3,
    backoff: { 
      type: "exponential", 
      delay: 2000 
    },
    removeOnComplete: {
      age: 3600,
      count: 100
    },
    removeOnFail: {
      age: 24 * 3600
    }
  });
  
  return job;
}
