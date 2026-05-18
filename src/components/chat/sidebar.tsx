"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useConversations } from "@/hooks/use-conversations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  MessageSquare,
  Pin,
  Trash2,
  Settings,
  MoreVertical,
  X,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

function getRelativeDateLabel(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "Today";
  if (diffDays < 2) return "Yesterday";
  if (diffDays < 7) return "Previous 7 Days";
  if (diffDays < 30) return "Previous 30 Days";
  return "Older";
}

export function Sidebar() {
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Subscribe granularly so streaming updates don't re-render the whole list.
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);

  const {
    conversations,
    createConversation,
    deleteConversation,
    updateConversation,
    selectConversation,
  } = useConversations();

  // Close sidebar on mobile when a conversation is selected
  const handleSelect = (id: string) => {
    selectConversation(id);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleNewChat = async () => {
    const conv = await createConversation();
    if (conv) {
      selectConversation(conv.id);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    }
  };

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const pinned = filtered.filter((c) => c.isPinned);
  const unpinned = filtered.filter((c) => !c.isPinned);

  // Group unpinned by date
  const groupedUnpinned = useMemo(() => {
    const groups: Record<string, typeof unpinned> = {};
    unpinned.forEach((conv) => {
      const label = getRelativeDateLabel(conv.updatedAt);
      if (!groups[label]) groups[label] = [];
      groups[label].push(conv);
    });
    return groups;
  }, [unpinned]);

  const groupOrder = ["Today", "Yesterday", "Previous 7 Days", "Previous 30 Days", "Older"];

  return (
    <div className="flex flex-col h-full bg-card/95 backdrop-blur-sm">
      {/* Header */}
      <div className="p-3 border-b border-border/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <h1 className="text-[15px] font-semibold tracking-tight">AI Chat</h1>
          </div>
          <Link href="/settings/providers">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" title="Settings">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <Button
          className="w-full justify-start gap-2 rounded-xl h-10 text-sm font-medium"
          onClick={handleNewChat}
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
          <Input
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 h-9 text-sm rounded-xl bg-secondary/50 border-transparent focus:border-primary/30"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-accent transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 safe-area-inset-bottom" ref={menuRef}>
        {pinned.length > 0 && (
          <div className="mb-2">
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider px-2.5 mb-1.5">
              Pinned
            </p>
            {pinned.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeConversationId}
                onSelect={() => handleSelect(conv.id)}
                onDelete={() => deleteConversation(conv.id)}
                onTogglePin={() => updateConversation(conv.id, { isPinned: !conv.isPinned })}
                menuOpen={menuOpen === conv.id}
                onMenuToggle={() => setMenuOpen(menuOpen === conv.id ? null : conv.id)}
              />
            ))}
          </div>
        )}

        {unpinned.length > 0 && (
          <div>
            {groupOrder.map((label) => {
              const group = groupedUnpinned[label];
              if (!group || group.length === 0) return null;
              return (
                <div key={label} className="mb-2">
                  {pinned.length > 0 && (
                    <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider px-2.5 mb-1.5">
                      {label}
                    </p>
                  )}
                  {group.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isActive={conv.id === activeConversationId}
                      onSelect={() => handleSelect(conv.id)}
                      onDelete={() => deleteConversation(conv.id)}
                      onTogglePin={() =>
                        updateConversation(conv.id, { isPinned: !conv.isPinned })
                      }
                      menuOpen={menuOpen === conv.id}
                      onMenuToggle={() => setMenuOpen(menuOpen === conv.id ? null : conv.id)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground/60 text-sm">
            {search ? (
              <div className="flex flex-col items-center gap-2">
                <Search className="h-5 w-5 opacity-50" />
                <p>No chats found</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <MessageSquare className="h-5 w-5 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-xs opacity-50">Start a new chat to begin</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConversationItemProps {
  conversation: { id: string; title: string; isPinned: boolean; updatedAt: string };
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  menuOpen: boolean;
  onMenuToggle: () => void;
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onTogglePin,
  menuOpen,
  onMenuToggle,
}: ConversationItemProps) {
  return (
    <div
      className={`group relative flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl cursor-pointer mb-0.5 transition-all duration-150 ${
        isActive
          ? "bg-primary/10 border-l-[3px] border-primary"
          : "hover:bg-accent/50 border-l-[3px] border-transparent"
      }`}
      onClick={onSelect}
    >
      <MessageSquare
        className={`h-4 w-4 flex-shrink-0 ${
          isActive ? "text-primary" : "text-muted-foreground/50"
        }`}
      />
      <div className="flex-1 min-w-0 text-left">
        <p className={`text-sm truncate ${isActive ? "font-medium" : ""}`}>
          {conversation.title}
        </p>
        <p className="text-[11px] text-muted-foreground/60 mt-0.5">
          {formatDate(conversation.updatedAt)}
        </p>
      </div>
      {conversation.isPinned && (
        <Pin className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />
      )}

      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMenuToggle();
          }}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-secondary transition-all duration-150"
          aria-label="Conversation options"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 z-50 w-40 rounded-xl border border-border bg-popover p-1.5 shadow-lg animate-scale-in">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin();
                onMenuToggle();
              }}
              className="flex items-center gap-2 w-full px-2.5 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
            >
              <Pin className="h-3.5 w-3.5" />
              {conversation.isPinned ? "Unpin" : "Pin"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                onMenuToggle();
              }}
              className="flex items-center gap-2 w-full px-2.5 py-2 text-sm rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
