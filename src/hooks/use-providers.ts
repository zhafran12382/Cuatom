import { useCallback, useEffect } from "react";
import { useChatStore } from "@/stores/chat-store";

let providersLoaded = false;
let providersFetchPromise: Promise<void> | null = null;

export function useProviders() {
  const providers = useChatStore((s) => s.providers);
  const setProviders = useChatStore((s) => s.setProviders);

  const fetchProviders = useCallback(
    async (force = false) => {
      if (!force && providersLoaded) return;
      if (!force && providersFetchPromise) return providersFetchPromise;

      const run = (async () => {
        try {
          const res = await fetch("/api/providers", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            setProviders(data);
            providersLoaded = true;
          }
        } catch (error) {
          console.error("Failed to fetch providers:", error);
        }
      })();

      if (!force) {
        providersFetchPromise = run.finally(() => {
          providersFetchPromise = null;
        });
        return providersFetchPromise;
      }

      return run;
    },
    [setProviders]
  );

  useEffect(() => {
    fetchProviders().catch(() => {});
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
    await fetchProviders(true);
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
    await fetchProviders(true);
    return res.json();
  };

  const deleteProvider = async (id: string) => {
    const res = await fetch(`/api/providers/${id}`, {
      method: "DELETE",
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to delete provider");
    await fetchProviders(true);
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
