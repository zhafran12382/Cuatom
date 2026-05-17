import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDatabase } from "@/lib/ensure-db";
import { encrypt, decrypt, maskApiKey } from "@/lib/crypto";
import { providerUpdateSchema } from "@/lib/validators";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDatabase();
    const provider = await db.provider.findUnique({ where: { id: params.id } });
    if (!provider) {
      return NextResponse.json({ message: "Provider not found" }, { status: 404 });
    }
    return NextResponse.json({
      ...provider,
      apiKeyEncrypted: undefined,
      apiKeyMasked: maskApiKey(decrypt(provider.apiKeyEncrypted)),
    });
  } catch (error) {
    return NextResponse.json({ message: "Failed to fetch provider" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDatabase();
    const body = await req.json();
    const parsed = providerUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation error", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { apiKey, customHeaders, ...rest } = parsed.data;
    const updateData: Record<string, unknown> = { ...rest };

    if (apiKey) {
      updateData.apiKeyEncrypted = encrypt(apiKey);
    }
    if (customHeaders !== undefined) {
      updateData.customHeaders = customHeaders ? JSON.stringify(customHeaders) : null;
    }

    const provider = await db.provider.update({
      where: { id: params.id },
      data: updateData,
    });

    // Auto-create a model entry if defaultModelId is updated and no model exists
    if (provider.defaultModelId) {
      try {
        const existingModel = await db.model.findFirst({
          where: { providerId: provider.id, modelId: provider.defaultModelId },
        });
        if (!existingModel) {
          await db.model.create({
            data: {
              providerId: provider.id,
              displayName: provider.defaultModelId,
              modelId: provider.defaultModelId,
            },
          });
        }
      } catch {
        // Ignore errors
      }
    }

    return NextResponse.json({
      ...provider,
      apiKeyEncrypted: undefined,
      apiKeyMasked: maskApiKey(decrypt(provider.apiKeyEncrypted)),
    });
  } catch (error) {
    return NextResponse.json({ message: "Failed to update provider" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureDatabase();
    await db.provider.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Provider deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Failed to delete provider" }, { status: 500 });
  }
}
