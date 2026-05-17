import { decrypt } from "./crypto";
import { normalizeProviderError, NormalizedError } from "./errors";

interface ProviderConfig {
  apiKeyEncrypted: string;
  baseUrl: string;
  chatEndpoint: string | null;
  endpointMode: string;
  customHeaders: string | null;
}

interface ChatRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
}

export function buildEndpointUrl(provider: ProviderConfig): string {
  if (provider.endpointMode === "FULL_ENDPOINT" && provider.chatEndpoint) {
    return provider.chatEndpoint;
  }
  // BASE_URL mode: append /chat/completions
  const base = provider.baseUrl.replace(/\/$/, "");
  return `${base}/chat/completions`;
}

export function buildHeaders(provider: ProviderConfig): Record<string, string> {
  const apiKey = decrypt(provider.apiKeyEncrypted);
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
  };
  
  // Add custom headers if any
  if (provider.customHeaders) {
    try {
      const custom = JSON.parse(provider.customHeaders);
      Object.entries(custom).forEach(([key, value]) => {
        // Only allow safe headers
        const safeKey = key.toLowerCase();
        if (!safeKey.startsWith("x-") && safeKey !== "authorization" && safeKey !== "content-type") {
          return;
        }
        if (safeKey === "authorization" || safeKey === "content-type") return;
        headers[key] = value as string;
      });
    } catch {
      // Ignore invalid JSON
    }
  }
  
  return headers;
}

export async function sendChatCompletion(
  provider: ProviderConfig,
  request: ChatRequest
): Promise<Response> {
  const url = buildEndpointUrl(provider);
  const headers = buildHeaders(provider);
  const timeout = parseInt(process.env.DEFAULT_REQUEST_TIMEOUT_MS || "90000", 10);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as Error).name === "AbortError") {
      throw new Error("Request timed out — endpoint unreachable or too slow");
    }
    throw error;
  }
}

export async function testProviderConnection(
  provider: ProviderConfig,
  model: string
): Promise<{ success: boolean; message: string; details?: string }> {
  try {
    const response = await sendChatCompletion(provider, {
      model,
      messages: [{ role: "user", content: "Reply with OK only." }],
      max_tokens: 10,
      stream: false,
    });
    
    if (!response.ok) {
      const body = await response.text();
      let parsed: unknown;
      try { parsed = JSON.parse(body); } catch { parsed = body; }
      const err = normalizeProviderError(parsed, response.status);
      return { success: false, message: err.message, details: err.details };
    }
    
    const data = await response.json();
    if (data.choices && data.choices[0]?.message?.content) {
      return { success: true, message: "Connection successful" };
    }
    
    return { success: false, message: "Unexpected response format", details: JSON.stringify(data).slice(0, 500) };
  } catch (error) {
    const err = normalizeProviderError(error);
    return { success: false, message: err.message, details: err.details };
  }
}

export async function fetchProviderModels(
  provider: ProviderConfig & { modelsEndpoint: string | null; baseUrl: string }
): Promise<{ success: boolean; models?: Array<{ id: string; name?: string }>; error?: string }> {
  const url = provider.modelsEndpoint || `${provider.baseUrl.replace(/\/$/, "")}/models`;
  const apiKey = decrypt(provider.apiKeyEncrypted);
  
  try {
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      const err = normalizeProviderError(null, response.status);
      return { success: false, error: err.message };
    }
    
    const data = await response.json();
    const models = (data.data || data.models || []).map((m: { id: string; name?: string }) => ({
      id: m.id,
      name: m.name || m.id,
    }));
    
    return { success: true, models };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
