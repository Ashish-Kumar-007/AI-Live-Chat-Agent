"use client";

import { Message } from "@/store/chat-store";
import { formatDate } from "@/lib/utils";
import { User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 mb-6 animate-in fade-in slide-in-from-bottom-2",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        )}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        ) : (
          <div className="text-sm break-words">
            <ReactMarkdown
              components={{
                // Style headings
                h1: ({ node, ...props }) => (
                  <h1 className="text-lg font-bold mt-2 mb-1" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-base font-bold mt-2 mb-1" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-sm font-bold mt-2 mb-1" {...props} />
                ),
                // Style bold text (**text**)
                strong: ({ node, ...props }) => (
                  <strong className="font-bold" {...props} />
                ),
                // Style paragraphs
                p: ({ node, ...props }) => (
                  <p className="mb-2 last:mb-0 whitespace-pre-wrap" {...props} />
                ),
                // Style lists
                ul: ({ node, ...props }) => (
                  <ul className="list-disc list-inside mb-2 space-y-1 ml-2" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal list-inside mb-2 space-y-1 ml-2" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="mb-1" {...props} />
                ),
                // Style code blocks
                code: ({ node, className, ...props }: any) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="bg-muted-foreground/20 px-1 py-0.5 rounded text-xs font-mono" {...props} />
                  ) : (
                    <code className="block bg-muted-foreground/20 p-2 rounded text-xs font-mono overflow-x-auto mb-2" {...props} />
                  );
                },
                // Style blockquotes
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-muted-foreground/30 pl-3 italic my-2" {...props} />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        <p
          className={cn(
            "text-xs mt-1 opacity-70",
            isUser ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {formatDate(message.timestamp || message.created_at)}
        </p>
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
      )}
    </div>
  );
}

