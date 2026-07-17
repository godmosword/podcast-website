import { createHash, randomBytes } from "node:crypto";

/** 只把 hash 存進 DB；原始 token 只存在確認信的短暫 URL。 */
export function createSubscribeToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashSubscribeToken(token) };
}

export function hashSubscribeToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
