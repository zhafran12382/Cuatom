import { useCallback, useEffect } from "react";
import { useChatStore } from "@/stores/chat-store";
import type { Conversation } from "@/types";

export function useConversations() {
  const {
    conversations,
    setConversations,
    activeConversationId,
    setActiveConversation,
    setMessages,
  } = useChatStore();

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  }, [setConversations]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createConversation = async (data?: Partial<Conversation>) => {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data || {}),
    });
    if (!res.ok) throw new Error("Failed to create conversation");
    const conv = await res.json();
    await fetchConversations();
    setActiveConversation(conv.id);
    setMessages([]);
    return conv;
  };

  const updateConversation = async (id: string, data: Partial<Conversation>) => {
    const res = await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update conversation");
    await fetchConversations();
    return res.json();
  };

  const deleteConversation = async (id: string) => {
    const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete conversation");
    if (activeConversationId === id) {
      setActiveConversation(null);
      setMessages([]);
    }
    await fetchConversations();
  };

  const loadMessages = async (conversationId: string) => {
    const res = await fetch(`/api/conversations/${conversationId}/messages`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
  };

  const selectConversation = async (id: string) => {
    setActiveConversation(id);
    await loadMessages(id);
  };

  return {
    conversations,
    activeConversationId,
    fetchConversations,
    createConversation,
    updateConversation,
    deleteConversation,
    selectConversation,
    loadMessages,
  };
}
