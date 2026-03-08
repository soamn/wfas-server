import crypto from "crypto";
import config from "../config/config.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const ENCRYPTION_KEY = config.ENCRYPTION_KEY;

const getEncryptionKeyBuffer = (): Buffer => {
  if (ENCRYPTION_KEY.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be exactly 32 characters long.");
  }
  return Buffer.from(ENCRYPTION_KEY, "utf8");
};

export const encrypt = (text: string): string => {
  if (!text) return text;

  const iv = crypto.randomBytes(IV_LENGTH);
  const keyBuffer = getEncryptionKeyBuffer();
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
};

export const decrypt = (combined: string): string => {
  if (!combined) return combined;
  if (typeof combined !== "string") return "";
  const parts = combined.split(":");
  if (parts.length !== 3) return combined;
  try {
    const [ivHex, authTagHex, encryptedText] = parts;
    if (!ivHex || !authTagHex || !encryptedText) return combined;

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const keyBuffer = getEncryptionKeyBuffer();

    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error(
      "Decryption failed. Data might be plain-text or encrypted with a different key.",
    );
    return combined;
  }
};
