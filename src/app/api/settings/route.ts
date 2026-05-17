import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
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
