"use client";

import { useEffect } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useConversations } from "@/hooks/use-conversations";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { EmptyState } from "./empty-state";

export function ChatArea() {
  // Subscribe only to slices this component reads. Anything that flips
  // during streaming (streamingContent, messages) goes to the leaf
  // components that actually render it.
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const isLoading = useChatStore((s) => s.isLoading);
  const stopGeneration = useChatStore((s) => s.stopGeneration);

  const { conversations } = useConversations();
  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Auto-send pending prompt when a conversation is selected
  useEffect(() => {
    const prompt = useChatStore.getState().pendingPrompt;
    if (activeConversationId && prompt) {
      useChatStore.setState({ pendingPrompt: null });
      // Small delay for conversation data to be ready
      setTimeout(() => handleSend(prompt), 150);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]);

  const handleSend = async (content: string) => {
    if (!activeConversationId || !content.trim()) return;

    // Read current state without subscribing — avoids stale closures
    const store = useChatStore.getState();
    const conv = conversations.find((c) => c.id === activeConversationId);
    if (!conv) return;

    const providerId = conv.providerId;
    const modelId = conv.modelId;

    if (!providerId || !modelId) {
      const { toast } = await import("sonner");
      toast.error("Please select a provider and model in chat settings");
      return;
    }

    const provider = store.providers.find((p) => p.id === providerId);
    const model = store.models.find((m) => m.id === modelId);

    if (!provider) {
      const { toast } = await import("sonner");
      toast.error("Selected provider not found");
      return;
    }

    // Save user message
    const userMsgRes = await fetch(
      `/api/conversations/${activeConversationId}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "user", content }),
      }
    );

    if (!userMsgRes.ok) return;
    const userMsg = await userMsgRes.json();
    store.addMessage(userMsg);

    // Build messages array for API
    const allMessages: Array<{ role: string; content: string }> = [];
    if (conv.systemPrompt) {
      allMessages.push({ role: "system", content: conv.systemPrompt });
    }
    // Include previous messages from the freshest snapshot
    useChatStore.getState().messages.forEach((m) => {
      if (m.role !== "system") {
        allMessages.push({ role: m.role, content: m.content });
      }
    });
    allMessages.push({ role: "user", content });

    store.setIsLoading(true);
    store.setStreamingContent("");

    const shouldStream = conv.streaming && provider.supportsStreaming;
    const controller = new AbortController();
    store.setAbortController(controller);

    try {
      const res = await fetch("/api/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId,
          providerId,
          modelId: model?.modelId || modelId,
          messages: allMessages,
          temperature: conv.temperature,
          topP: conv.topP,
          maxTokens: conv.maxTokens,
          stream: shouldStream,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Request failed" }));
        const { toast } = await import("sonner");
        toast.error(err.message || "Failed to get response");
        store.setIsLoading(false);
        return;
      }

      if (shouldStream && res.body) {
        store.setIsStreaming(true);
        store.setIsLoading(false);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n");

          for (const line of lines) {
            if (!line.trim() || line.trim() === "data: [DONE]") continue;
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                const delta = data.choices?.[0]?.delta?.content;
                if (delta) {
                  store.appendStreamingContent(delta);
                }
              } catch {
                // Skip invalid chunks
              }
            }
          }
        }

        // Make sure any chunk still queued in the rAF buffer is committed
        // before we swap streamingContent for the final saved message.
        useChatStore.getState().flushStreamingBuffer();
        store.setIsStreaming(false);
        store.setStreamingContent("");

        // Reload messages to get the saved assistant message
        const msgsRes = await fetch(
          `/api/conversations/${activeConversationId}/messages`
        );
        if (msgsRes.ok) {
          const msgs = await msgsRes.json();
          useChatStore.getState().setMessages(msgs);
        }
      } else {
        await res.json();
        store.setIsLoading(false);

        const msgsRes = await fetch(
          `/api/conversations/${activeConversationId}/messages`
        );
        if (msgsRes.ok) {
          const msgs = await msgsRes.json();
          useChatStore.getState().setMessages(msgs);
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        useChatStore.getState().flushStreamingBuffer();
        store.setIsStreaming(false);
        store.setIsLoading(false);
        store.setStreamingContent("");
        return;
      }
      const { toast } = await import("sonner");
      toast.error("Failed to send message");
      store.setIsLoading(false);
      store.setIsStreaming(false);
    }
  };

  if (!activeConversationId) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader conversation={activeConversation} />
      <MessageList
        messages={messages}
        isStreaming={isStreaming}
        streamingContent={streamingContent}
      />
      <ChatInput
        onSend={handleSend}
        isLoading={isLoading || isStreaming}
        onStop={stopGeneration}
      />
    </div>
  );
}
