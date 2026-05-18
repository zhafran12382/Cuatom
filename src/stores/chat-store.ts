import { create } from "zustand";
import type { Conversation, Message, Provider, Model } from "@/types";

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  providers: Provider[];
  models: Model[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  sidebarOpen: boolean;
  abortController: AbortController | null;
  pendingPrompt: string | null;

  setConversations: (conversations: Conversation[]) => void;
  setActiveConversation: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setProviders: (providers: Provider[]) => void;
  setModels: (models: Model[]) => void;
  setIsLoading: (loading: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (chunk: string) => void;
  flushStreamingBuffer: () => void;
  setSidebarOpen: (open: boolean) => void;
  setAbortController: (controller: AbortController | null) => void;
  stopGeneration: () => void;
}

// Streaming chunks arrive far faster than React can paint (50–100/sec on a fast
// model). We batch them into a single setState per animation frame so the
// chat doesn't re-render hundreds of times per second on mobile.
let pendingStreamBuffer = "";
let rafScheduled: number | null = null;

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  providers: [],
  models: [],
  isLoading: false,
  isStreaming: false,
  streamingContent: "",
  sidebarOpen: false,
  abortController: null,
  pendingPrompt: null,

  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (id) => set({ activeConversationId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),
  setProviders: (providers) => set({ providers }),
  setModels: (models) => set({ models }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setStreamingContent: (streamingContent) => {
    pendingStreamBuffer = "";
    if (rafScheduled !== null) {
      cancelAnimationFrame(rafScheduled);
      rafScheduled = null;
    }
    set({ streamingContent });
  },
  appendStreamingContent: (chunk) => {
    pendingStreamBuffer += chunk;
    if (rafScheduled !== null) return;
    rafScheduled = requestAnimationFrame(() => {
      rafScheduled = null;
      const buffered = pendingStreamBuffer;
      pendingStreamBuffer = "";
      set((state) => ({ streamingContent: state.streamingContent + buffered }));
    });
  },
  flushStreamingBuffer: () => {
    if (rafScheduled !== null) {
      cancelAnimationFrame(rafScheduled);
      rafScheduled = null;
    }
    if (pendingStreamBuffer) {
      const buffered = pendingStreamBuffer;
      pendingStreamBuffer = "";
      set((state) => ({ streamingContent: state.streamingContent + buffered }));
    }
  },
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setAbortController: (abortController) => set({ abortController }),
  stopGeneration: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({ abortController: null, isStreaming: false, isLoading: false });
    }
  },
}));
