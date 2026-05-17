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
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-72 md:w-80" : "w-0"
        } transition-all duration-200 overflow-hidden border-r border-border flex-shrink-0 fixed md:relative inset-y-0 left-0 z-50 md:z-0`}
      >
        <Sidebar />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatArea />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
