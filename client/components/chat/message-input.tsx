"use client";

import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { chatApi } from "@/lib/api";

export function MessageInput() {
  const [input, setInput] = useState("");
  const { 
    sessionId, 
    isSending, 
    setSending, 
    addMessage, 
    setSessionId, 
    setError,
    initializeSession 
  } = useChatStore();

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const userMessage = input.trim();
    setInput("");
    setSending(true);
    setError(null);

    // Ensure we have a sessionId
    const currentSessionId = sessionId || initializeSession();

    // Add user message optimistically
    const userMessageObj = {
      id: `user-${Date.now()}`,
      role: "user" as const,
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMessageObj);

    try {
      // Call the synchronous API endpoint
      const response = await chatApi.sendMessage(
        userMessage,
        currentSessionId
      );

      // Update sessionId if returned (should be the same or new)
      if (response.sessionId) {
        setSessionId(response.sessionId);
      }

      // Add assistant reply immediately (synchronous response)
      if (response.reply) {
        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant" as const,
          content: response.reply,
          timestamp: new Date().toISOString(),
        };
        addMessage(assistantMessage);
      } else {
        throw new Error("No reply received from server");
      }
    } catch (error: any) {
      // Remove the user message on error (or keep it and show error)
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          "Failed to send message. Please try again.";
      setError(errorMessage);
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="flex gap-2 max-w-4xl mx-auto">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isSending}
          className="flex-1"
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isSending}
          size="icon"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

