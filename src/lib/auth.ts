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
