import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits recommended for AES-GCM
const AUTH_TAG_LENGTH = 16; // 128 bits auth tag

/**
 * Derives a consistent 32-byte key from the environment variable.
 * Accepts a 64-char hex string, base64 string, or arbitrary secret passphrase.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET_KEY;
  if (!secret) {
    throw new Error(
      "CRITICAL SECURITY ERROR: ENCRYPTION_SECRET_KEY is not defined in environment variables."
    );
  }

  // If 64 hex characters (32 bytes)
  if (/^[0-9a-fA-F]{64}$/.test(secret)) {
    return Buffer.from(secret, "hex");
  }

  // If base64 32 bytes (44 chars with padding)
  if (secret.length === 44 && /^[A-Za-z0-9+/=]+$/.test(secret)) {
    const decoded = Buffer.from(secret, "base64");
    if (decoded.length === 32) return decoded;
  }

  // Fallback: derive 32-byte key using SHA-256 hash of the passphrase
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts sensitive tokens (OAuth access/refresh tokens) using AES-256-GCM.
 * Output format: [iv_hex]:[auth_tag_hex]:[encrypted_data_hex]
 */
export function encryptToken(plainText: string): string {
  if (!plainText) {
    throw new Error("Cannot encrypt empty or undefined text");
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted token string.
 * Validates integrity via the GCM authentication tag.
 */
export function decryptToken(cipherPackage: string): string {
  if (!cipherPackage) {
    throw new Error("Cannot decrypt empty cipher package");
  }

  const parts = cipherPackage.split(":");
  if (parts.length !== 3) {
    throw new Error(
      "Invalid cipher package format. Expected format: iv:authTag:cipherText"
    );
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getEncryptionKey();

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length. Expected ${IV_LENGTH} bytes`);
  }
  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error(`Invalid Auth Tag length. Expected ${AUTH_TAG_LENGTH} bytes`);
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
