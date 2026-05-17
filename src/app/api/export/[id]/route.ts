import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const format = req.nextUrl.searchParams.get("format") || "json";

  try {
    const conversation = await db.conversation.findUnique({
      where: { id: params.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!conversation) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    if (format === "markdown") {
      let md = `# ${conversation.title}\n\n`;
      md += `*Exported at ${new Date().toISOString()}*\n\n---\n\n`;
      for (const msg of conversation.messages) {
        const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
        md += `### ${role}\n\n${msg.content}\n\n---\n\n`;
      }
      return new Response(md, {
        headers: {
          "Content-Type": "text/markdown",
          "Content-Disposition": `attachment; filename="${conversation.title}.md"`,
        },
      });
    }

    return NextResponse.json({
      title: conversation.title,
      exportedAt: new Date().toISOString(),
      settings: {
        temperature: conversation.temperature,
        topP: conversation.topP,
        maxTokens: conversation.maxTokens,
        systemPrompt: conversation.systemPrompt,
      },
      messages: conversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
        tokens: m.totalTokens,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    return NextResponse.json({ message: "Export failed" }, { status: 500 });
  }
}
