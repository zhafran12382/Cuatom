"use client";

import { memo, useState, useRef, useEffect, useCallback } from "react";
import { Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (content: string) => void;
  isLoading: boolean;
  onStop: () => void;
}

function ChatInputImpl({ onSend, isLoading, onStop }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
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

  const hasContent = input.trim().length > 0;

  return (
    <div className="border-t border-border/60 bg-card/80 backdrop-blur-sm p-3 md:p-4 safe-area-inset-bottom">
      <div className="max-w-3xl mx-auto">
        <div
          className={`flex items-end gap-2 rounded-2xl border px-3 py-2.5 transition-all duration-200 ${
            isFocused
              ? "border-primary/40 shadow-[0_0_0_1px_hsl(var(--primary)/0.15)] bg-background"
              : "border-input/80 bg-background/60"
          }`}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask anything..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground/60 max-h-[150px] py-1"
          />

          {/* Send / Stop button */}
          {isLoading ? (
            <Button
              variant="destructive"
              size="icon"
              onClick={onStop}
              className="flex-shrink-0 h-9 w-9 rounded-xl"
              title="Stop generation"
              aria-label="Stop generation"
            >
              <Square className="h-4 w-4 fill-current" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={!hasContent}
              className={`flex-shrink-0 h-9 w-9 rounded-xl transition-all duration-200 ${
                hasContent
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
                  : "bg-muted text-muted-foreground"
              }`}
              title="Send message"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Keyboard hint — desktop only */}
        <p className="text-[11px] text-center text-muted-foreground/50 mt-1.5 hidden sm:block">
          Enter to send · Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}

export const ChatInput = memo(ChatInputImpl);