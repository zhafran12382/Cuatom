import { useCallback, useEffect } from "react";
import { useChatStore } from "@/stores/chat-store";

let modelsLoaded = false;
let modelsFetchPromise: Promise<void> | null = null;

export function useModels() {
  const models = useChatStore((s) => s.models);
  const setModels = useChatStore((s) => s.setModels);

  const fetchModels = useCallback(
    async (force = false) => {
      if (!force && modelsLoaded) return;
      if (!force && modelsFetchPromise) return modelsFetchPromise;

      const run = (async () => {
        try {
          const res = await fetch("/api/models", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            setModels(data);
            modelsLoaded = true;
          }
        } catch (error) {
          console.error("Failed to fetch models:", error);
        }
      })();

      if (!force) {
        modelsFetchPromise = run.finally(() => {
          modelsFetchPromise = null;
        });
        return modelsFetchPromise;
      }

      return run;
    },
    [setModels]
  );

  useEffect(() => {
    fetchModels().catch(() => {});
  }, [fetchModels]);

  const createModel = async (data: Record<string, unknown>) => {
    const res = await fetch("/api/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to create model");
    }
    await fetchModels(true);
    return res.json();
  };

  const updateModel = async (id: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/models/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to update model");
    }
    await fetchModels(true);
    return res.json();
  };

  const deleteModel = async (id: string) => {
    const res = await fetch(`/api/models/${id}`, {
      method: "DELETE",
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to delete model");
    await fetchModels(true);
  };

  return { models, fetchModels, createModel, updateModel, deleteModel };
}
