import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { modelSchema } from "@/lib/validators";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const parsed = modelSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation error", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const model = await db.model.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json(model);
  } catch (error) {
    return NextResponse.json({ message: "Failed to update model" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.model.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Model deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Failed to delete model" }, { status: 500 });
  }
}
