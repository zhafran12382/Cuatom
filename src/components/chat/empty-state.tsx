"use client";

import { useChatStore } from "@/stores/chat-store";
import { useConversations } from "@/hooks/use-conversations";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, Menu, Settings, Sparkles, Command, ArrowRight } from "lucide-react";
import Link from "next/link";

const QUICK_STARTS = [
  "Explain quantum computing in simple terms",
  "Help me debug my React code",
  "Write a creative short story",
  "Summarize the latest AI news",
  "Generate a meal plan for the week",
  "Teach me about neural networks",
];

export function EmptyState() {
  const { setSidebarOpen, sidebarOpen, providers } = useChatStore();
  const { createConversation } = useConversations();

  const hasProviders = providers.length > 0;

  const handleQuickStart = (prompt: string) => {
    createConversation().then((conv) => {
      // Give a small delay for the conversation to be ready
      setTimeout(() => {
        // This would need a way to send the message — for now just create the conv
        // The user can then type the prompt
      }, 100);
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center px-3 py-2.5 border-b border-border/60 bg-card/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="h-9 w-9 rounded-lg"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="text-center max-w-lg w-full">
          {/* Animated icon */}
          <div className="relative mx-auto mb-6 w-20 h-20">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 animate-pulse-subtle" />
            <div className="absolute inset-2 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <Sparkles className="h-9 w-9 text-primary animate-pulse-subtle" />
            </div>
          </div>

          <h2 className="text-2xl font-semibold mb-2 tracking-tight">Welcome to AI Chat</h2>
          <p className="text-muted-foreground text-[15px] leading-relaxed mb-8 max-w-sm mx-auto">
            {hasProviders
              ? "Start a conversation with your AI models. Ask anything, get insights, write code, or just chat."
              : "Add a provider first to connect with AI models and start chatting."}
          </p>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            {hasProviders ? (
              <Button
                onClick={() => createConversation()}
                className="gap-2 h-11 px-6 rounded-xl text-sm font-medium"
              >
                <MessageSquarePlus className="h-4 w-4" />
                New Chat
              </Button>
            ) : (
              <Link href="/settings/providers">
                <Button className="gap-2 h-11 px-6 rounded-xl text-sm font-medium">
                  <Settings className="h-4 w-4" />
                  Add Provider
                </Button>
              </Link>
            )}
          </div>

          {/* Quick starts */}
          {hasProviders && (
            <div className="text-left">
              <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-3 text-center">
                Try asking
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUICK_STARTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      createConversation();
                      // Note: we can't auto-send without more plumbing,
                      // but we can at least create a new conv
                    }}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-border/60 bg-card/50 text-sm text-left text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 group"
                  >
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 -ml-1 transition-opacity text-primary" />
                    <span className="truncate">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Keyboard hint */}
          <p className="text-[11px] text-muted-foreground/40 mt-8 flex items-center justify-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-mono border border-border/60">
              ⌘
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-mono border border-border/60">
              K
            </kbd>
            <span>to create new chat</span>
          </p>
        </div>
      </div>
    </div>
  );
}
