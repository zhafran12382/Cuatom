import { db } from "@/lib/db";

let initialized = false;
let initializing: Promise<void> | null = null;

const statements = [
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,
  `CREATE TABLE IF NOT EXISTS "Provider" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "apiKeyEncrypted" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "chatEndpoint" TEXT,
    "endpointMode" TEXT NOT NULL DEFAULT 'BASE_URL',
    "modelsEndpoint" TEXT,
    "defaultModelId" TEXT,
    "customHeaders" TEXT,
    "supportsStreaming" BOOLEAN NOT NULL DEFAULT true,
    "supportsVision" BOOLEAN NOT NULL DEFAULT false,
    "supportsTools" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "Model" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "providerId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "contextWindow" INTEGER,
    "maxOutputTokens" INTEGER,
    "inputPrice" DOUBLE PRECISION,
    "outputPrice" DOUBLE PRECISION,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Model_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL DEFAULT 'New Chat',
    "providerId" TEXT,
    "modelId" TEXT,
    "systemPrompt" TEXT,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "topP" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "maxTokens" INTEGER NOT NULL DEFAULT 4096,
    "presencePenalty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "frequencyPenalty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "streaming" BOOLEAN NOT NULL DEFAULT true,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Conversation_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Conversation_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "providerName" TEXT,
    "modelId" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "cost" DOUBLE PRECISION,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "UserSettings" (
    "id" TEXT PRIMARY KEY DEFAULT 'default',
    "defaultProviderId" TEXT,
    "defaultModelId" TEXT,
    "defaultSystemPrompt" TEXT,
    "defaultTemperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "defaultTopP" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "defaultMaxTokens" INTEGER NOT NULL DEFAULT 4096,
    "defaultStreaming" BOOLEAN NOT NULL DEFAULT true,
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "Model_providerId_idx" ON "Model"("providerId")`,
  `CREATE INDEX IF NOT EXISTS "Conversation_providerId_idx" ON "Conversation"("providerId")`,
  `CREATE INDEX IF NOT EXISTS "Conversation_modelId_idx" ON "Conversation"("modelId")`,
  `CREATE INDEX IF NOT EXISTS "Message_conversationId_idx" ON "Message"("conversationId")`,
];

async function runEnsureDatabase() {
  for (const statement of statements) {
    await db.$executeRawUnsafe(statement);
  }
}

export async function ensureDatabase() {
  if (initialized) return;
  if (!initializing) {
    initializing = runEnsureDatabase()
      .then(() => {
        initialized = true;
      })
      .finally(() => {
        initializing = null;
      });
  }
  await initializing;
}
