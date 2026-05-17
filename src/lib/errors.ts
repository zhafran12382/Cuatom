export interface NormalizedError {
  code: string;
  message: string;
  details?: string;
  status?: number;
}

export function normalizeProviderError(error: unknown, status?: number): NormalizedError {
  if (status === 401 || status === 403) {
    return {
      code: "AUTH_ERROR",
      message: "API key invalid or unauthorized",
      details: extractMessage(error),
      status,
    };
  }
  
  if (status === 404) {
    return {
      code: "NOT_FOUND",
      message: "Endpoint or model not found",
      details: extractMessage(error),
      status,
    };
  }
  
  if (status === 429) {
    return {
      code: "RATE_LIMITED",
      message: "Rate limited — please wait before retrying",
      details: extractMessage(error),
      status,
    };
  }
  
  if (status && status >= 500) {
    return {
      code: "PROVIDER_ERROR",
      message: "Provider server error",
      details: extractMessage(error),
      status,
    };
  }
  
  if (error instanceof TypeError && (error as Error).message?.includes("fetch")) {
    return {
      code: "NETWORK_ERROR",
      message: "Endpoint unreachable — check the URL",
      details: (error as Error).message,
    };
  }
  
  if (error instanceof SyntaxError) {
    return {
      code: "INVALID_RESPONSE",
      message: "Provider response is not OpenAI-compatible",
      details: (error as Error).message,
    };
  }
  
  return {
    code: "UNKNOWN_ERROR",
    message: "An unexpected error occurred",
    details: extractMessage(error),
  };
}

function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;
    if (obj.error && typeof obj.error === "object") {
      return (obj.error as Record<string, unknown>).message as string || JSON.stringify(obj.error);
    }
    if (obj.message) return obj.message as string;
    return JSON.stringify(error);
  }
  return "Unknown error";
}
