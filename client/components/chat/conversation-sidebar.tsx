"use client";

import { useEffect } from "react";
import { useChatStore, Conversation } from "@/store/chat-store";
import { chatApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { MessageSquare, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ConversationSidebar() {
  const {
    conversations,
    currentConversationId,
    isLoading,
    setConversations,
    setCurrentConversation,
    setMessages,
    clearChat,
  } = useChatStore();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      useChatStore.getState().setLoading(true);
      const data = await chatApi.getConversations();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      useChatStore.getState().setLoading(false);
    }
  };

  const handleNewChat = () => {
    clearChat();
  };

  const handleSelectConversation = async (conversationId: string) => {
    setCurrentConversation(conversationId);
    try {
      const { messages } = await chatApi.getMessages(conversationId);
      setMessages(messages || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col h-full">
      <div className="p-4 border-b">
        <Button
          onClick={handleNewChat}
          className="w-full"
          variant="default"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No conversations yet</p>
            <p className="text-xs mt-1">Start a new chat to begin</p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation: Conversation) => (
              <button
                key={conversation.id}
                onClick={() => handleSelectConversation(conversation.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg hover:bg-accent transition-colors text-sm",
                  currentConversationId === conversation.id &&
                    "bg-accent border border-primary/20"
                )}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">
                      {formatDate(conversation.created_at)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(conversation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

