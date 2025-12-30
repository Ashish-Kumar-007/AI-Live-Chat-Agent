import Cerebras from "@cerebras/cerebras_cloud_sdk";
import { env } from "../../config/env";
import { buildPrompt } from "./prompt.builder";
import { getContext } from "../rag.service";

/**
 * Cerebras AI Client
 * 
 * Using the official Cerebras Cloud SDK
 * Reference: https://inference-docs.cerebras.ai/
 * 
 * Available models: llama-3.3-70b, qwen2.5-72b, gpt-oss-120b, and more
 * 
 * @see https://cloud.cerebras.ai/ for API keys and model availability
 */
const cerebrasClient = new Cerebras({
  apiKey: env.cerebrasApiKey, // This is the default and can be omitted
});

export async function callLLM(
  conversationId: string,
  userMessage: string
): Promise<string> {
  // Validate API key is configured
  if (!env.cerebrasApiKey) {
    throw new Error("Cerebras API key is not configured. Please set CEREBRAS_API_KEY in your .env file.");
  }

  try {
    // Get RAG context if enabled
    const ragContext = await getContext(userMessage);

    // Build prompt with conversation history and RAG context
    const messages = await buildPrompt(conversationId, userMessage, ragContext);

    // Call Cerebras AI API using the official SDK
    // Reference: https://inference-docs.cerebras.ai/quickstart
    const response = await cerebrasClient.chat.completions.create({
      model: env.cerebrasModel,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000, // Increased for better responses
      top_p: 0.9,
      frequency_penalty: 0.0,
      presence_penalty: 0.0
    }) as any; // Cerebras SDK response type

    let content = response.choices?.[0]?.message?.content as string | undefined;
    
    if (!content) {
      throw new Error("Empty response from Cerebras AI");
    }

    // Clean the response to remove any reasoning tags or internal thinking
    content = cleanResponse(content);

    return content;
  } catch (error: any) {
    console.error("Cerebras AI API error:", error.message || error);
    
    // Provide helpful, user-friendly error messages
    if (error.status === 401 || error.statusCode === 401) {
      throw new Error("I'm having trouble connecting to the AI service. Please contact support if this persists.");
    } else if (error.status === 404 || error.statusCode === 404) {
      throw new Error("The AI service is temporarily unavailable. Please try again in a moment.");
    } else if (error.status === 429 || error.statusCode === 429) {
      throw new Error("The AI service is currently busy. Please wait a moment and try again.");
    } else if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT" || error.code === "ENOTFOUND") {
      throw new Error("I'm having trouble connecting right now. Please check your internet connection and try again.");
    } else if (error.message?.includes("timeout") || error.message?.includes("TIMEOUT")) {
      throw new Error("The request took too long to process. Please try again with a shorter message.");
    } else if (error.message?.includes("rate limit") || error.message?.includes("Rate limit")) {
      throw new Error("Too many requests. Please wait a moment before trying again.");
    } else if (error.response?.data?.error?.message) {
      // Use API error message if available
      throw new Error(`AI service error: ${error.response.data.error.message}`);
    } else if (error.message) {
      // Use the error message if it's user-friendly
      throw new Error(error.message);
    } else {
      // Generic fallback
      throw new Error("I apologize, but I'm having trouble processing your request right now. Please try again in a moment.");
    }
  }
}

/**
 * Clean the AI response to remove reasoning tags and internal thinking
 * Removes tags like <think>, <think>, <reasoning>, etc.
 */
function cleanResponse(content: string): string {
  // Remove reasoning tags and their content
  // Pattern: <tag>...</tag> or <tag /> (self-closing)
  let cleaned = content;
  
  // Remove common reasoning tags (including <think> and <think> which some models use)
  const reasoningTags = [
    /<think>[\s\S]*?<\/redacted_reasoning>/gi,
    /<think>[\s\S]*?<\/think>/gi,
    /<reasoning>[\s\S]*?<\/reasoning>/gi,
    /<internal>[\s\S]*?<\/internal>/gi,
    /<thought>[\s\S]*?<\/thought>/gi,
    /\[REASONING\][\s\S]*?\[\/REASONING\]/gi,
    /\[THINKING\][\s\S]*?\[\/THINKING\]/gi,
  ];
  
  for (const pattern of reasoningTags) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Remove any remaining XML-like tags that might be reasoning
  // But keep common formatting if needed (we'll be conservative)
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  
  // Clean up extra whitespace and newlines
  cleaned = cleaned.trim();
  
  // If cleaning removed everything, return original (shouldn't happen, but safety check)
  if (!cleaned || cleaned.length === 0) {
    return content.trim();
  }
  
  return cleaned;
}

/**
 * Test Cerebras AI connection on startup
 * This verifies the API key and connection are working
 */
export async function testCerebrasConnection(): Promise<boolean> {
  // Validate API key is configured
  if (!env.cerebrasApiKey) {
    console.error("❌ CEREBRAS_API_KEY is not set in environment variables");
    return false;
  }

  try {
    // Make a simple test request to verify connection
    const testResponse = await cerebrasClient.chat.completions.create({
      messages: [{ role: "user", content: "Hello" }],
      model: env.cerebrasModel,
      max_tokens: 10, // Small response for connection test
    }) as any; // Cerebras SDK response type

    if (testResponse.choices && Array.isArray(testResponse.choices) && testResponse.choices.length > 0) {
      console.log("✅ Cerebras AI is connected and ready");
      return true;
    } else {
      console.error("❌ Cerebras AI connection test failed: Empty response");
      return false;
    }
  } catch (error: any) {
    console.error("❌ Cerebras AI connection test failed:", error.message || error);
    
    // Provide helpful error messages
    if (error.status === 401 || error.statusCode === 401) {
      console.error("   Invalid API key. Please check CEREBRAS_API_KEY in .env");
    } else if (error.status === 404 || error.statusCode === 404) {
      console.error(`   Model '${env.cerebrasModel}' not found. Check available models at https://cloud.cerebras.ai/`);
    } else if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT" || error.code === "ENOTFOUND") {
      console.error("   Cannot connect to Cerebras API. Check your internet connection.");
    } else {
      console.error("   Connection error:", error.message || error);
    }
    
    return false;
  }
}

