"use client";

import { useState } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useConversations } from "@/hooks/use-conversations";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ChatSettings } from "./chat-settings";
import { Menu, Settings2, Download } from "lucide-react";
import type { Conversation } from "@/types";

interface ChatHeaderProps {
  conversation?: Conversation | null;
}

export function ChatHeader({ conversation }: ChatHeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { providers, models, setSidebarOpen, sidebarOpen } = useChatStore();
  const { updateConversation } = useConversations();

  const activeModels = models.filter(
    (m) => !conversation?.providerId || m.providerId === conversation.providerId
  );

  // Fallback: if no models but provider has defaultModelId, show it as an option
  const fallbackModels =
    activeModels.length === 0 && conversation?.providerId
      ? (() => {
          const provider = providers.find((p) => p.id === conversation.providerId);
          if (provider?.defaultModelId) {
            return [
              {
                id: `fallback-${provider.id}`,
                providerId: provider.id,
                displayName: provider.defaultModelId,
                modelId: provider.defaultModelId,
                contextWindow: null,
                maxOutputTokens: null,
                inputPrice: null,
                outputPrice: null,
                isFavorite: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ];
          }
          return [];
        })()
      : [];

  const modelOptions = activeModels.length > 0 ? activeModels : fallbackModels;

  const handleExportJson = () => {
    if (!conversation) return;
    const messages = useChatStore.getState().messages;
    const exportData = {
      title: conversation.title,
      exportedAt: new Date().toISOString(),
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${conversation.title.replace(/[^a-z0-9]/gi, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    if (!conversation) return;
    const messages = useChatStore.getState().messages;
    let md = `# ${conversation.title}\n\n`;
    messages.forEach((m) => {
      const role = m.role.charAt(0).toUpperCase() + m.role.slice(1);
      md += `## ${role}\n\n${m.content}\n\n---\n\n`;
    });
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${conversation.title.replace(/[^a-z0-9]/gi, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Provider selector */}
        <Select
          value={conversation?.providerId || ""}
          onChange={(e) => {
            if (conversation) {
              updateConversation(conversation.id, { providerId: e.target.value || null });
            }
          }}
          className="w-32 md:w-40 text-xs"
        >
          <option value="">Provider</option>
          {providers.filter((p) => p.isActive).map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>

        {/* Model selector */}
        <Select
          value={conversation?.modelId || ""}
          onChange={(e) => {
            if (conversation) {
              updateConversation(conversation.id, { modelId: e.target.value || null });
            }
          }}
          className="w-36 md:w-48 text-xs"
        >
          <option value="">Model</option>
          {modelOptions.map((m) => (
            <option key={m.id} value={m.id}>{m.displayName}</option>
          ))}
          {modelOptions.length === 0 && (
            <option value="" disabled>No models — add in Settings</option>
          )}
        </Select>

        <div className="flex-1" />

        {/* Export dropdown */}
        <div className="relative group">
          <Button variant="ghost" size="icon" title="Export">
            <Download className="h-4 w-4" />
          </Button>
          <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 w-40 rounded-md border border-border bg-popover p-1 shadow-lg">
            <button
              onClick={handleExportJson}
              className="w-full px-2 py-1.5 text-sm text-left rounded hover:bg-accent"
            >
              Export as JSON
            </button>
            <button
              onClick={handleExportMarkdown}
              className="w-full px-2 py-1.5 text-sm text-left rounded hover:bg-accent"
            >
              Export as Markdown
            </button>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSettingsOpen(true)}
          title="Chat Settings"
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </div>

      <ChatSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        conversation={conversation}
      />
    </>
  );
}
