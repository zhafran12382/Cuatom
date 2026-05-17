"use client";

import { useChatStore } from "@/stores/chat-store";
import { useConversations } from "@/hooks/use-conversations";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, Menu, Settings } from "lucide-react";
import Link from "next/link";

export function EmptyState() {
  const { setSidebarOpen, sidebarOpen, providers } = useChatStore();
  const { createConversation } = useConversations();

  const hasProviders = providers.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-3 py-2 border-b border-border bg-card">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MessageSquarePlus className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">AI Chat</h2>
          <p className="text-muted-foreground mb-6">
            {hasProviders
              ? "Start a new conversation to chat with your AI models."
              : "Add a provider first to start chatting with AI models."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {hasProviders ? (
              <Button onClick={() => createConversation()} className="gap-2">
                <MessageSquarePlus className="h-4 w-4" />
                New Chat
              </Button>
            ) : (
              <Link href="/settings/providers">
                <Button className="gap-2">
                  <Settings className="h-4 w-4" />
                  Add Provider
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
