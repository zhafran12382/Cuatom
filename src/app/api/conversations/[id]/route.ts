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

    const conversation = await db.conversation.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return NextResponse.json(conversation);
  } catch (error) {
    return NextResponse.json({ message: "Failed to update conversation" }, { status: 500 });
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
