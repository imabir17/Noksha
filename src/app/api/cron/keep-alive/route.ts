import { NextResponse } from "next/server";
import { getDb, syncDbToSupabase } from "@/lib/db";
import { pingSupabaseKeepAlive } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const productCount = (
      db.prepare("SELECT COUNT(*) as c FROM products").get() as { c: number }
    ).c;
    const ping = await pingSupabaseKeepAlive();
    await syncDbToSupabase();

    return NextResponse.json({
      ok: true,
      supabaseEnabled: ping.enabled,
      supabaseAlive: ping.ok,
      productCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Keep-alive cron error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
