import { NextRequest, NextResponse } from "next/server";
import { getUddoktaPayConfig } from "../create/route";
import { verifyAndMarkOrder } from "../verify/route";

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = getUddoktaPayConfig();
    const headerKey = req.headers.get("rt-uddoktapay-api-key") || "";
    if (!headerKey || headerKey !== apiKey) {
      return NextResponse.json({ error: "Unauthorized webhook" }, { status: 401 });
    }

    const body = await req.json();
    const invoiceId = String(body?.invoice_id || "");
    const orderId = String(body?.metadata?.order_id || "");
    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoice_id" }, { status: 400 });
    }

    await verifyAndMarkOrder(invoiceId, orderId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("UddoktaPay webhook error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
