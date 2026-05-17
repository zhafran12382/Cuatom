import { useCallback, useEffect } from "react";
import { useChatStore } from "@/stores/chat-store";

export function useModels() {
  const { models, setModels } = useChatStore();

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch("/api/models");
      if (res.ok) {
        const data = await res.json();
        setModels(data);
      }
    } catch (error) {
      console.error("Failed to fetch models:", error);
    }
  }, [setModels]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const createModel = async (data: Record<string, unknown>) => {
    const res = await fetch("/api/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to create model");
    }
    await fetchModels();
    return res.json();
  };

  const updateModel = async (id: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/models/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to update model");
    }
    await fetchModels();
    return res.json();
  };

  const deleteModel = async (id: string) => {
    const res = await fetch(`/api/models/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete model");
    await fetchModels();
  };

  return { models, fetchModels, createModel, updateModel, deleteModel };
}
