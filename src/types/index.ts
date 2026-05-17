export interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  chatEndpoint: string | null;
  endpointMode: string;
  modelsEndpoint: string | null;
  defaultModelId: string | null;
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsTools: boolean;
  customHeaders: string | null;
  isActive: boolean;
  apiKeyMasked: string;
  createdAt: string;
  updatedAt: string;
}

export interface Model {
  id: string;
  providerId: string;
  displayName: string;
  modelId: string;
  contextWindow: number | null;
  maxOutputTokens: number | null;
  inputPrice: number | null;
  outputPrice: number | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  provider?: Provider;
}

export interface Conversation {
  id: string;
  title: string;
  providerId: string | null;
  modelId: string | null;
  systemPrompt: string | null;
  temperature: number;
  topP: number;
  maxTokens: number;
  presencePenalty: number;
  frequencyPenalty: number;
  streaming: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  provider?: Provider | null;
  model?: Model | null;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  providerName: string | null;
  modelId: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  cost: number | null;
  error: string | null;
  createdAt: string;
}

export interface UserSettings {
  id: string;
  defaultProviderId: string | null;
  defaultModelId: string | null;
  defaultSystemPrompt: string | null;
  defaultTemperature: number;
  defaultTopP: number;
  defaultMaxTokens: number;
  defaultStreaming: boolean;
  theme: string;
}

export interface ProviderTemplate {
  name: string;
  baseUrl: string;
  chatEndpoint?: string;
  endpointMode: "BASE_URL" | "FULL_ENDPOINT";
  modelsEndpoint?: string;
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsTools: boolean;
}

export const PROVIDER_TEMPLATES: Record<string, ProviderTemplate> = {
  openai: {
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    endpointMode: "BASE_URL",
    modelsEndpoint: "https://api.openai.com/v1/models",
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: true,
  },
  openrouter: {
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    endpointMode: "BASE_URL",
    modelsEndpoint: "https://openrouter.ai/api/v1/models",
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: true,
  },
  x5lab: {
    name: "x5LAB",
    baseUrl: "https://api.x5lab.dev/v1",
    chatEndpoint: "https://api.x5lab.dev/v1/chat/completions",
    endpointMode: "BASE_URL",
    modelsEndpoint: "https://api.x5lab.dev/v1/models",
    supportsStreaming: true,
    supportsVision: false,
    supportsTools: false,
  },
  groq: {
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    endpointMode: "BASE_URL",
    modelsEndpoint: "https://api.groq.com/openai/v1/models",
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: true,
  },
  deepseek: {
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    endpointMode: "BASE_URL",
    modelsEndpoint: "https://api.deepseek.com/v1/models",
    supportsStreaming: true,
    supportsVision: false,
    supportsTools: true,
  },
  mistral: {
    name: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    endpointMode: "BASE_URL",
    modelsEndpoint: "https://api.mistral.ai/v1/models",
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: true,
  },
  xai: {
    name: "xAI",
    baseUrl: "https://api.x.ai/v1",
    endpointMode: "BASE_URL",
    modelsEndpoint: "https://api.x.ai/v1/models",
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: true,
  },
  together: {
    name: "Together.ai",
    baseUrl: "https://api.together.xyz/v1",
    endpointMode: "BASE_URL",
    modelsEndpoint: "https://api.together.xyz/v1/models",
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: true,
  },
  fireworks: {
    name: "Fireworks",
    baseUrl: "https://api.fireworks.ai/inference/v1",
    endpointMode: "BASE_URL",
    modelsEndpoint: "https://api.fireworks.ai/inference/v1/models",
    supportsStreaming: true,
    supportsVision: true,
    supportsTools: true,
  },
  custom: {
    name: "Custom OpenAI-Compatible",
    baseUrl: "",
    endpointMode: "BASE_URL",
    supportsStreaming: true,
    supportsVision: false,
    supportsTools: false,
  },
};
