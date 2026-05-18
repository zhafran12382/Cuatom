import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDatabase } from "@/lib/ensure-db";
import { conversationSchema } from "@/lib/validators";

export async function GET() {
  try {
    await ensureDatabase();
    const conversations = await db.conversation.findMany({
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      include: {
        provider: { select: { id: true, name: true } },
        model: { select: { id: true, displayName: true, modelId: true } },
      },
    });
    return NextResponse.json(conversations);
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch conversations" }, { status: 500 });
  }
}

/**
 * Pick a sensible default provider + model for a new conversation so the
 * user lands directly in a chat-ready state instead of staring at
 * "Setup needed". Resolution order:
 *   1. UserSettings.default{Provider,Model}Id (if both are still valid)
 *   2. First active provider + its preferred model
 *      (favorited model first, then any model, then defaultModelId fallback)
 */
async function resolveDefaultProviderAndModel(): Promise<{
  providerId: string | null;
  modelId: string | null;
}> {
  // 1. user-set defaults
  try {
    const settings = await db.userSettings.findUnique({ where: { id: "default" } });
    if (settings?.defaultProviderId && settings?.defaultModelId) {
      const [p, m] = await Promise.all([
        db.provider.findUnique({ where: { id: settings.defaultProviderId } }),
        db.model.findUnique({ where: { id: settings.defaultModelId } }),
      ]);
      if (p?.isActive && m && m.providerId === p.id) {
        return { providerId: p.id, modelId: m.id };
      }
    }
  } catch {
    // fall through to discovery
  }

  // 2. first active provider + its best model
  try {
    const provider = await db.provider.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
    if (!provider) return { providerId: null, modelId: null };

    const model = await db.model.findFirst({
      where: { providerId: provider.id },
      orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
    });
    if (model) return { providerId: provider.id, modelId: model.id };

    // No model rows yet, but provider has a default modelId — auto-create the row.
    if (provider.defaultModelId) {
      const created = await db.model.create({
        data: {
          providerId: provider.id,
          displayName: provider.defaultModelId,
          modelId: provider.defaultModelId,
        },
      });
      return { providerId: provider.id, modelId: created.id };
    }

    return { providerId: provider.id, modelId: null };
  } catch {
    return { providerId: null, modelId: null };
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabase();
    const body = await req.json().catch(() => ({}));
    const parsed = conversationSchema.safeParse(body);

    const data = parsed.success ? parsed.data : {};

    // Auto-resolve provider/model defaults so a brand-new chat is immediately
    // usable without forcing the user through Settings first.
    let providerId = data.providerId ?? null;
    let modelId = data.modelId ?? null;
    if (!providerId || !modelId) {
      const defaults = await resolveDefaultProviderAndModel();
      providerId = providerId || defaults.providerId;
      modelId = modelId || defaults.modelId;
    }

    // Pull default system prompt + sampling params from user settings if the
    // caller didn't override them. Keeps single source of truth.
    let defaults: {
      defaultSystemPrompt?: string | null;
      defaultTemperature?: number;
      defaultTopP?: number;
      defaultMaxTokens?: number;
      defaultStreaming?: boolean;
    } = {};
    try {
      const settings = await db.userSettings.findUnique({ where: { id: "default" } });
      if (settings) defaults = settings;
    } catch {
      // ignore — we'll fall back to literal defaults below
    }

    const conversation = await db.conversation.create({
      data: {
        title: data.title || "New Chat",
        providerId,
        modelId,
        systemPrompt: data.systemPrompt ?? defaults.defaultSystemPrompt ?? null,
        temperature: data.temperature ?? defaults.defaultTemperature ?? 0.7,
        topP: data.topP ?? defaults.defaultTopP ?? 1.0,
        maxTokens: data.maxTokens ?? defaults.defaultMaxTokens ?? 4096,
        presencePenalty: data.presencePenalty ?? 0,
        frequencyPenalty: data.frequencyPenalty ?? 0,
        streaming: data.streaming ?? defaults.defaultStreaming ?? true,
        isPinned: data.isPinned ?? false,
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error("POST /api/conversations error:", error);
    return NextResponse.json({ message: "Failed to create conversation" }, { status: 500 });
  }
}
