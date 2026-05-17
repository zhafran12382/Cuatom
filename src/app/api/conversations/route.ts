import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { conversationSchema } from "@/lib/validators";

export async function GET() {
  try {
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = conversationSchema.safeParse(body);

    const data = parsed.success ? parsed.data : {};

    const conversation = await db.conversation.create({
      data: {
        title: data.title || "New Chat",
        providerId: data.providerId || null,
        modelId: data.modelId || null,
        systemPrompt: data.systemPrompt || null,
        temperature: data.temperature ?? 0.7,
        topP: data.topP ?? 1.0,
        maxTokens: data.maxTokens ?? 4096,
        presencePenalty: data.presencePenalty ?? 0,
        frequencyPenalty: data.frequencyPenalty ?? 0,
        streaming: data.streaming ?? true,
        isPinned: data.isPinned ?? false,
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to create conversation" }, { status: 500 });
  }
}
