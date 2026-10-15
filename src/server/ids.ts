import "server-only";
import { createHash, randomBytes } from "node:crypto";

// Sortable-ish unique id: time prefix + randomness.
export function newId() {
  return Date.now().toString(36).padStart(9, "0") + randomBytes(8).toString("hex");
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
