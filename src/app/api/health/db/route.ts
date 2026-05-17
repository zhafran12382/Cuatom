import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDatabase } from "@/lib/ensure-db";
import { sanitizeError } from "@/lib/sanitize-error";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDatabase();
    const result = await db.$queryRaw<Array<{ ok: number }>>`SELECT 1 as ok`;
    return NextResponse.json({ ok: true, database: "connected", result });
  } catch (error) {
    console.error("GET /api/health/db error:", error);
    return NextResponse.json(
      {
        ok: false,
        database: "error",
        error: sanitizeError(error),
      },
      { status: 500 }
    );
  }
}
