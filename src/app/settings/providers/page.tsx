"use client";

import { useState } from "react";
import { useProviders } from "@/hooks/use-providers";
import { useModels } from "@/hooks/use-models";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProviderForm } from "@/components/providers/provider-form";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus,
  ArrowLeft,
  Zap,
  Pencil,
  Trash2,
  TestTube,
  Download,
  CheckCircle,
  XCircle,
  Loader2,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Provider } from "@/types";

export default function ProvidersPage() {
  const { providers, createProvider, updateProvider, deleteProvider, testProvider, fetchModelsFromProvider } = useProviders();
  const { createModel } = useModels();
  const [formOpen, setFormOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { loading: boolean; result?: { success: boolean; message: string } }>>({});

  const handleCreate = async (data: Record<string, unknown>) => {
    try {
      await createProvider(data);
      setFormOpen(false);
      toast.success("Provider created");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleUpdate = async (data: Record<string, unknown>) => {
    if (!editingProvider) return;
    try {
      await updateProvider(editingProvider.id, data);
      setEditingProvider(null);
      toast.success("Provider updated");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this provider? This will also remove associated models.")) return;
    try {
      await deleteProvider(id);
      toast.success("Provider deleted");
    } catch {
      toast.error("Failed to delete provider");
    }
  };

  const handleTest = async (id: string) => {
    setTestResults((prev) => ({ ...prev, [id]: { loading: true } }));
    try {
      const result = await testProvider(id);
      setTestResults((prev) => ({ ...prev, [id]: { loading: false, result } }));
      if (result.success) {
        toast.success("Connection successful");
      } else {
        toast.error(result.message);
      }
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [id]: { loading: false, result: { success: false, message: "Test failed" } },
      }));
    }
  };

  const handleFetchModels = async (provider: Provider) => {
    try {
      const result = await fetchModelsFromProvider(provider.id);
      if (result.success && result.models) {
        let added = 0;
        for (const m of result.models) {
          try {
            await createModel({
              providerId: provider.id,
              displayName: m.name || m.id,
              modelId: m.id,
            });
            added++;
          } catch {
            // Skip duplicates
          }
        }
        toast.success(`Fetched ${added} models from ${provider.name}`);
      } else {
        toast.error(result.error || "Failed to fetch models");
      }
    } catch {
      toast.error("Failed to fetch models");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg min-h-[40px] min-w-[40px]">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">Providers</h1>
            <p className="text-sm text-muted-foreground">
              Manage your AI provider connections
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gap-2 rounded-xl h-10">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Provider</span>
          </Button>
        </div>

        {/* Provider cards */}
        {providers.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Zap className="h-7 w-7 text-primary/50" />
            </div>
            <p className="text-muted-foreground text-sm">No providers yet</p>
            <Button onClick={() => setFormOpen(true)} variant="outline" className="mt-4 gap-2 rounded-xl">
              <Plus className="h-4 w-4" />
              Add your first provider
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map((provider) => {
              const test = testResults[provider.id];
              return (
                <div
                  key={provider.id}
                  className="rounded-2xl border border-border bg-card p-4 md:p-5 hover:border-primary/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-sm">{provider.name}</h3>
                        <Badge
                          variant={provider.isActive ? "default" : "secondary"}
                          className="text-[10px] h-5"
                        >
                          {provider.isActive ? (
                            <span className="flex items-center gap-1">
                              <Activity className="h-2.5 w-2.5" />
                              Active
                            </span>
                          ) : (
                            "Inactive"
                          )}
                        </Badge>
                        {provider.supportsStreaming && (
                          <Badge variant="outline" className="text-[10px] h-5">Streaming</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate mb-0.5">
                        {provider.baseUrl}
                      </p>
                      <p className="text-xs text-muted-foreground/60 font-mono">
                        {provider.apiKeyMasked}
                      </p>
                    </div>
                  </div>

                  {/* Test result */}
                  {test?.result && (
                    <div className={`mt-3 flex items-center gap-2 text-sm px-3 py-2 rounded-xl ${
                      test.result.success
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}>
                      {test.result.success ? <CheckCircle className="h-4 w-4 flex-shrink-0" /> : <XCircle className="h-4 w-4 flex-shrink-0" />}
                      <span className="text-xs">{test.result.message}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border/60">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(provider.id)}
                      disabled={test?.loading}
                      className="gap-1.5 rounded-lg h-8 text-xs"
                    >
                      {test?.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TestTube className="h-3.5 w-3.5" />}
                      Test
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFetchModels(provider)}
                      className="gap-1.5 rounded-lg h-8 text-xs"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Fetch
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProvider(provider)}
                      className="gap-1.5 rounded-lg h-8 text-xs"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(provider.id)}
                      className="gap-1.5 rounded-lg h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create dialog */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogHeader>
            <DialogTitle>Add Provider</DialogTitle>
          </DialogHeader>
          <ProviderForm onSubmit={handleCreate} onCancel={() => setFormOpen(false)} />
        </Dialog>

        {/* Edit dialog */}
        <Dialog open={!!editingProvider} onOpenChange={() => setEditingProvider(null)}>
          <DialogHeader>
            <DialogTitle>Edit Provider</DialogTitle>
          </DialogHeader>
          {editingProvider && (
            <ProviderForm
              provider={editingProvider}
              onSubmit={handleUpdate}
              onCancel={() => setEditingProvider(null)}
            />
          )}
        </Dialog>
      </div>
    </div>
  );
}
