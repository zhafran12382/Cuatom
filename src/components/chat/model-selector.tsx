"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, Sparkles, Star, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Model, Provider } from "@/types";

interface ModelSelectorProps {
  providers: Provider[];
  models: Model[];
  /** Currently selected providerId on the conversation. */
  value: { providerId: string | null; modelId: string | null };
  onChange: (next: { providerId: string | null; modelId: string | null }) => void;
  /** Compact UI for tight spaces. */
  compact?: boolean;
  className?: string;
}

interface NormalizedItem {
  modelRowId: string;
  providerId: string;
  providerName: string;
  displayName: string;
  modelId: string;
  isFavorite: boolean;
  isFallback: boolean;
}

/**
 * Custom unified provider/model picker.
 *
 * Replaces the two native <select>s in the chat header with a single,
 * searchable, touch-friendly dropdown. Models are grouped by provider,
 * deduplicated by (providerId + modelId), and favorites float to the top
 * within each group.
 */
export function ModelSelector({
  providers,
  models,
  value,
  onChange,
  compact = false,
  className,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus search when opening
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Build a deduplicated list of items keyed on (providerId + modelId)
  const items: NormalizedItem[] = useMemo(() => {
    const byKey = new Map<string, NormalizedItem>();

    for (const m of models) {
      const provider = providers.find((p) => p.id === m.providerId);
      if (!provider) continue;
      const key = `${m.providerId}::${m.modelId}`;
      const existing = byKey.get(key);
      if (!existing || (m.isFavorite && !existing.isFavorite)) {
        byKey.set(key, {
          modelRowId: m.id,
          providerId: m.providerId,
          providerName: provider.name,
          displayName: m.displayName,
          modelId: m.modelId,
          isFavorite: m.isFavorite,
          isFallback: false,
        });
      }
    }

    // For providers with no model rows yet, surface defaultModelId as a fallback.
    for (const p of providers) {
      if (!p.isActive) continue;
      const hasAny = models.some((m) => m.providerId === p.id);
      if (!hasAny && p.defaultModelId) {
        const key = `${p.id}::${p.defaultModelId}`;
        if (!byKey.has(key)) {
          byKey.set(key, {
            modelRowId: `fallback-${p.id}`,
            providerId: p.id,
            providerName: p.name,
            displayName: p.defaultModelId,
            modelId: p.defaultModelId,
            isFavorite: false,
            isFallback: true,
          });
        }
      }
    }

    return Array.from(byKey.values());
  }, [models, providers]);

  // Filter by search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        it.displayName.toLowerCase().includes(q) ||
        it.modelId.toLowerCase().includes(q) ||
        it.providerName.toLowerCase().includes(q)
    );
  }, [items, search]);

  // Group by provider, favorites first within each group
  const grouped = useMemo(() => {
    const groups = new Map<string, { providerId: string; providerName: string; items: NormalizedItem[] }>();
    for (const it of filtered) {
      const g = groups.get(it.providerId);
      if (g) {
        g.items.push(it);
      } else {
        groups.set(it.providerId, {
          providerId: it.providerId,
          providerName: it.providerName,
          items: [it],
        });
      }
    }
    for (const g of groups.values()) {
      g.items.sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        return a.displayName.localeCompare(b.displayName);
      });
    }
    return Array.from(groups.values()).sort((a, b) =>
      a.providerName.localeCompare(b.providerName)
    );
  }, [filtered]);

  // Currently selected display
  const activeItem = useMemo(() => {
    if (!value.modelId) return null;
    return (
      items.find((it) => it.modelRowId === value.modelId) ||
      items.find((it) => it.providerId === value.providerId && it.modelId === value.modelId) ||
      null
    );
  }, [items, value]);

  const activeProvider = useMemo(() => {
    if (!value.providerId) return null;
    return providers.find((p) => p.id === value.providerId) || null;
  }, [providers, value.providerId]);

  const handlePick = (it: NormalizedItem) => {
    onChange({
      providerId: it.providerId,
      // For real model rows we send the row id (existing API expects row id).
      // For fallback entries we send the modelId string so the chat-area
      // resolution path still works.
      modelId: it.isFallback ? it.modelId : it.modelRowId,
    });
    setOpen(false);
    setSearch("");
  };

  const buttonLabel = activeItem
    ? activeItem.displayName
    : activeProvider
      ? `${activeProvider.name} · pick model`
      : "Select model";

  const buttonSub = activeItem ? activeItem.providerName : null;

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "group flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/40 hover:bg-secondary/70 hover:border-primary/40 transition-all duration-150 text-left",
          compact ? "h-8 px-2.5" : "h-9 px-3",
          "min-w-0 max-w-full"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Sparkles
          className={cn(
            "h-3.5 w-3.5 flex-shrink-0",
            activeItem ? "text-primary" : "text-muted-foreground/60"
          )}
        />
        <span className="flex flex-col min-w-0 leading-tight">
          <span
            className={cn(
              "truncate font-medium",
              compact ? "text-[12px]" : "text-[13px]",
              activeItem ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {buttonLabel}
          </span>
          {buttonSub && !compact && (
            <span className="truncate text-[10.5px] text-muted-foreground/70">
              {buttonSub}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 ml-auto flex-shrink-0 text-muted-foreground/60 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 top-full mt-1.5 z-50 w-[min(22rem,92vw)] rounded-2xl border border-border bg-popover shadow-2xl shadow-black/40 animate-scale-in",
            "max-h-[min(70vh,28rem)] flex flex-col"
          )}
          role="listbox"
        >
          {/* Search */}
          <div className="p-2 border-b border-border/60 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search models or providers..."
                className="w-full h-9 pl-8 pr-8 rounded-xl bg-secondary/50 border border-transparent focus:border-primary/30 focus:bg-secondary/80 outline-none text-[13px] transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-accent transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-1.5">
            {grouped.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground/70">
                {items.length === 0 ? (
                  <>
                    <Zap className="h-5 w-5 mx-auto mb-2 opacity-50" />
                    No models yet. Add one in Settings.
                  </>
                ) : (
                  <>No matches for &ldquo;{search}&rdquo;</>
                )}
              </div>
            )}

            {grouped.map((g) => (
              <div key={g.providerId} className="mb-1.5 last:mb-0">
                <div className="flex items-center gap-1.5 px-2.5 pt-2 pb-1">
                  <span className="text-[10.5px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                    {g.providerName}
                  </span>
                  <span className="text-[10px] text-muted-foreground/40">
                    {g.items.length}
                  </span>
                </div>
                {g.items.map((it) => {
                  const isActive =
                    activeItem?.providerId === it.providerId &&
                    activeItem?.modelId === it.modelId;
                  return (
                    <button
                      key={`${it.providerId}::${it.modelId}`}
                      type="button"
                      onClick={() => handlePick(it)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all duration-100 min-h-[40px]",
                        isActive
                          ? "bg-primary/12 text-foreground"
                          : "hover:bg-accent/70 text-foreground/90"
                      )}
                      role="option"
                      aria-selected={isActive}
                    >
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[13px] font-medium truncate">
                            {it.displayName}
                          </span>
                          {it.isFavorite && (
                            <Star className="h-3 w-3 text-amber-400 fill-amber-400 flex-shrink-0" />
                          )}
                          {it.isFallback && (
                            <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium uppercase tracking-wide flex-shrink-0">
                              default
                            </span>
                          )}
                        </span>
                        {it.displayName !== it.modelId && (
                          <span className="block text-[11px] text-muted-foreground/70 truncate mt-0.5">
                            {it.modelId}
                          </span>
                        )}
                      </span>
                      {isActive && (
                        <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer hint */}
          <div className="px-3 py-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground/60 flex-shrink-0">
            <span>{items.length} model{items.length === 1 ? "" : "s"}</span>
            <span className="hidden sm:inline">Esc to close</span>
          </div>
        </div>
      )}
    </div>
  );
}
