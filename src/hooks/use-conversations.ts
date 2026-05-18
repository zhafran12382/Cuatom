import { useCallback, useEffect } from "react";
import { useChatStore } from "@/stores/chat-store";
import type { Conversation } from "@/types";

export function useConversations() {
  // NOTE: subscribing via individual selectors keeps this hook from causing
  // every consumer to re-render on streamingContent changes.
  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const setMessages = useChatStore((s) => s.setMessages);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations", { cache: "no-store" });
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
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to create conversation");
    const conv = await res.json();
    await fetchConversations();
    setActiveConversation(conv.id);
    setMessages([]);
    return conv;
  };

  /**
   * Update conversation with an OPTIMISTIC store update so the UI flips
   * instantly the moment the user taps a new model. We then refetch in the
   * background to reconcile with what the server actually persisted.
   *
   * Without this, switching models felt frozen on slow mobile networks
   * because we were waiting two round-trips (PATCH then GET) before the
   * header re-rendered.
   */
  const updateConversation = async (
    id: string,
    data: Partial<Conversation>
  ) => {
    // Optimistic local update — only replace fields we touched.
    const prev = useChatStore.getState().conversations;
    const optimistic = prev.map((c) =>
      c.id === id
        ? { ...c, ...data, updatedAt: new Date().toISOString() }
        : c
    );
    setConversations(optimistic);

    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        cache: "no-store",
      });

      if (!res.ok) {
        // Roll back optimistic state and surface the error
        setConversations(prev);
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to update conversation");
      }

      const fresh = await res.json();
      // Refetch in background to pick up server-side derived fields
      // (provider/model relations, updatedAt) without blocking the UI.
      fetchConversations().catch(() => {});
      return fresh;
    } catch (error) {
      setConversations(prev);
      throw error;
    }
  };

  const deleteConversation = async (id: string) => {
    const res = await fetch(`/api/conversations/${id}`, {
      method: "DELETE",
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to delete conversation");
    if (activeConversationId === id) {
      setActiveConversation(null);
      setMessages([]);
    }
    await fetchConversations();
  };

  const loadMessages = async (conversationId: string) => {
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      cache: "no-store",
    });
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
