"use client";

import { useState } from "react";
import { useModels } from "@/hooks/use-models";
import { useProviders } from "@/hooks/use-providers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus,
  ArrowLeft,
  Star,
  Pencil,
  Trash2,
  Box,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Model } from "@/types";

export default function ModelsPage() {
  const { models, createModel, updateModel, deleteModel } = useModels();
  const { providers } = useProviders();
  const [formOpen, setFormOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Models</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Manage AI models for your providers
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Model
          </Button>
        </div>

        {/* Model list */}
        {models.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[hsl(var(--border))] rounded-lg">
            <Box className="h-10 w-10 mx-auto mb-3 text-[hsl(var(--muted-foreground))]" />
            <p className="text-[hsl(var(--muted-foreground))]">No models yet</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              Add models manually or fetch from a provider
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {models.map((model) => (
              <div
                key={model.id}
                className="flex items-center gap-3 border border-[hsl(var(--border))] rounded-lg p-3 bg-[hsl(var(--card))]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{model.displayName}</span>
                    {model.isFavorite && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-1.5 py-0.5 rounded">
                      {model.modelId}
                    </code>
                    {model.provider && (
                      <Badge variant="outline" className="text-xs">
                        {model.provider.name}
                      </Badge>
                    )}
                    {model.contextWindow && (
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        {(model.contextWindow / 1000).toFixed(0)}k ctx
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => updateModel(model.id, { isFavorite: !model.isFavorite })}
                    title="Toggle favorite"
                  >
                    <Star className={`h-4 w-4 ${model.isFavorite ? "text-amber-400 fill-amber-400" : ""}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingModel(model)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("Delete this model?")) {
                        deleteModel(model.id);
                        toast.success("Model deleted");
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-[hsl(var(--destructive))]" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create dialog */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogHeader>
            <DialogTitle>Add Model</DialogTitle>
          </DialogHeader>
          <ModelForm
            providers={providers}
            onSubmit={async (data) => {
              try {
                await createModel(data);
                setFormOpen(false);
                toast.success("Model created");
              } catch (error) {
                toast.error((error as Error).message);
              }
            }}
            onCancel={() => setFormOpen(false)}
          />
        </Dialog>

        {/* Edit dialog */}
        <Dialog open={!!editingModel} onOpenChange={() => setEditingModel(null)}>
          <DialogHeader>
            <DialogTitle>Edit Model</DialogTitle>
          </DialogHeader>
          {editingModel && (
            <ModelForm
              model={editingModel}
              providers={providers}
              onSubmit={async (data) => {
                try {
                  await updateModel(editingModel.id, data);
                  setEditingModel(null);
                  toast.success("Model updated");
                } catch (error) {
                  toast.error((error as Error).message);
                }
              }}
              onCancel={() => setEditingModel(null)}
            />
          )}
        </Dialog>
      </div>
    </div>
  );
}

function ModelForm({
  model,
  providers,
  onSubmit,
  onCancel,
}: {
  model?: Model | null;
  providers: { id: string; name: string }[];
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    providerId: model?.providerId || "",
    displayName: model?.displayName || "",
    modelId: model?.modelId || "",
    contextWindow: model?.contextWindow?.toString() || "",
    maxOutputTokens: model?.maxOutputTokens?.toString() || "",
    inputPrice: model?.inputPrice?.toString() || "",
    outputPrice: model?.outputPrice?.toString() || "",
    isFavorite: model?.isFavorite ?? false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        providerId: form.providerId,
        displayName: form.displayName,
        modelId: form.modelId,
        contextWindow: form.contextWindow ? parseInt(form.contextWindow) : undefined,
        maxOutputTokens: form.maxOutputTokens ? parseInt(form.maxOutputTokens) : undefined,
        inputPrice: form.inputPrice ? parseFloat(form.inputPrice) : undefined,
        outputPrice: form.outputPrice ? parseFloat(form.outputPrice) : undefined,
        isFavorite: form.isFavorite,
      });
    } catch {
      // handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5">Provider *</label>
        <Select
          value={form.providerId}
          onChange={(e) => setForm({ ...form, providerId: e.target.value })}
          required
        >
          <option value="">Select provider</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Display Name *</label>
        <Input
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          placeholder="Claude Opus via x5LAB"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Model ID *</label>
        <Input
          value={form.modelId}
          onChange={(e) => setForm({ ...form, modelId: e.target.value })}
          placeholder="claude-opus-4-20250514"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1.5">Context Window</label>
          <Input
            type="number"
            value={form.contextWindow}
            onChange={(e) => setForm({ ...form, contextWindow: e.target.value })}
            placeholder="128000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Max Output Tokens</label>
          <Input
            type="number"
            value={form.maxOutputTokens}
            onChange={(e) => setForm({ ...form, maxOutputTokens: e.target.value })}
            placeholder="4096"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1.5">Input Price ($/1M tokens)</label>
          <Input
            type="number"
            step="0.01"
            value={form.inputPrice}
            onChange={(e) => setForm({ ...form, inputPrice: e.target.value })}
            placeholder="2.50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Output Price ($/1M tokens)</label>
          <Input
            type="number"
            step="0.01"
            value={form.outputPrice}
            onChange={(e) => setForm({ ...form, outputPrice: e.target.value })}
            placeholder="10.00"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : model ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
