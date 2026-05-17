import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { modelSchema } from "@/lib/validators";

export async function GET() {
  try {
    const models = await db.model.findMany({
      include: { provider: { select: { id: true, name: true } } },
      orderBy: [{ isFavorite: "desc" }, { displayName: "asc" }],
    });
    return NextResponse.json(models);
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch models" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = modelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation error", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const model = await db.model.create({ data: parsed.data });
    return NextResponse.json(model, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to create model" }, { status: 500 });
  }
}
