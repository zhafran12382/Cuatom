import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDatabase } from "@/lib/ensure-db";

export async function GET() {
  try {
    await ensureDatabase();
    let settings = await db.userSettings.findUnique({ where: { id: "default" } });
    if (!settings) {
      settings = await db.userSettings.create({
        data: { id: "default" },
      });
    }
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureDatabase();
    const body = await req.json();
    const settings = await db.userSettings.upsert({
      where: { id: "default" },
      update: body,
      create: { id: "default", ...body },
    });
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ message: "Failed to update settings" }, { status: 500 });
  }
}
