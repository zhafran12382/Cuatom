"use client";

import { useState, useEffect } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useConversations } from "@/hooks/use-conversations";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { EmptyState } from "./empty-state";
import type { Message } from "@/types";

export function ChatArea() {
  const {
    activeConversationId,
    messages,
    providers,
    models,
    isLoading,
    isStreaming,
    streamingContent,
    setIsLoading,
    setIsStreaming,
    setStreamingContent,
    appendStreamingContent,
    addMessage,
    setAbortController,
    stopGeneration,
  } = useChatStore();

  const { conversations, updateConversation } = useConversations();
  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const handleSend = async (content: string) => {
    if (!activeConversationId || !content.trim()) return;

    const conv = activeConversation;
    if (!conv) return;

    // Determine provider and model
    const providerId = conv.providerId;
    const modelId = conv.modelId;

    if (!providerId || !modelId) {
      const { toast } = await import("sonner");
      toast.error("Please select a provider and model in chat settings");
      return;
    }

    const provider = providers.find((p) => p.id === providerId);
    const model = models.find((m) => m.id === modelId);

    if (!provider) {
      const { toast } = await import("sonner");
      toast.error("Selected provider not found");
      return;
    }

    // Save user message
    const userMsgRes = await fetch(`/api/conversations/${activeConversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "user", content }),
    });

    if (!userMsgRes.ok) return;
    const userMsg = await userMsgRes.json();
    addMessage(userMsg);

    // Build messages array for API
    const allMessages: Array<{ role: string; content: string }> = [];
    if (conv.systemPrompt) {
      allMessages.push({ role: "system", content: conv.systemPrompt });
    }
    // Include previous messages
    messages.forEach((m) => {
      if (m.role !== "system") {
        allMessages.push({ role: m.role, content: m.content });
      }
    });
    allMessages.push({ role: "user", content });

    // Send to completion proxy
    setIsLoading(true);
    setStreamingContent("");

    const shouldStream = conv.streaming && provider.supportsStreaming;
    const controller = new AbortController();
    setAbortController(controller);

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
        setIsLoading(false);
        return;
      }

      if (shouldStream && res.body) {
        setIsStreaming(true);
        setIsLoading(false);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";

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
                  fullContent += delta;
                  appendStreamingContent(delta);
                }
              } catch {
                // Skip invalid chunks
              }
            }
          }
        }

        setIsStreaming(false);
        setStreamingContent("");

        // Reload messages to get the saved assistant message
        const msgsRes = await fetch(`/api/conversations/${activeConversationId}/messages`);
        if (msgsRes.ok) {
          const msgs = await msgsRes.json();
          useChatStore.getState().setMessages(msgs);
        }
      } else {
        // Non-streaming
        const data = await res.json();
        setIsLoading(false);

        // Reload messages
        const msgsRes = await fetch(`/api/conversations/${activeConversationId}/messages`);
        if (msgsRes.ok) {
          const msgs = await msgsRes.json();
          useChatStore.getState().setMessages(msgs);
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        setIsStreaming(false);
        setIsLoading(false);
        setStreamingContent("");
        return;
      }
      const { toast } = await import("sonner");
      toast.error("Failed to send message");
      setIsLoading(false);
      setIsStreaming(false);
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
