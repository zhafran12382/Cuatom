"use client";

import { useConversations } from "@/hooks/use-conversations";
import { useChatStore } from "@/stores/chat-store";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Globe, Zap } from "lucide-react";
import type { Conversation } from "@/types";

interface ChatSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation?: Conversation | null;
}

const PRESETS = {
  creative: { temperature: 1.0, topP: 0.95, presencePenalty: 0.3, frequencyPenalty: 0.3 },
  balanced: { temperature: 0.7, topP: 1.0, presencePenalty: 0, frequencyPenalty: 0 },
  precise: { temperature: 0.2, topP: 0.9, presencePenalty: 0, frequencyPenalty: 0.5 },
};

const TOKEN_PRESETS = [4096, 8192, 16384, 32768, 128000];

export function ChatSettings({ open, onOpenChange, conversation }: ChatSettingsProps) {
  const { updateConversation } = useConversations();
  const { providers, models } = useChatStore();

  if (!conversation) return null;

  const update = (data: Partial<Conversation>) => {
    updateConversation(conversation.id, data);
  };

  const applyPreset = (key: keyof typeof PRESETS) => {
    const p = PRESETS[key];
    update({
      temperature: p.temperature,
      topP: p.topP,
      presencePenalty: p.presencePenalty,
      frequencyPenalty: p.frequencyPenalty,
    });
  };

  const resetDefaults = () => {
    update({
      title: "New Chat",
      systemPrompt: null,
      temperature: 0.7,
      topP: 1.0,
      maxTokens: 4096,
      streaming: true,
      presencePenalty: 0,
      frequencyPenalty: 0,
    });
  };

  const activeModels = models.filter(
    (m) => !conversation?.providerId || m.providerId === conversation.providerId
  );

  const fallbackModels =
    activeModels.length === 0 && conversation?.providerId
      ? (() => {
          const provider = providers.find((p) => p.id === conversation.providerId);
          if (provider?.defaultModelId) {
            return [
              {
                id: `fallback-${provider.id}`,
                providerId: provider.id,
                displayName: provider.defaultModelId,
                modelId: provider.defaultModelId,
                contextWindow: null,
                maxOutputTokens: null,
                inputPrice: null,
                outputPrice: null,
                isFavorite: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ];
          }
          return [];
        })()
      : [];

  const modelOptions = activeModels.length > 0 ? activeModels : fallbackModels;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Chat Settings</DialogTitle>
      </DialogHeader>

      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {/* Provider & Model — always visible */}
        <div className="space-y-3 pb-4 border-b border-border/60">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Provider & Model
          </h3>

          <div>
            <label className="block text-sm font-medium mb-1.5">Provider</label>
            <Select
              value={conversation.providerId || ""}
              onChange={(e) => {
                update({ providerId: e.target.value || null, modelId: null });
              }}
              className="rounded-xl"
            >
              <option value="">Select provider...</option>
              {providers.filter((p) => p.isActive).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              Model
            </label>
            <Select
              value={conversation.modelId || ""}
              onChange={(e) => {
                update({ modelId: e.target.value || null });
              }}
              className="rounded-xl"
            >
              <option value="">Select model...</option>
              {modelOptions.map((m) => (
                <option key={m.id} value={m.id}>{m.displayName}</option>
              ))}
              {modelOptions.length === 0 && (
                <option value="" disabled>No models available</option>
              )}
            </Select>
          </div>
        </div>

        {/* Presets */}
        <div>
          <label className="block text-sm font-medium mb-2">Presets</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((key) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className="px-3 py-2 rounded-xl border border-border/60 text-sm capitalize hover:bg-primary/5 hover:border-primary/30 transition-colors min-h-[44px]"
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Title</label>
          <Input
            value={conversation.title}
            onChange={(e) => update({ title: e.target.value })}
            className="rounded-xl"
          />
        </div>

        {/* System Prompt */}
        <div>
          <label className="block text-sm font-medium mb-1.5">System Prompt</label>
          <Textarea
            value={conversation.systemPrompt || ""}
            onChange={(e) => update({ systemPrompt: e.target.value || null })}
            placeholder="You are a helpful assistant..."
            rows={3}
            className="rounded-xl resize-none"
          />
        </div>

        {/* Temperature */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium">Temperature</label>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              {conversation.temperature.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={conversation.temperature}
            onChange={(e) => update({ temperature: parseFloat(e.target.value) })}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-muted accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground/50 mt-1">
            <span>Precise</span>
            <span>Balanced</span>
            <span>Creative</span>
          </div>
        </div>

        {/* Top P */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium">Top P</label>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              {conversation.topP.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={conversation.topP}
            onChange={(e) => update({ topP: parseFloat(e.target.value) })}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-muted accent-primary"
          />
        </div>

        {/* Max Tokens */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium">Max Tokens</label>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              {conversation.maxTokens.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={200000}
            step={1}
            value={conversation.maxTokens}
            onChange={(e) => update({ maxTokens: parseInt(e.target.value) })}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-muted accent-primary"
          />
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {TOKEN_PRESETS.map((val) => (
              <button
                key={val}
                onClick={() => update({ maxTokens: val })}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-colors min-h-[32px] ${
                  conversation.maxTokens === val
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-muted text-muted-foreground border border-transparent hover:border-border"
                }`}
              >
                {val >= 1000 ? `${val / 1000}K` : val}
              </button>
            ))}
          </div>
        </div>

        {/* Penalties — stacked on mobile */}
        <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium">Presence</label>
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                {conversation.presencePenalty.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={-2}
              max={2}
              step={0.1}
              value={conversation.presencePenalty}
              onChange={(e) => update({ presencePenalty: parseFloat(e.target.value) })}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-muted accent-primary"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium">Frequency</label>
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                {conversation.frequencyPenalty.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={-2}
              max={2}
              step={0.1}
              value={conversation.frequencyPenalty}
              onChange={(e) => update({ frequencyPenalty: parseFloat(e.target.value) })}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-muted accent-primary"
            />
          </div>
        </div>

        {/* Streaming toggle */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Streaming</label>
          <button
            onClick={() => update({ streaming: !conversation.streaming })}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
              conversation.streaming ? "bg-primary" : "bg-muted"
            }`}
            aria-label={conversation.streaming ? "Disable streaming" : "Enable streaming"}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                conversation.streaming ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>

        {/* Reset */}
        <div className="pt-2 border-t border-border/60">
          <button
            onClick={resetDefaults}
            className="text-sm text-destructive hover:text-destructive/80 transition-colors min-h-[44px]"
          >
            Reset to defaults
          </button>
        </div>
      </div>
    </Dialog>
  );
}