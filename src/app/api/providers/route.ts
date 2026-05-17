import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDatabase } from "@/lib/ensure-db";
import { encrypt, maskApiKey, decrypt } from "@/lib/crypto";
import { providerSchema } from "@/lib/validators";

export async function GET() {
  try {
    await ensureDatabase();
    const providers = await db.provider.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Mask API keys before sending to client
    const masked = providers.map((p) => ({
      ...p,
      apiKeyEncrypted: undefined,
      apiKeyMasked: maskApiKey(decrypt(p.apiKeyEncrypted)),
    }));

    return NextResponse.json(masked);
  } catch (error) {
    console.error("GET /api/providers error:", error);
    return NextResponse.json({ message: "Failed to fetch providers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDatabase();
    const body = await req.json();
    const parsed = providerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation error", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { apiKey, customHeaders, ...rest } = parsed.data;

    const provider = await db.provider.create({
      data: {
        ...rest,
        apiKeyEncrypted: encrypt(apiKey),
        customHeaders: customHeaders ? JSON.stringify(customHeaders) : null,
      },
    });

    // Auto-create a model entry if defaultModelId is provided
    if (provider.defaultModelId) {
      try {
        await db.model.create({
          data: {
            providerId: provider.id,
            displayName: provider.defaultModelId,
            modelId: provider.defaultModelId,
          },
        });
      } catch {
        // Ignore if model already exists or creation fails
      }
    }

    return NextResponse.json({
      ...provider,
      apiKeyEncrypted: undefined,
      apiKeyMasked: maskApiKey(apiKey),
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/providers error:", error);
    return NextResponse.json({ message: "Failed to create provider" }, { status: 500 });
  }
}
