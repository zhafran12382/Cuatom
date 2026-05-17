import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant", "tool"]),
  content: z.string().min(1),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messages = await db.message.findMany({
      where: { conversationId: params.id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const parsed = messageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid message" }, { status: 400 });
    }

    const message = await db.message.create({
      data: {
        conversationId: params.id,
        role: parsed.data.role,
        content: parsed.data.content,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to save message" }, { status: 500 });
  }
}
