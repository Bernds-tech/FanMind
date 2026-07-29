import { createCipheriv, createHmac, randomBytes } from "node:crypto";

export class MobilePushTokenCryptoError extends Error {
  constructor(code) {
    super(code);
    this.name = "MobilePushTokenCryptoError";
    this.code = code;
  }
}
function encryptionKey() {
  const raw = process.env.FANMIND_PUSH_TOKEN_ENCRYPTION_KEY?.trim() ?? "";
  if (!raw) {
    throw new MobilePushTokenCryptoError("push_encryption_not_configured");
  }
  const decoded = Buffer.from(
    raw,
    raw.length === 64 && /^[a-f0-9]+$/i.test(raw) ? "hex" : "base64",
  );
  if (decoded.length !== 32) {
    throw new MobilePushTokenCryptoError("push_encryption_not_configured");
  }
  return decoded;
}

export function hashMobilePushToken(token) {
  return createHmac("sha256", encryptionKey())
    .update("fanmind-mobile-push-token-v1\0")
    .update(token)
    .digest("hex");
}

export function encryptMobilePushToken(token) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
}
