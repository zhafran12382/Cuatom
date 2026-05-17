"use client";

import { useState } from "react";
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
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export function Sidebar() {
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const { activeConversationId } = useChatStore();
  const {
    conversations,
    createConversation,
    deleteConversation,
    updateConversation,
    selectConversation,
  } = useConversations();

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const pinned = filtered.filter((c) => c.isPinned);
  const unpinned = filtered.filter((c) => !c.isPinned);

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold">AI Chat</h1>
          <Link href="/settings/providers">
            <Button variant="ghost" size="icon" title="Settings">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <Button
          className="w-full justify-start gap-2"
          onClick={() => createConversation()}
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2">
        {pinned.length > 0 && (
          <div className="mb-2">
            <p className="text-xs font-medium text-muted-foreground px-2 mb-1">Pinned</p>
            {pinned.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeConversationId}
                onSelect={() => selectConversation(conv.id)}
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
            {pinned.length > 0 && (
              <p className="text-xs font-medium text-muted-foreground px-2 mb-1">Recent</p>
            )}
            {unpinned.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeConversationId}
                onSelect={() => selectConversation(conv.id)}
                onDelete={() => deleteConversation(conv.id)}
                onTogglePin={() => updateConversation(conv.id, { isPinned: !conv.isPinned })}
                menuOpen={menuOpen === conv.id}
                onMenuToggle={() => setMenuOpen(menuOpen === conv.id ? null : conv.id)}
              />
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {search ? "No chats found" : "No conversations yet"}
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
      className={`group relative flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer mb-0.5 ${
        isActive ? "bg-accent" : "hover:bg-accent/50"
      }`}
      onClick={onSelect}
    >
      <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{conversation.title}</p>
        <p className="text-xs text-muted-foreground">{formatDate(conversation.updatedAt)}</p>
      </div>
      {conversation.isPinned && (
        <Pin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
      )}

      <div className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-secondary"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 z-50 w-36 rounded-md border border-border bg-popover p-1 shadow-lg">
            <button
              onClick={(e) => { e.stopPropagation(); onTogglePin(); onMenuToggle(); }}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent"
            >
              <Pin className="h-3.5 w-3.5" />
              {conversation.isPinned ? "Unpin" : "Pin"}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); onMenuToggle(); }}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent text-destructive"
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
