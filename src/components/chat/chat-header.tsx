"use client";

import { useState, useRef, useEffect } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useConversations } from "@/hooks/use-conversations";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ChatSettings } from "./chat-settings";
import { Menu, Settings2, Download, ChevronDown, Globe, Zap } from "lucide-react";
import type { Conversation } from "@/types";

interface ChatHeaderProps {
  conversation?: Conversation | null;
}

export function ChatHeader({ conversation }: ChatHeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(conversation?.title || "");
  const exportRef = useRef<HTMLDivElement>(null);
  const { providers, models, setSidebarOpen, sidebarOpen } = useChatStore();
  const { updateConversation } = useConversations();

  // Close export dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (conversation?.title) setTitleValue(conversation.title);
  }, [conversation?.title]);

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
    setExportOpen(false);
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
    setExportOpen(false);
  };

  const handleTitleSubmit = () => {
    if (conversation && titleValue.trim()) {
      updateConversation(conversation.id, { title: titleValue.trim() });
    }
    setEditingTitle(false);
  };

  const hasCustomSettings = conversation && (
    conversation.systemPrompt ||
    conversation.temperature !== 0.7 ||
    conversation.maxTokens !== 4096 ||
    !conversation.streaming
  );

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/60 bg-card/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="h-9 w-9 rounded-lg"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Editable title */}
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSubmit();
                if (e.key === "Escape") {
                  setTitleValue(conversation?.title || "");
                  setEditingTitle(false);
                }
              }}
              autoFocus
              className="w-full bg-transparent text-sm font-medium outline-none border-b border-primary/50 pb-0.5"
            />
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="text-sm font-medium truncate hover:text-primary transition-colors text-left"
              title="Click to edit title"
            >
              {conversation?.title || "New Chat"}
            </button>
          )}
        </div>

        {/* Provider selector */}
        <div className="hidden sm:flex items-center gap-1">
          <Globe className="h-3.5 w-3.5 text-muted-foreground/50" />
          <Select
            value={conversation?.providerId || ""}
            onChange={(e) => {
              if (conversation) {
                updateConversation(conversation.id, { providerId: e.target.value || null });
              }
            }}
            className="w-28 md:w-36 text-xs bg-transparent border-0 focus:ring-0"
          >
            <option value="">Provider</option>
            {providers.filter((p) => p.isActive).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </div>

        {/* Model selector */}
        <div className="hidden sm:flex items-center gap-1">
          <Zap className="h-3.5 w-3.5 text-muted-foreground/50" />
          <Select
            value={conversation?.modelId || ""}
            onChange={(e) => {
              if (conversation) {
                updateConversation(conversation.id, { modelId: e.target.value || null });
              }
            }}
            className="w-32 md:w-40 text-xs bg-transparent border-0 focus:ring-0"
          >
            <option value="">Model</option>
            {modelOptions.map((m) => (
              <option key={m.id} value={m.id}>{m.displayName}</option>
            ))}
            {modelOptions.length === 0 && (
              <option value="" disabled>No models — add in Settings</option>
            )}
          </Select>
        </div>

        {/* Export dropdown */}
        <div className="relative" ref={exportRef}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExportOpen(!exportOpen)}
            className="h-9 w-9 rounded-lg"
            title="Export"
            aria-label="Export conversation"
          >
            <Download className="h-4 w-4" />
          </Button>
          {exportOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-border bg-popover p-1.5 shadow-lg animate-scale-in">
              <button
                onClick={handleExportJson}
                className="w-full px-3 py-2 text-sm text-left rounded-lg hover:bg-accent transition-colors"
              >
                Export as JSON
              </button>
              <button
                onClick={handleExportMarkdown}
                className="w-full px-3 py-2 text-sm text-left rounded-lg hover:bg-accent transition-colors"
              >
                Export as Markdown
              </button>
            </div>
          )}
        </div>

        {/* Settings */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSettingsOpen(true)}
          className={`h-9 w-9 rounded-lg relative ${hasCustomSettings ? "text-primary" : ""}`}
          title="Chat Settings"
          aria-label="Chat settings"
        >
          <Settings2 className="h-4 w-4" />
          {hasCustomSettings && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          )}
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
