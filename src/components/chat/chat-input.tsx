"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (content: string) => void;
  isLoading: boolean;
  onStop: () => void;
}

export function ChatInput({ onSend, isLoading, onStop }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border bg-card p-3 md:p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2 rounded-xl border border-input bg-background px-3 py-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground max-h-[200px]"
            disabled={isLoading}
          />
          {isLoading ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onStop}
              className="flex-shrink-0 h-8 w-8 text-destructive"
              title="Stop generation"
            >
              <Square className="h-4 w-4 fill-current" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="flex-shrink-0 h-8 w-8"
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
