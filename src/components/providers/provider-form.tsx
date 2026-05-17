"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PROVIDER_TEMPLATES } from "@/types";
import type { Provider } from "@/types";

interface ProviderFormProps {
  provider?: Provider | null;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export function ProviderForm({ provider, onSubmit, onCancel }: ProviderFormProps) {
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState("");
  const [form, setForm] = useState({
    name: provider?.name || "",
    apiKey: "",
    baseUrl: provider?.baseUrl || "",
    chatEndpoint: provider?.chatEndpoint || "",
    endpointMode: provider?.endpointMode || "BASE_URL",
    modelsEndpoint: provider?.modelsEndpoint || "",
    defaultModelId: provider?.defaultModelId || "",
    supportsStreaming: provider?.supportsStreaming ?? true,
    supportsVision: provider?.supportsVision ?? false,
    supportsTools: provider?.supportsTools ?? false,
    isActive: provider?.isActive ?? true,
  });

  const applyTemplate = (key: string) => {
    const t = PROVIDER_TEMPLATES[key];
    if (!t) return;
    setTemplate(key);
    setForm((prev) => ({
      ...prev,
      name: t.name,
      baseUrl: t.baseUrl,
      chatEndpoint: t.chatEndpoint || "",
      endpointMode: t.endpointMode,
      modelsEndpoint: t.modelsEndpoint || "",
      supportsStreaming: t.supportsStreaming,
      supportsVision: t.supportsVision,
      supportsTools: t.supportsTools,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data: Record<string, unknown> = {
        name: form.name,
        baseUrl: form.baseUrl,
        endpointMode: form.endpointMode,
        supportsStreaming: form.supportsStreaming,
        supportsVision: form.supportsVision,
        supportsTools: form.supportsTools,
        isActive: form.isActive,
      };
      if (form.apiKey) data.apiKey = form.apiKey;
      if (form.chatEndpoint) data.chatEndpoint = form.chatEndpoint;
      if (form.modelsEndpoint) data.modelsEndpoint = form.modelsEndpoint;
      if (form.defaultModelId) data.defaultModelId = form.defaultModelId;

      // For create, apiKey is required
      if (!provider && !form.apiKey) {
        throw new Error("API key is required");
      }

      await onSubmit(data);
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Template selector (only for new providers) */}
      {!provider && (
        <div>
          <label className="block text-sm font-medium mb-1.5">Template</label>
          <Select
            value={template}
            onChange={(e) => applyTemplate(e.target.value)}
          >
            <option value="">Select a template...</option>
            <option value="openai">OpenAI</option>
            <option value="openrouter">OpenRouter</option>
            <option value="x5lab">x5LAB</option>
            <option value="groq">Groq</option>
            <option value="deepseek">DeepSeek</option>
            <option value="mistral">Mistral</option>
            <option value="xai">xAI</option>
            <option value="together">Together.ai</option>
            <option value="fireworks">Fireworks</option>
            <option value="custom">Custom OpenAI-Compatible</option>
          </Select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5">Provider Name *</label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. x5LAB"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">
          API Key {provider ? "(leave empty to keep current)" : "*"}
        </label>
        <Input
          type="password"
          value={form.apiKey}
          onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
          placeholder={provider ? "••••••••" : "sk-..."}
          required={!provider}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Base URL *</label>
        <Input
          value={form.baseUrl}
          onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
          placeholder="https://api.x5lab.dev/v1"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Endpoint Mode</label>
        <Select
          value={form.endpointMode}
          onChange={(e) => setForm({ ...form, endpointMode: e.target.value })}
        >
          <option value="BASE_URL">Base URL (auto-append /chat/completions)</option>
          <option value="FULL_ENDPOINT">Full Endpoint (use exact URL)</option>
        </Select>
      </div>

      {form.endpointMode === "FULL_ENDPOINT" && (
        <div>
          <label className="block text-sm font-medium mb-1.5">Chat Completions Endpoint</label>
          <Input
            value={form.chatEndpoint}
            onChange={(e) => setForm({ ...form, chatEndpoint: e.target.value })}
            placeholder="https://api.x5lab.dev/v1/chat/completions"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5">Models Endpoint (optional)</label>
        <Input
          value={form.modelsEndpoint}
          onChange={(e) => setForm({ ...form, modelsEndpoint: e.target.value })}
          placeholder="https://api.x5lab.dev/v1/models"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Default Model ID (optional)</label>
        <Input
          value={form.defaultModelId}
          onChange={(e) => setForm({ ...form, defaultModelId: e.target.value })}
          placeholder="gpt-4o, claude-3-opus, etc."
        />
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-2 gap-3">
        <ToggleField
          label="Streaming"
          checked={form.supportsStreaming}
          onChange={(v) => setForm({ ...form, supportsStreaming: v })}
        />
        <ToggleField
          label="Vision"
          checked={form.supportsVision}
          onChange={(v) => setForm({ ...form, supportsVision: v })}
        />
        <ToggleField
          label="Tools"
          checked={form.supportsTools}
          onChange={(v) => setForm({ ...form, supportsTools: v })}
        />
        <ToggleField
          label="Active"
          checked={form.isActive}
          onChange={(v) => setForm({ ...form, isActive: v })}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : provider ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between px-3 py-2 rounded-md border text-sm ${
        checked
          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
          : "border-[hsl(var(--input))] text-[hsl(var(--muted-foreground))]"
      }`}
    >
      <span>{label}</span>
      <span>{checked ? "✓" : "✗"}</span>
    </button>
  );
}
