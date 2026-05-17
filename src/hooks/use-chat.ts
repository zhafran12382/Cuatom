"use client";

import { useCallback } from "react";
import { useChatStore } from "@/stores/chat-store";

export function useChat() {
  const {
    activeConversationId,
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    setIsLoading,
    setIsStreaming,
    setStreamingContent,
    appendStreamingContent,
    addMessage,
    setMessages,
    setAbortController,
    stopGeneration,
  } = useChatStore();

  const sendMessage = useCallback(
    async (
      content: string,
      opts: {
        providerId: string;
        modelId: string;
        conversationId: string;
        systemPrompt?: string | null;
        temperature?: number;
        topP?: number;
        maxTokens?: number;
        stream?: boolean;
      }
    ) => {
      // Save user message to DB
      const userMsgRes = await fetch(
        `/api/conversations/${opts.conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "user", content }),
        }
      );

      if (!userMsgRes.ok) throw new Error("Failed to save message");
      const userMsg = await userMsgRes.json();
      addMessage(userMsg);

      // Build messages array
      const allMessages: Array<{ role: string; content: string }> = [];
      if (opts.systemPrompt) {
        allMessages.push({ role: "system", content: opts.systemPrompt });
      }
      messages.forEach((m) => {
        if (m.role !== "system") {
          allMessages.push({ role: m.role, content: m.content });
        }
      });
      allMessages.push({ role: "user", content });

      // Send to proxy
      setIsLoading(true);
      setStreamingContent("");

      const controller = new AbortController();
      setAbortController(controller);

      const res = await fetch("/api/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: opts.conversationId,
          providerId: opts.providerId,
          modelId: opts.modelId,
          messages: allMessages,
          temperature: opts.temperature,
          topP: opts.topP,
          maxTokens: opts.maxTokens,
          stream: opts.stream ?? true,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        setIsLoading(false);
        const err = await res.json().catch(() => ({ message: "Request failed" }));
        throw new Error(err.message);
      }

      if (opts.stream !== false && res.body) {
        setIsStreaming(true);
        setIsLoading(false);

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
                if (delta) appendStreamingContent(delta);
              } catch {
                // skip
              }
            }
          }
        }

        setIsStreaming(false);
        setStreamingContent("");
      } else {
        setIsLoading(false);
      }

      // Reload messages from DB
      const msgsRes = await fetch(`/api/conversations/${opts.conversationId}/messages`);
      if (msgsRes.ok) {
        const msgs = await msgsRes.json();
        setMessages(msgs);
      }
    },
    [messages, addMessage, setIsLoading, setIsStreaming, setStreamingContent, appendStreamingContent, setMessages, setAbortController]
  );

  return {
    sendMessage,
    isLoading,
    isStreaming,
    streamingContent,
    stopGeneration,
  };
}
