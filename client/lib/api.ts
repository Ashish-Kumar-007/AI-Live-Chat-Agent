import axios, { AxiosError } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests (optional - only for authenticated endpoints)
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token && config.url?.includes("/chat/conversations")) {
      // Only add token for authenticated endpoints
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        window.location.href = "/login";
      }
    } else if (error.response?.status === 429) {
      // Rate limit exceeded
      const retryAfter = error.response.headers["retry-after"];
      console.warn(`Rate limit exceeded. Retry after: ${retryAfter}s`);
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const chatApi = {
  // Main chat endpoint - synchronous, no auth required
  sendMessage: async (message: string, sessionId?: string) => {
    const response = await api.post("/chat/message", {
      message,
      sessionId,
    });
    return response.data; // Returns { reply: string, sessionId: string }
  },

  // Get conversation history by sessionId (no auth required)
  getHistory: async (sessionId: string) => {
    const response = await api.get(`/chat/history?sessionId=${sessionId}`);
    return response.data; // Returns { sessionId: string, messages: Message[] }
  },

  // Legacy authenticated endpoints (for backward compatibility)
  getConversations: async () => {
    const response = await api.get("/chat/conversations");
    return response.data;
  },

  getMessages: async (conversationId: string) => {
    const response = await api.get(`/chat/conversations/${conversationId}/messages`);
    return response.data;
  },
};

export const authApi = {
  login: async (userId: string) => {
    // For demo purposes, we'll generate a token client-side
    // In production, this should call a login endpoint
    const response = await api.post("/auth/login", { userId });
    return response.data;
  },
};

export type ApiError = {
  error: string;
  message?: string;
};

