import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  created_at?: string;
}

interface ChatState {
  sessionId: string | null;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  setSessionId: (sessionId: string) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  setSending: (sending: boolean) => void;
  setError: (error: string | null) => void;
  clearChat: () => void;
  initializeSession: () => string;
}

// Generate a session ID
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessionId: null,
      messages: [],
      isLoading: false,
      isSending: false,
      error: null,
      setSessionId: (sessionId) => set({ sessionId }),
      setMessages: (messages) => set({ messages }),
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),
      setLoading: (isLoading) => set({ isLoading }),
      setSending: (isSending) => set({ isSending }),
      setError: (error) => set({ error }),
      clearChat: () =>
        set({
          sessionId: null,
          messages: [],
          error: null,
        }),
      initializeSession: () => {
        const current = get().sessionId;
        if (current) {
          return current;
        }
        const newSessionId = generateSessionId();
        set({ sessionId: newSessionId });
        return newSessionId;
      },
    }),
    {
      name: "chat-storage",
      // Only persist sessionId and messages, not loading states
      partialize: (state) => ({
        sessionId: state.sessionId,
        messages: state.messages,
      }),
    }
  )
);

