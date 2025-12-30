"use client";

import { useEffect } from "react";
import { useChatStore } from "@/store/chat-store";
import { chatApi } from "@/lib/api";
import { ChatContainer } from "@/components/chat/chat-container";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function ChatPage() {
  const { 
    sessionId, 
    messages, 
    setMessages, 
    setLoading, 
    setError,
    initializeSession,
    clearChat 
  } = useChatStore();

  // Initialize session and load history on mount
  useEffect(() => {
    const loadHistory = async () => {
      const currentSessionId = sessionId || initializeSession();
      
      if (currentSessionId && messages.length === 0) {
        setLoading(true);
        try {
          const history = await chatApi.getHistory(currentSessionId);
          if (history.messages && history.messages.length > 0) {
            // Transform messages to match our format
            const formattedMessages = history.messages.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp || msg.created_at,
            }));
            setMessages(formattedMessages);
          }
        } catch (error: any) {
          // If history doesn't exist yet, that's fine - just start fresh
          console.log("No conversation history found, starting fresh");
        } finally {
          setLoading(false);
        }
      }
    };

    loadHistory();
  }, []); // Only run on mount

  const handleClearChat = () => {
    if (confirm("Are you sure you want to clear the chat? This will start a new conversation.")) {
      clearChat();
      initializeSession(); // Start a new session
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">AI Customer Support Chat</h1>
            <span className="text-xs text-muted-foreground">
              Powered by Cerebras AI
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear Chat
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatContainer />
      </div>
    </div>
  );
}

