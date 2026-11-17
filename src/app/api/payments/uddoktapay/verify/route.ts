import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUddoktaPayConfig } from "../create/route";

export async function verifyAndMarkOrder(invoiceId: string, fallbackOrderId?: string) {
  const { baseUrl, apiKey } = getUddoktaPayConfig();

  const res = await fetch(`${baseUrl}/api/verify-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "RT-UDDOKTAPAY-API-KEY": apiKey,
    },
    body: JSON.stringify({ invoice_id: invoiceId }),
  });

  const data = await res.json();
  const orderId = String(data?.metadata?.order_id || fallbackOrderId || "");

  if (data?.status === "COMPLETED" && orderId) {
    const db = getDb();
    const now = new Date().toISOString();
    const existing = db
      .prepare("SELECT status, timeline_json FROM orders WHERE id = ?")
      .get(orderId) as { status: string; timeline_json: string } | undefined;

    if (existing) {
      let timeline: { status: string; at: string; by: string; note: string }[] = [];
      try {
        timeline = JSON.parse(existing.timeline_json);
      } catch {
        // ignore
      }

      const trxId = String(data.transaction_id || invoiceId);
      const alreadyLogged = timeline.some((t) => t.note.includes(trxId));
      if (!alreadyLogged) {
        timeline.push({
          status: "confirmed",
          at: now,
          by: "UddoktaPay",
          note: `Payment verified (${data.payment_method || "Online"} · TrxID: ${trxId})`,
        });
      }

      db.prepare(
        `UPDATE orders
         SET payment_status = 'verified',
             trx_id = ?,
             status = CASE WHEN status = 'new' THEN 'confirmed' ELSE status END,
             timeline_json = ?,
             updated_at = ?
         WHERE id = ?`
      ).run(trxId, JSON.stringify(timeline), now, orderId);
    }
  }

  return data;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const invoiceId = String(body?.invoice_id || "");
    const orderId = String(body?.order_id || "");
    if (!invoiceId) {
      return NextResponse.json({ error: "invoice_id is required" }, { status: 400 });
    }

    const data = await verifyAndMarkOrder(invoiceId, orderId);
    return NextResponse.json({
      verified: data?.status === "COMPLETED",
      status: data?.status || "PENDING",
      transaction_id: data?.transaction_id || "",
      payment_method: data?.payment_method || "",
      order_id: data?.metadata?.order_id || orderId,
    });
  } catch (err) {
    console.error("UddoktaPay verify error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
