"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Provider } from "@/types";

interface ProviderFormProps {
  provider?: Provider | null;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export function ProviderForm({ provider, onSubmit, onCancel }: ProviderFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: provider?.name || "",
    baseUrl: provider?.baseUrl || "",
    apiKey: "",
    defaultModelId: provider?.defaultModelId || "",
    customHeaders: provider?.customHeaders || "",
    isActive: provider?.isActive ?? true,
    supportsStreaming: provider?.supportsStreaming ?? true,
    supportsVision: provider?.supportsVision ?? false,
    supportsTools: provider?.supportsTools ?? false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data: Record<string, unknown> = {
        name: form.name,
        baseUrl: form.baseUrl,
        defaultModelId: form.defaultModelId || undefined,
        customHeaders: form.customHeaders || undefined,
        isActive: form.isActive,
        supportsStreaming: form.supportsStreaming,
        supportsVision: form.supportsVision,
        supportsTools: form.supportsTools,
      };
      if (form.apiKey) {
        data.apiKey = form.apiKey;
      }
      await onSubmit(data);
    } catch {
      // handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5">Name *</label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="My OpenAI"
          required
          className="rounded-xl"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Base URL *</label>
        <Input
          value={form.baseUrl}
          onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
          placeholder="https://api.openai.com/v1"
          required
          className="rounded-xl font-mono text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">
          API Key {provider ? "(leave blank to keep existing)" : "*"}
        </label>
        <Input
          type="password"
          value={form.apiKey}
          onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
          placeholder="sk-..."
          required={!provider}
          className="rounded-xl font-mono text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Default Model ID</label>
        <Input
          value={form.defaultModelId}
          onChange={(e) => setForm({ ...form, defaultModelId: e.target.value })}
          placeholder="gpt-4o"
          className="rounded-xl font-mono text-sm"
        />
        <p className="text-[11px] text-muted-foreground/60 mt-1">
          The default model will be auto-added to the model list when this provider is saved.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Custom Headers (JSON)</label>
        <Textarea
          value={form.customHeaders}
          onChange={(e) => setForm({ ...form, customHeaders: e.target.value })}
          placeholder='{"x-custom-header": "value"}'
          rows={3}
          className="rounded-xl resize-none font-mono text-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="rounded border-border h-4 w-4 accent-primary"
          />
          <span className="text-sm">Active</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.supportsStreaming}
            onChange={(e) => setForm({ ...form, supportsStreaming: e.target.checked })}
            className="rounded border-border h-4 w-4 accent-primary"
          />
          <span className="text-sm">Streaming</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.supportsVision}
            onChange={(e) => setForm({ ...form, supportsVision: e.target.checked })}
            className="rounded border-border h-4 w-4 accent-primary"
          />
          <span className="text-sm">Vision</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.supportsTools}
            onChange={(e) => setForm({ ...form, supportsTools: e.target.checked })}
            className="rounded border-border h-4 w-4 accent-primary"
          />
          <span className="text-sm">Tools</span>
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="rounded-xl">
          {loading ? "Saving..." : provider ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
