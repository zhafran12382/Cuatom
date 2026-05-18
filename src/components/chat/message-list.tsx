"use client";

import { memo, useEffect, useRef } from "react";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import type { Message } from "@/types";

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
}

function MessageListImpl({ messages, isStreaming, streamingContent }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Track whether the user is "stuck to bottom" — if they scrolled up to read
  // older messages, we stop force-scrolling them as new content streams.
  const stickToBottom = useRef(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const threshold = 80;
      stickToBottom.current =
        el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!stickToBottom.current) return;
    // Use auto (instant) scroll during active streaming — smooth scroll
    // queues up animations and feels worse on slow devices.
    bottomRef.current?.scrollIntoView({
      behavior: isStreaming ? "auto" : "smooth",
    });
  }, [messages, streamingContent, isStreaming]);

  const showTyping = shouldShowTyping(messages, isStreaming);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-3 md:px-6 py-4 [contain:layout_paint] [content-visibility:auto]"
    >
      <div className="max-w-3xl mx-auto space-y-5">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Streaming message */}
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

        {/* Typing indicator */}
        {showTyping && !isStreaming && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function shouldShowTyping(messages: Message[], isStreaming: boolean): boolean {
  if (messages.length === 0) return false;
  const lastMsg = messages[messages.length - 1];
  return lastMsg.role === "user" && !isStreaming;
}

export const MessageList = memo(MessageListImpl);
