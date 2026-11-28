import { NextRequest, NextResponse } from "next/server";

const SANDBOX_BASE_URL = "https://sandbox.uddoktapay.com";
const SANDBOX_API_KEY = "982d381360a69d419689740d9f2e26ce36fb7a50";

export function getUddoktaPayConfig() {
  const rawBase = (process.env.UDDOKTAPAY_BASE_URL || SANDBOX_BASE_URL)
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api\/checkout-v2$/i, "")
    .replace(/\/api\/checkout$/i, "")
    .replace(/\/api$/i, "");
  const apiKey = (process.env.UDDOKTAPAY_API_KEY || SANDBOX_API_KEY).trim();
  return { baseUrl: rawBase, apiKey, isSandbox: rawBase.includes("sandbox") };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const order = body?.order;
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      body?.origin ||
      req.nextUrl.origin;

    if (!order || !order.id || !order.price?.total) {
      return NextResponse.json({ error: "Invalid order details" }, { status: 400 });
    }

    const { baseUrl, apiKey } = getUddoktaPayConfig();
    const cleanPhone = String(order.phone || "").replace(/\D/g, "") || "01700000000";
    const customerEmail =
      order.email && /^\S+@\S+\.\S+$/.test(String(order.email).trim())
        ? String(order.email).trim()
        : `${cleanPhone}@noksha.bd`;

    const payload = {
      full_name: String(order.name || "Noksha Customer"),
      email: customerEmail,
      amount: String(Math.round(Number(order.price.total))),
      metadata: {
        order_id: String(order.id),
        phone: String(order.phone || ""),
      },
      redirect_url: `${origin}/checkout?uddoktapay=success&order_id=${encodeURIComponent(order.id)}`,
      return_type: "GET",
      cancel_url: `${origin}/checkout?uddoktapay=cancelled&order_id=${encodeURIComponent(order.id)}`,
      webhook_url: `${origin}/api/payments/uddoktapay/webhook`,
    };

    const res = await fetch(`${baseUrl}/api/checkout-v2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "RT-UDDOKTAPAY-API-KEY": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data?.status || !data?.payment_url) {
      return NextResponse.json(
        { error: data?.message || "UddoktaPay checkout session failed", raw: data },
        { status: 400 }
      );
    }

    return NextResponse.json({ payment_url: data.payment_url });
  } catch (err) {
    console.error("UddoktaPay create error:", err);
    return NextResponse.json({ error: "Failed to initialize UddoktaPay payment" }, { status: 500 });
  }
}
