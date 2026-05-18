"use client";

import { useEffect, useRef } from "react";
import { Sidebar } from "./sidebar";
import { ChatArea } from "./chat-area";
import { useChatStore } from "@/stores/chat-store";
import { useProviders } from "@/hooks/use-providers";
import { useModels } from "@/hooks/use-models";
import { useConversations } from "@/hooks/use-conversations";

export function ChatLayout() {
  // Subscribe to ONLY the slices this component needs. Subscribing to the
  // whole store re-renders everything during streaming.
  const sidebarOpen = useChatStore((s) => s.sidebarOpen);
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);
  const conversations = useChatStore((s) => s.conversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const providers = useChatStore((s) => s.providers);

  useProviders();
  useModels();
  const { createConversation, selectConversation } = useConversations();

  const didAutoLand = useRef(false);

  // Land users straight into a chat view on first load:
  //  1. If they already have conversations → open the most recently updated one
  //  2. Else if they have providers configured → auto-create a fresh chat
  //  3. Else fall through to EmptyState
  useEffect(() => {
    if (didAutoLand.current) return;
    if (activeConversationId) {
      didAutoLand.current = true;
      return;
    }

    if (conversations.length > 0) {
      const latest = [...conversations].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];
      didAutoLand.current = true;
      selectConversation(latest.id);
      return;
    }

    if (providers.length > 0) {
      didAutoLand.current = true;
      createConversation().catch(() => {
        didAutoLand.current = false;
      });
    }
  }, [activeConversationId, conversations, providers, createConversation, selectConversation]);

  return (
    <div className="flex h-dvh">
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden border-r border-border/60 flex-shrink-0 fixed md:relative inset-y-0 left-0 z-50 md:z-0 w-[280px] md:w-72 md:translate-x-0`}
      >
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <ChatArea />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
