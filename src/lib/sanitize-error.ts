export function sanitizeError(error: unknown): string {
  const raw = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  return raw
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, "postgresql://[REDACTED]")
    .replace(/(DATABASE_URL=)[^\s"']+/gi, "$1[REDACTED]")
    .replace(/(Authorization:\s*Bearer\s+)[^\s"']+/gi, "$1[REDACTED]")
    .replace(/(api[_-]?key["'\s:=]+)[^\s"']+/gi, "$1[REDACTED]");
}
