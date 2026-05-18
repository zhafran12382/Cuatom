"use client";

import { useState, useRef, useEffect } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useConversations } from "@/hooks/use-conversations";
import { Button } from "@/components/ui/button";
import { ChatSettings } from "./chat-settings";
import { ModelSelector } from "./model-selector";
import { Menu, Settings2, Download } from "lucide-react";
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

  // Missing provider/model indicator
  const needsSetup = conversation && (!conversation.providerId || !conversation.modelId);

  const handleModelChange = (next: { providerId: string | null; modelId: string | null }) => {
    if (!conversation) return;
    updateConversation(conversation.id, {
      providerId: next.providerId,
      modelId: next.modelId,
    });
  };

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/60 bg-card/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="h-9 w-9 rounded-lg flex-shrink-0"
          aria-label="Toggle sidebar"
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
              className="text-sm font-medium truncate hover:text-primary transition-colors text-left w-full"
              title="Click to edit title"
            >
              {conversation?.title || "New Chat"}
            </button>
          )}
        </div>

        {/* Unified Provider + Model selector */}
        <ModelSelector
          providers={providers}
          models={models}
          value={{
            providerId: conversation?.providerId || null,
            modelId: conversation?.modelId || null,
          }}
          onChange={handleModelChange}
          compact
          className="max-w-[55vw] sm:max-w-[18rem]"
        />

        {/* Setup hint when no provider/model */}
        {needsSetup && (
          <span className="hidden md:inline-flex h-7 px-2 rounded-lg bg-amber-500/10 text-amber-400 text-[11px] font-medium items-center">
            Setup needed
          </span>
        )}

        {/* Export dropdown */}
        <div className="relative flex-shrink-0" ref={exportRef}>
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
                className="w-full px-3 py-2 text-sm text-left rounded-lg hover:bg-accent transition-colors min-h-[44px] flex items-center"
              >
                Export as JSON
              </button>
              <button
                onClick={handleExportMarkdown}
                className="w-full px-3 py-2 text-sm text-left rounded-lg hover:bg-accent transition-colors min-h-[44px] flex items-center"
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
          className={`h-9 w-9 rounded-lg relative flex-shrink-0 ${hasCustomSettings ? "text-primary" : ""}`}
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
