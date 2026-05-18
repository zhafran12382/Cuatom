import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDatabase } from "@/lib/ensure-db";
import { modelSchema } from "@/lib/validators";

export async function GET() {
  try {
    await ensureDatabase();
    const models = await db.model.findMany({
      include: { provider: { select: { id: true, name: true } } },
      orderBy: [{ isFavorite: "desc" }, { displayName: "asc" }],
    });

    // Deduplicate by (providerId + modelId). When the same logical model
    // exists more than once (e.g. auto-created on provider POST plus a
    // subsequent fetch-models sync), keep the favorited one if any, otherwise
    // the most recently updated. This stops the model dropdown from showing
    // duplicate entries to users.
    const seen = new Map<string, (typeof models)[number]>();
    for (const m of models) {
      const key = `${m.providerId}::${m.modelId}`;
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, m);
        continue;
      }
      const preferNew =
        (m.isFavorite && !existing.isFavorite) ||
        (m.isFavorite === existing.isFavorite &&
          new Date(m.updatedAt).getTime() > new Date(existing.updatedAt).getTime());
      if (preferNew) seen.set(key, m);
    }

    return NextResponse.json(Array.from(seen.values()));
  } catch (error) {
    console.error("GET /api/models error:", error);
    return NextResponse.json({ message: "Failed to fetch models" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabase();
    const body = await req.json();
    const parsed = modelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation error", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Avoid creating an exact duplicate (same provider + same modelId).
    const existing = await db.model.findFirst({
      where: {
        providerId: parsed.data.providerId,
        modelId: parsed.data.modelId,
      },
    });
    if (existing) {
      // Update display name / metadata in place so the call still feels
      // idempotent without producing a second row.
      const updated = await db.model.update({
        where: { id: existing.id },
        data: parsed.data,
      });
      return NextResponse.json(updated, { status: 200 });
    }

    const model = await db.model.create({ data: parsed.data });
    return NextResponse.json(model, { status: 201 });
  } catch (error) {
    console.error("POST /api/models error:", error);
    return NextResponse.json({ message: "Failed to create model" }, { status: 500 });
  }
}
