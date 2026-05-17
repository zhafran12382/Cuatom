import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDatabase } from "@/lib/ensure-db";
import { testProviderConnection } from "@/lib/openai-compatible";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDatabase();
    const provider = await db.provider.findUnique({ where: { id: params.id } });
    if (!provider) {
      return NextResponse.json({ message: "Provider not found" }, { status: 404 });
    }

    const model = provider.defaultModelId || "gpt-3.5-turbo";
    const result = await testProviderConnection(provider, model);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Test failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}
