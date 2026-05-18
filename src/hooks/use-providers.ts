import { useCallback, useEffect } from "react";
import { useChatStore } from "@/stores/chat-store";

export function useProviders() {
  const providers = useChatStore((s) => s.providers);
  const setProviders = useChatStore((s) => s.setProviders);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch("/api/providers", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setProviders(data);
      }
    } catch (error) {
      console.error("Failed to fetch providers:", error);
    }
  }, [setProviders]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const createProvider = async (data: Record<string, unknown>) => {
    const res = await fetch("/api/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to create provider");
    }
    await fetchProviders();
    return res.json();
  };

  const updateProvider = async (id: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/providers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      cache: "no-store",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to update provider");
    }
    await fetchProviders();
    return res.json();
  };

  const deleteProvider = async (id: string) => {
    const res = await fetch(`/api/providers/${id}`, {
      method: "DELETE",
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to delete provider");
    await fetchProviders();
  };

  const testProvider = async (id: string) => {
    const res = await fetch(`/api/providers/${id}/test`, {
      method: "POST",
      cache: "no-store",
    });
    return res.json();
  };

  const fetchModelsFromProvider = async (id: string) => {
    const res = await fetch(`/api/providers/${id}/fetch-models`, {
      method: "POST",
      cache: "no-store",
    });
    return res.json();
  };

  return {
    providers,
    fetchProviders,
    createProvider,
    updateProvider,
    deleteProvider,
    testProvider,
    fetchModelsFromProvider,
  };
}
