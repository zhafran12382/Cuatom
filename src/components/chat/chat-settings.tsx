"use client";

import { useConversations } from "@/hooks/use-conversations";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Conversation } from "@/types";

interface ChatSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation?: Conversation | null;
}

export function ChatSettings({ open, onOpenChange, conversation }: ChatSettingsProps) {
  const { updateConversation } = useConversations();

  if (!conversation) return null;

  const update = (data: Partial<Conversation>) => {
    updateConversation(conversation.id, data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Chat Settings</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Title</label>
          <Input
            value={conversation.title}
            onChange={(e) => update({ title: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">System Prompt</label>
          <Textarea
            value={conversation.systemPrompt || ""}
            onChange={(e) => update({ systemPrompt: e.target.value || null })}
            placeholder="You are a helpful assistant..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Temperature</label>
            <Input
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={conversation.temperature}
              onChange={(e) => update({ temperature: parseFloat(e.target.value) || 0.7 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Top P</label>
            <Input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={conversation.topP}
              onChange={(e) => update({ topP: parseFloat(e.target.value) || 1.0 })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Max Tokens</label>
            <Input
              type="number"
              min={1}
              max={200000}
              value={conversation.maxTokens}
              onChange={(e) => update({ maxTokens: parseInt(e.target.value) || 4096 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Streaming</label>
            <button
              onClick={() => update({ streaming: !conversation.streaming })}
              className={`w-full h-9 rounded-md border text-sm ${
                conversation.streaming
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "border-input bg-transparent"
              }`}
            >
              {conversation.streaming ? "On" : "Off"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Presence Penalty</label>
            <Input
              type="number"
              min={-2}
              max={2}
              step={0.1}
              value={conversation.presencePenalty}
              onChange={(e) => update({ presencePenalty: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Frequency Penalty</label>
            <Input
              type="number"
              min={-2}
              max={2}
              step={0.1}
              value={conversation.frequencyPenalty}
              onChange={(e) => update({ frequencyPenalty: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
