"use client";

import { useChatStore } from "@/stores/chat-store";
import { useConversations } from "@/hooks/use-conversations";
import { Button } from "@/components/ui/button";
import {
  MessageSquarePlus,
  Menu,
  Settings,
  Sparkles,
  ArrowRight,
  Code2,
  PenLine,
  GraduationCap,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";

interface QuickStart {
  icon: typeof Code2;
  label: string;
  prompt: string;
  color: string;
}

const QUICK_STARTS: QuickStart[] = [
  {
    icon: Code2,
    label: "Debug code",
    prompt: "Help me debug a React component that isn't re-rendering when state changes.",
    color: "text-sky-400",
  },
  {
    icon: PenLine,
    label: "Write copy",
    prompt: "Write a friendly product launch announcement for a small Indonesian SaaS startup.",
    color: "text-violet-400",
  },
  {
    icon: GraduationCap,
    label: "Explain a concept",
    prompt: "Explain how attention works in a transformer model, in simple terms.",
    color: "text-emerald-400",
  },
  {
    icon: Lightbulb,
    label: "Brainstorm",
    prompt: "Give me 5 weekend project ideas combining AI and a Telegram bot.",
    color: "text-amber-400",
  },
];

export function EmptyState() {
  const { setSidebarOpen, sidebarOpen, providers } = useChatStore();
  const { createConversation, selectConversation } = useConversations();

  const hasProviders = providers.length > 0;

  const handleQuickStart = async (prompt: string) => {
    try {
      const conv = await createConversation();
      if (conv) {
        selectConversation(conv.id);
        useChatStore.setState({ pendingPrompt: prompt });
      }
    } catch {
      // creation failure silently ignored — user can retry
    }
  };

  const handleNewChat = async () => {
    try {
      const conv = await createConversation();
      if (conv) selectConversation(conv.id);
    } catch {
      // ignore
    }
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
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="text-center max-w-xl w-full">
          {/* Animated icon */}
          <div className="relative mx-auto mb-6 w-16 h-16 sm:w-20 sm:h-20">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 animate-pulse-subtle" />
            <div className="absolute inset-2 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <Sparkles className="h-7 w-7 sm:h-9 sm:w-9 text-primary animate-pulse-subtle" />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-semibold mb-2 tracking-tight">
            {hasProviders ? "Ready when you are" : "Welcome to AI Chat"}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-[15px] leading-relaxed mb-6 sm:mb-8 max-w-md mx-auto">
            {hasProviders
              ? "Pick a quick start below or open a new chat. Your last model is remembered."
              : "Connect a provider to start chatting with any OpenAI-compatible AI model."}
          </p>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            {hasProviders ? (
              <Button
                onClick={handleNewChat}
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

          {/* Quick starts — only show when providers exist */}
          {hasProviders && (
            <div className="text-left">
              <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-3 text-center">
                Try a quick start
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUICK_STARTS.map((qs, i) => {
                  const Icon = qs.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => handleQuickStart(qs.prompt)}
                      className="group flex items-start gap-3 px-3 py-3 rounded-xl border border-border/60 bg-card/50 text-left hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 min-h-[60px]"
                    >
                      <span
                        className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg bg-secondary/70 flex items-center justify-center ${qs.color}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-foreground">
                          {qs.label}
                        </span>
                        <span className="block text-[12px] text-muted-foreground/80 mt-0.5 line-clamp-2">
                          {qs.prompt}
                        </span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 mt-1.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
