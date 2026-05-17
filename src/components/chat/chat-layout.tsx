"use client";

import { Sidebar } from "./sidebar";
import { ChatArea } from "./chat-area";
import { useChatStore } from "@/stores/chat-store";
import { useProviders } from "@/hooks/use-providers";
import { useModels } from "@/hooks/use-models";
import { useConversations } from "@/hooks/use-conversations";

export function ChatLayout() {
  const { sidebarOpen, setSidebarOpen } = useChatStore();

  useProviders();
  useModels();
  useConversations();

  return (
    <div className="flex h-dvh">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden border-r border-border/60 flex-shrink-0 fixed md:relative inset-y-0 left-0 z-50 md:z-0 w-[280px] md:w-72 md:translate-x-0`}
      >
        <Sidebar />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <ChatArea />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}