"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import type { Message } from "@/types";

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
}

export function MessageList({ messages, isStreaming, streamingContent }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Use scrollTo for smoother control
    const el = scrollRef.current;
    if (el) {
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      if (isNearBottom) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages, streamingContent]);

  const showTyping = isLoading(messages, isStreaming);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 md:px-6 py-4">
      <div className="max-w-3xl mx-auto space-y-5">
        {messages.map((msg, index) => (
          <div
            key={msg.id}
            className="animate-fade-in-up"
            style={{
              animationDelay: `${Math.min(index * 40, 300)}ms`,
              animationFillMode: "both",
            }}
          >
            <MessageBubble message={msg} />
          </div>
        ))}

        {/* Streaming message */}
        {isStreaming && streamingContent && (
          <div className="animate-fade-in-up" style={{ animationFillMode: "both" }}>
            <MessageBubble
              message={{
                id: "streaming",
                conversationId: "",
                role: "assistant",
                content: streamingContent,
                providerName: null,
                modelId: null,
                promptTokens: null,
                completionTokens: null,
                totalTokens: null,
                cost: null,
                error: null,
                createdAt: new Date().toISOString(),
              }}
              isStreaming
            />
          </div>
        )}

        {/* Typing indicator */}
        {showTyping && !isStreaming && (
          <div className="animate-fade-in">
            <TypingIndicator />
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function isLoading(messages: Message[], isStreaming: boolean): boolean {
  // Show typing if last message is user and not streaming yet
  if (messages.length === 0) return false;
  const lastMsg = messages[messages.length - 1];
  return lastMsg.role === "user" && !isStreaming;
}
