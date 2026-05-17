import { z } from "zod";

export const providerSchema = z.object({
  name: z.string().min(1, "Provider name is required").max(100),
  apiKey: z.string().min(1, "API key is required"),
  baseUrl: z.string().url("Must be a valid URL"),
  chatEndpoint: z.string().optional(),
  endpointMode: z.enum(["BASE_URL", "FULL_ENDPOINT"]).default("BASE_URL"),
  modelsEndpoint: z.string().optional(),
  defaultModelId: z.string().optional(),
  supportsStreaming: z.boolean().default(true),
  supportsVision: z.boolean().default(false),
  supportsTools: z.boolean().default(false),
  customHeaders: z.record(z.string()).optional(),
  isActive: z.boolean().default(true),
});

export const providerUpdateSchema = providerSchema.partial().omit({ apiKey: true }).extend({
  apiKey: z.string().optional(),
});

export const modelSchema = z.object({
  providerId: z.string().uuid(),
  displayName: z.string().min(1, "Display name is required").max(200),
  modelId: z.string().min(1, "Model ID is required"),
  contextWindow: z.number().int().positive().optional(),
  maxOutputTokens: z.number().int().positive().optional(),
  inputPrice: z.number().min(0).optional(),
  outputPrice: z.number().min(0).optional(),
  isFavorite: z.boolean().default(false),
});

export const conversationSchema = z.object({
  title: z.string().max(200).optional(),
  providerId: z.string().optional().nullable(),
  modelId: z.string().optional().nullable(),
  systemPrompt: z.string().max(100000).optional().nullable(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  maxTokens: z.number().int().min(1).max(200000).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  streaming: z.boolean().optional(),
  isPinned: z.boolean().optional(),
});

export const chatCompletionSchema = z.object({
  conversationId: z.string().uuid(),
  providerId: z.string().uuid(),
  modelId: z.string(),
  messages: z.array(z.object({
    role: z.enum(["system", "user", "assistant", "tool"]),
    content: z.string(),
  })).min(1),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  maxTokens: z.number().int().min(1).max(200000).optional(),
  stream: z.boolean().optional(),
});
