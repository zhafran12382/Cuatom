import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchProviderModels } from "@/lib/openai-compatible";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const provider = await db.provider.findUnique({ where: { id: params.id } });
    if (!provider) {
      return NextResponse.json({ message: "Provider not found" }, { status: 404 });
    }

    const result = await fetchProviderModels(provider);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
