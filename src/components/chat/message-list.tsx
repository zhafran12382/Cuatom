"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./message-bubble";
import type { Message } from "@/types";

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
}

export function MessageList({ messages, isStreaming, streamingContent }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4">
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isStreaming && streamingContent && (
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
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
