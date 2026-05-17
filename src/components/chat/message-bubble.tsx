"use client";

import { useState } from "react";
import { Copy, Check, AlertCircle } from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";
import type { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const isError = !!message.error;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.role === "system") return null;

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? "bg-secondary" : "bg-primary/20"
        }`}
      >
        <span className={`text-xs font-medium ${isUser ? "" : "text-primary"}`}>
          {isUser ? "U" : "AI"}
        </span>
      </div>

      <div className={`group relative max-w-[85%] md:max-w-[75%] ${isUser ? "text-right" : ""}`}>
        <div
          className={`rounded-xl px-4 py-2.5 ${
            isUser
              ? "bg-primary text-primary-foreground"
              : isError
              ? "bg-red-500/10 border border-red-500/30"
              : "bg-secondary"
          }`}
        >
          {isError ? (
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-300">{message.error}</p>
            </div>
          ) : isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}

          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-foreground animate-pulse ml-0.5" />
          )}
        </div>

        {!isUser && !isError && message.content && (
          <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-accent"
              title="Copy"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
            {message.totalTokens && (
              <span className="text-xs text-muted-foreground">
                {message.totalTokens} tokens
              </span>
            )}
            {message.cost && (
              <span className="text-xs text-muted-foreground">
                ${message.cost.toFixed(4)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
