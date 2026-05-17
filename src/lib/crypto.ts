import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY environment variable is required");
  const buf = Buffer.from(key, "base64");
  if (buf.length !== 32) {
    // If not 32 bytes base64, try using it as utf8 and hash it
    const { createHash } = require("crypto");
    return createHash("sha256").update(key).digest();
  }
  return buf;
}

export function encrypt(text: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const tag = cipher.getAuthTag();
  
  // Format: iv:tag:encrypted (all hex)
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const key = getKey();
  const parts = encryptedText.split(":");
  
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted text format");
  }
  
  const iv = Buffer.from(parts[0], "hex");
  const tag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];
  
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  const start = key.slice(0, 6);
  const end = key.slice(-4);
  return `${start}••••${end}`;
}
