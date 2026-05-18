"use client";

import { useCallback, useEffect } from "react";
import { useChatStore } from "@/stores/chat-store";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { EmptyState } from "./empty-state";
import type { Conversation, Message } from "@/types";

function tempId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function makeMessage(
  overrides: Partial<Message> & Pick<Message, "conversationId" | "role" | "content">
): Message {
  return {
    id: tempId(overrides.role),
    providerName: null,
    modelId: null,
    promptTokens: null,
    completionTokens: null,
    totalTokens: null,
    cost: null,
    error: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

async function reconcileMessages(conversationId: string) {
  const res = await fetch(`/api/conversations/${conversationId}/messages`, {
    cache: "no-store",
  });
  if (!res.ok) return;
  const msgs = await res.json();
  useChatStore.getState().setMessages(msgs);
}

function buildPromptMessages(conv: Conversation, existingMessages: Message[], content: string) {
  const allMessages: Array<{ role: Message["role"]; content: string }> = [];

  if (conv.systemPrompt) {
    allMessages.push({ role: "system", content: conv.systemPrompt });
  }

  for (const msg of existingMessages) {
    if (msg.role !== "system" && msg.content) {
      allMessages.push({ role: msg.role, content: msg.content });
    }
  }

  allMessages.push({ role: "user", content });
  return allMessages;
}

function ChatComposer({ onSend }: { onSend: (content: string) => void }) {
  // Composer only re-renders when the button state changes, not every streamed
  // chunk. This is why taps/typing stay responsive on low-end mobile CPUs.
  const isLoading = useChatStore((s) => s.isLoading);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const stopGeneration = useChatStore((s) => s.stopGeneration);

  return (
    <ChatInput
      onSend={onSend}
      isLoading={isLoading || isStreaming}
      onStop={stopGeneration}
    />
  );
}

export function ChatArea() {
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const activeConversation = useChatStore((s) =>
    s.activeConversationId
      ? s.conversations.find((c) => c.id === s.activeConversationId)
      : undefined
  );

  const handleSend = useCallback(async (rawContent: string) => {
    const content = rawContent.trim();
    if (!content) return;

    const store = useChatStore.getState();
    const conversationId = store.activeConversationId;
    if (!conversationId) return;

    const conv = store.conversations.find((c) => c.id === conversationId);
    if (!conv) return;

    const providerId = conv.providerId;
    const modelRowId = conv.modelId;

    if (!providerId || !modelRowId) {
      const { toast } = await import("sonner");
      toast.error("Please select a provider and model first");
      return;
    }

    const provider = store.providers.find((p) => p.id === providerId) || conv.provider;
    const model = store.models.find((m) => m.id === modelRowId) || conv.model;

    if (!provider) {
      const { toast } = await import("sonner");
      toast.error("Selected provider not found");
      return;
    }

    const existingMessages = store.messages;
    const optimisticUser = makeMessage({
      conversationId,
      role: "user",
      content,
    });

    // Instant visual feedback: no more waiting for /messages POST before the
    // user's bubble appears. The completion endpoint persists this same user
    // message server-side while the model request is already in flight.
    store.addMessage(optimisticUser);
    store.setIsLoading(true);
    store.setIsStreaming(false);
    store.setStreamingContent("");

    const shouldStream = conv.streaming && provider.supportsStreaming;
    const controller = new AbortController();
    store.setAbortController(controller);

    try {
      const res = await fetch("/api/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          providerId,
          modelId: model?.modelId || modelRowId,
          messages: buildPromptMessages(conv, existingMessages, content),
          saveUserMessage: true,
          userMessage: content,
          temperature: conv.temperature,
          topP: conv.topP,
          maxTokens: conv.maxTokens,
          stream: shouldStream,
        }),
        signal: controller.signal,
        cache: "no-store",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Request failed" }));
        const message = err.message || "Failed to get response";
        store.setIsLoading(false);
        store.setIsStreaming(false);
        store.addMessage(
          makeMessage({
            conversationId,
            role: "assistant",
            content: "",
            providerName: provider.name,
            modelId: model?.modelId || modelRowId,
            error: message,
          })
        );
        const { toast } = await import("sonner");
        toast.error(message);
        reconcileMessages(conversationId).catch(() => {});
        return;
      }

      if (shouldStream && res.body) {
        store.setIsStreaming(true);
        store.setIsLoading(false);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let sseBuffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split("\n");
          sseBuffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === "data: [DONE]") continue;
            if (!trimmed.startsWith("data: ")) continue;

            try {
              const data = JSON.parse(trimmed.slice(6));
              const delta = data.choices?.[0]?.delta?.content;
              if (delta) store.appendStreamingContent(delta);
            } catch {
              // Ignore provider keep-alive / malformed partial chunks.
            }
          }
        }

        store.flushStreamingBuffer();
        const finalContent = useChatStore.getState().streamingContent;
        store.setIsStreaming(false);
        store.setIsLoading(false);
        store.setStreamingContent("");
        store.setAbortController(null);

        // Keep the completed answer on screen immediately instead of showing a
        // blank gap while we refetch the canonical DB rows.
        if (finalContent) {
          store.addMessage(
            makeMessage({
              conversationId,
              role: "assistant",
              content: finalContent,
              providerName: provider.name,
              modelId: model?.modelId || modelRowId,
            })
          );
        }

        reconcileMessages(conversationId).catch(() => {});
        return;
      }

      const data = await res.json();
      store.setIsLoading(false);
      store.setIsStreaming(false);
      store.setAbortController(null);

      if (data.content) {
        store.addMessage(
          makeMessage({
            conversationId,
            role: "assistant",
            content: data.content,
            providerName: provider.name,
            modelId: model?.modelId || modelRowId,
            promptTokens: data.usage?.prompt_tokens || null,
            completionTokens: data.usage?.completion_tokens || null,
            totalTokens: data.usage?.total_tokens || null,
          })
        );
      }

      reconcileMessages(conversationId).catch(() => {});
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        useChatStore.getState().flushStreamingBuffer();
        store.setIsStreaming(false);
        store.setIsLoading(false);
        store.setStreamingContent("");
        store.setAbortController(null);
        return;
      }

      const message = "Failed to send message";
      store.setIsLoading(false);
      store.setIsStreaming(false);
      store.setAbortController(null);
      store.addMessage(
        makeMessage({
          conversationId,
          role: "assistant",
          content: "",
          providerName: provider.name,
          modelId: model?.modelId || modelRowId,
          error: message,
        })
      );
      const { toast } = await import("sonner");
      toast.error(message);
    }
  }, []);

  // Auto-send pending prompt when a conversation is selected. The send handler
  // reads fresh store state, so the effect doesn't subscribe to messages.
  useEffect(() => {
    const prompt = useChatStore.getState().pendingPrompt;
    if (activeConversationId && prompt) {
      useChatStore.setState({ pendingPrompt: null });
      window.setTimeout(() => handleSend(prompt), 0);
    }
  }, [activeConversationId, handleSend]);

  if (!activeConversationId) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader conversation={activeConversation} />
      <MessageList />
      <ChatComposer onSend={handleSend} />
    </div>
  );
}
