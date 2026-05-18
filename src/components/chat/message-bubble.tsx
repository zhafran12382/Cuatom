"use client";

import { memo, useState } from "react";
import { Copy, Check, AlertCircle, Bot, User } from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";
import type { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

function MessageBubbleImpl({ message, isStreaming }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const isError = !!message.error;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.role === "system") return null;

  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className={`flex gap-3 md:gap-4 ${isUser ? "flex-row-reverse" : ""} message-enter`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 md:w-8 md:h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isUser
            ? "bg-gradient-to-br from-primary/80 to-primary/40"
            : "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20"
        }`}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-400" />
        )}
      </div>

      {/* Content */}
      <div
        className={`group relative max-w-[88%] sm:max-w-[82%] md:max-w-[75%] ${
          isUser ? "text-right" : ""
        }`}
      >
        <div
          className={`rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
            isUser
              ? "bg-primary text-primary-foreground"
              : isError
              ? "bg-red-500/10 border border-red-500/20 text-red-300"
              : "bg-secondary/80 border border-border/50"
          }`}
        >
          {isError ? (
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{message.error}</p>
            </div>
          ) : isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}

          {isStreaming && <span className="streaming-cursor" />}
        </div>

        {/* Actions row */}
        <div
          className={`flex items-center gap-1.5 mt-1.5 transition-opacity duration-200 ${
            isUser || isError ? "justify-end" : ""
          }`}
        >
          {!isUser && !isError && message.content && (
            <>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors min-h-[32px]"
                title="Copy message"
                aria-label="Copy message"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-green-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>

              {message.totalTokens && (
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {message.totalTokens.toLocaleString()} tok
                </span>
              )}
              {message.cost && (
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  ${message.cost.toFixed(4)}
                </span>
              )}
            </>
          )}

          {/* Timestamp */}
          {formattedTime && (
            <span className="text-[11px] text-muted-foreground/70 tabular-nums ml-1">
              {formattedTime}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Memoize bubbles so streamingContent updates only re-render the streaming
 * bubble itself, not every previously-finalized message in the list.
 *
 * Custom equality: a bubble is equal to its previous render iff the message
 * payload that affects rendering hasn't changed. This is far cheaper than
 * shallow object compare because Message is a stable record once persisted.
 */
export const MessageBubble = memo(MessageBubbleImpl, (prev, next) => {
  if (prev.isStreaming !== next.isStreaming) return false;
  const a = prev.message;
  const b = next.message;
  return (
    a.id === b.id &&
    a.content === b.content &&
    a.role === b.role &&
    a.error === b.error &&
    a.totalTokens === b.totalTokens &&
    a.cost === b.cost &&
    a.createdAt === b.createdAt
  );
});
