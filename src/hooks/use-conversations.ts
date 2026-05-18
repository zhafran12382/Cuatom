import { useCallback, useEffect } from "react";
import { useChatStore } from "@/stores/chat-store";
import type { Conversation } from "@/types";

let conversationsLoaded = false;
let conversationsFetchPromise: Promise<void> | null = null;

export function useConversations() {
  // NOTE: subscribing via individual selectors keeps this hook from causing
  // every consumer to re-render on streamingContent changes.
  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const setMessages = useChatStore((s) => s.setMessages);

  const fetchConversations = useCallback(
    async (force = false) => {
      if (!force && conversationsLoaded) return;
      if (!force && conversationsFetchPromise) return conversationsFetchPromise;

      const run = (async () => {
        try {
          const res = await fetch("/api/conversations", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            setConversations(data);
            conversationsLoaded = true;
          }
        } catch (error) {
          console.error("Failed to fetch conversations:", error);
        }
      })();

      if (!force) {
        conversationsFetchPromise = run.finally(() => {
          conversationsFetchPromise = null;
        });
        return conversationsFetchPromise;
      }

      return run;
    },
    [setConversations]
  );

  useEffect(() => {
    fetchConversations().catch(() => {});
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

    // Optimistic: immediately show the new chat shell. Do not wait for a
    // second GET; that was one of the reasons first-load felt stuck.
    const prev = useChatStore.getState().conversations;
    setConversations([conv, ...prev.filter((c) => c.id !== conv.id)]);
    conversationsLoaded = true;
    setActiveConversation(conv.id);
    setMessages([]);

    // Reconcile in the background for server-side ordering/relations.
    fetchConversations(true).catch(() => {});
    return conv;
  };

  /**
   * Update conversation with an OPTIMISTIC store update so the UI flips
   * instantly the moment the user taps a new model. We then refetch in the
   * background to reconcile with what the server actually persisted.
   */
  const updateConversation = async (
    id: string,
    data: Partial<Conversation>
  ) => {
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
        setConversations(prev);
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to update conversation");
      }

      const fresh = await res.json();
      fetchConversations(true).catch(() => {});
      return fresh;
    } catch (error) {
      setConversations(prev);
      throw error;
    }
  };

  const deleteConversation = async (id: string) => {
    const prev = useChatStore.getState().conversations;
    setConversations(prev.filter((c) => c.id !== id));

    if (activeConversationId === id) {
      setActiveConversation(null);
      setMessages([]);
    }

    const res = await fetch(`/api/conversations/${id}`, {
      method: "DELETE",
      cache: "no-store",
    });
    if (!res.ok) {
      setConversations(prev);
      throw new Error("Failed to delete conversation");
    }

    fetchConversations(true).catch(() => {});
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
    // Show the chat shell instantly; load history after the tap has visibly
    // responded. Clearing first also prevents stale messages from flashing.
    setActiveConversation(id);
    setMessages([]);
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
