/**
 * JWT session utilities — sign and verify the nexus-session cookie.
 * The cookie payload contains only the sessionId (opaque reference).
 * All session data lives in the store.
 */

import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "nexus-session";
const ALGORITHM = "HS256";
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET environment variable is required");
  return new TextEncoder().encode(s);
}

export async function signSessionJwt(sessionId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ sessionId })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt(now)
    .setExpirationTime(now + TTL_SECONDS)
    .sign(secret());
}

export async function verifySessionJwt(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify<{ sessionId: string }>(token, secret(), {
      algorithms: [ALGORITHM],
    });
    return payload.sessionId ?? null;
  } catch {
    return null;
  }
}

export function makeSetCookieHeader(token: string): string {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    `Max-Age=${TTL_SECONDS}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export function makeClearCookieHeader(): string {
  return `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`;
}
