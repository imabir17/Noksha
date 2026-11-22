import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSignedSessionToken,
  getSessionTokenFromCookies,
  SESSION_COOKIE,
  verifyPassword,
} from "@/lib/auth";
import { getDb, getSessionUser, logAudit, syncDbToSupabase } from "@/lib/db";

export async function GET() {
  const token = await getSessionTokenFromCookies();
  const user = getSessionUser(token);
  return NextResponse.json({ user });
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPass = String(password || "");

    const db = getDb();
    const row = db
      .prepare("SELECT id, name, email, password_hash, role, active FROM staff_users WHERE lower(email) = ?")
      .get(cleanEmail) as
      | { id: number; name: string; email: string; password_hash: string; role: "owner" | "manager" | "support"; active: number }
      | undefined;

    if (!row || !row.active || !verifyPassword(cleanPass, row.password_hash)) {
      logAudit({ email: cleanEmail || "unknown", role: "unauthorized" }, "failed_login", "staff_user", cleanEmail || "unknown", "Failed sign-in attempt");
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const token = createSignedSessionToken({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
    });
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 86400000).toISOString();

    db.prepare("INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").run(
      token,
      row.id,
      expiresAt,
      now.toISOString()
    );
    db.prepare("UPDATE staff_users SET last_login_at = ? WHERE id = ?").run(now.toISOString(), row.id);

    logAudit({ email: row.email, role: row.role }, "staff_login", "staff_user", String(row.id), `${row.name} signed in`);
    await syncDbToSupabase();

    const store = await cookies();
    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 86400,
    });

    return NextResponse.json({
      user: { id: row.id, name: row.name, email: row.email, role: row.role },
    });
  } catch (err) {
    console.error("POST /api/admin/auth error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const token = await getSessionTokenFromCookies();
  if (token) {
    const user = getSessionUser(token);
    if (user) {
      logAudit(user, "staff_logout", "staff_user", String(user.id), `${user.name} signed out`);
    }
    const db = getDb();
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  }
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
