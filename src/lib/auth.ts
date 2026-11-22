import crypto from "crypto";
import { cookies } from "next/headers";

export type StaffRole = "owner" | "manager" | "support";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: StaffRole;
}

export const SESSION_COOKIE = "noksha_admin_session";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const hashBuffer = crypto.scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, "hex");
  if (hashBuffer.length !== keyBuffer.length) return false;
  return crypto.timingSafeEqual(hashBuffer, keyBuffer);
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function getSigningSecret(): string {
  return (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "noksha-atelier-hmac-secret-2026"
  );
}

export function createSignedSessionToken(user: SessionUser): string {
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      exp: Date.now() + 7 * 86400000,
    })
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySignedSessionToken(token: string | null): SessionUser | null {
  if (!token || !token.includes(".")) return null;
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const expected = crypto
      .createHmac("sha256", getSigningSecret())
      .update(payload)
      .digest("base64url");
    if (sig !== expected) return null;
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!parsed || typeof parsed.exp !== "number" || parsed.exp < Date.now()) {
      return null;
    }
    return {
      id: Number(parsed.id),
      name: String(parsed.name),
      email: String(parsed.email),
      role: parsed.role as StaffRole,
    };
  } catch {
    return null;
  }
}

export async function getSessionTokenFromCookies(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export function canAccessSection(role: StaffRole, section: string): boolean {
  if (role === "owner") return true;
  if (role === "manager") {
    return section !== "staff";
  }
  // support role
  return ["overview", "orders", "customers", "leads", "abandoned"].includes(section);
}
