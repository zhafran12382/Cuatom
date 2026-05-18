import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDatabase } from "@/lib/ensure-db";
import { conversationSchema } from "@/lib/validators";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDatabase();
    const conversation = await db.conversation.findUnique({
      where: { id: params.id },
      include: {
        provider: { select: { id: true, name: true } },
        model: { select: { id: true, displayName: true, modelId: true } },
      },
    });
    if (!conversation) {
      return NextResponse.json({ message: "Conversation not found" }, { status: 404 });
    }
    return NextResponse.json(conversation);
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch conversation" }, { status: 500 });
  }
}

/**
 * Resolve a modelId from the client into a valid Model row id.
 *
 * The chat header sends one of:
 *   - a real Model.id (UUID) — passes through
 *   - a provider's defaultModelId string when no Model row exists yet
 *     (e.g. "claude-sonnet-4-20250514"). For this case we create the Model
 *     row on demand and return its id, so the FK on Conversation.modelId
 *     stays valid.
 *   - null — pass through (clears the selection)
 */
async function resolveModelId(
  modelIdInput: string | null | undefined,
  providerIdInput: string | null | undefined
): Promise<string | null | undefined> {
  if (modelIdInput === undefined) return undefined;
  if (modelIdInput === null) return null;
  if (!modelIdInput) return null;

  // Already a valid Model row?
  const existing = await db.model.findUnique({ where: { id: modelIdInput } });
  if (existing) return existing.id;

  // Not a row id — treat as a raw modelId string. Need a provider to attach to.
  if (!providerIdInput) {
    throw new Error(
      `Model "${modelIdInput}" is not a known model row and no providerId was supplied to auto-create it.`
    );
  }

  const provider = await db.provider.findUnique({ where: { id: providerIdInput } });
  if (!provider) {
    throw new Error(`Provider ${providerIdInput} not found.`);
  }

  // Look for a row matching this raw modelId under that provider before creating
  const matched = await db.model.findFirst({
    where: { providerId: provider.id, modelId: modelIdInput },
  });
  if (matched) return matched.id;

  const created = await db.model.create({
    data: {
      providerId: provider.id,
      displayName: modelIdInput,
      modelId: modelIdInput,
    },
  });
  return created.id;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDatabase();
    const body = await req.json();
    const parsed = conversationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation error", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = { ...parsed.data };

    // Coerce modelId: the picker might send a raw modelId string (fallback
    // entry) instead of a Model row id. Auto-create a Model row in that case
    // so the FK on Conversation stays valid and the picker selection sticks.
    if ("modelId" in data) {
      try {
        data.modelId = await resolveModelId(data.modelId, data.providerId);
      } catch (err) {
        return NextResponse.json(
          { message: (err as Error).message || "Could not resolve model" },
          { status: 400 }
        );
      }
    }

    const conversation = await db.conversation.update({
      where: { id: params.id },
      data,
      include: {
        provider: { select: { id: true, name: true } },
        model: { select: { id: true, displayName: true, modelId: true } },
      },
    });
    return NextResponse.json(conversation);
  } catch (error) {
    console.error("PATCH /api/conversations/[id] error:", error);
    return NextResponse.json(
      { message: "Failed to update conversation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDatabase();
    await db.conversation.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Conversation deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Failed to delete conversation" }, { status: 500 });
  }
}
