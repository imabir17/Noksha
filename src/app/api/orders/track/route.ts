import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function normalizeBdPhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("880") && digits.length >= 13) {
    return digits.slice(2); // 01XXXXXXXXX
  }
  if (digits.startsWith("88") && digits.length >= 12) {
    return digits.slice(2);
  }
  return digits;
}

export async function GET(req: NextRequest) {
  try {
    const phone = req.nextUrl.searchParams.get("phone") || "";
    const normalized = normalizeBdPhoneDigits(phone);

    if (normalized.length < 8) {
      return NextResponse.json(
        { error: "Please enter the valid phone number used while ordering." },
        { status: 400 }
      );
    }

    const db = getDb();
    const rawOrders = db
      .prepare("SELECT * FROM orders ORDER BY created_at DESC")
      .all() as {
      id: string;
      customer_name: string;
      customer_phone: string;
      customer_email: string;
      district: string;
      address: string;
      notes: string;
      payment_method: string;
      payment_status: string;
      trx_id: string;
      gift_note: string;
      subtotal_bdt: number;
      discount_bdt: number;
      delivery_bdt: number;
      total_bdt: number;
      status: string;
      courier_name: string;
      tracking_code: string;
      items_json: string;
      timeline_json: string;
      cancellation_requested?: number;
      cancellation_reason?: string;
      created_at: string;
      updated_at: string;
    }[];

    const matched = rawOrders
      .filter((o) => {
        const orderDigits = normalizeBdPhoneDigits(o.customer_phone || "");
        return orderDigits === normalized || orderDigits.endsWith(normalized) || normalized.endsWith(orderDigits);
      })
      .map((o) => {
        let items: {
          productId?: string;
          name: string;
          priceBDT: number;
          quantity: number;
          selectedColor: string;
          image?: string;
        }[] = [];
        let timeline: { status: string; at: string; by: string; note: string }[] = [];
        try {
          items = JSON.parse(o.items_json);
        } catch {
          // ignore
        }
        try {
          timeline = JSON.parse(o.timeline_json);
        } catch {
          // ignore
        }

        return {
          id: o.id,
          customerName: o.customer_name,
          customerPhone: o.customer_phone,
          district: o.district,
          address: o.address,
          paymentMethod: o.payment_method,
          paymentStatus: o.payment_status,
          trxId: o.trx_id,
          giftNote: o.gift_note,
          subtotalBDT: o.subtotal_bdt,
          discountBDT: o.discount_bdt,
          deliveryBDT: o.delivery_bdt,
          totalBDT: o.total_bdt,
          status: o.status,
          courierName: o.courier_name,
          trackingCode: o.tracking_code,
          items,
          timeline,
          cancellationRequested: Boolean(o.cancellation_requested),
          cancellationReason: o.cancellation_reason || "",
          createdAt: o.created_at,
          updatedAt: o.updated_at,
        };
      });

    return NextResponse.json({ orders: matched });
  } catch (err) {
    console.error("GET /api/orders/track error:", err);
    return NextResponse.json({ error: "Failed to look up orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = String(body?.orderId || "").trim();
    const phone = String(body?.phone || "").trim();
    const reason = String(body?.reason || "").trim() || "Requested by customer";

    if (!orderId || !phone) {
      return NextResponse.json({ error: "Order ID and phone number are required." }, { status: 400 });
    }

    const db = getDb();
    const order = db
      .prepare(
        "SELECT id, customer_phone, status, internal_notes, timeline_json, cancellation_requested FROM orders WHERE id = ?"
      )
      .get(orderId) as
      | {
          id: string;
          customer_phone: string;
          status: string;
          internal_notes: string;
          timeline_json: string;
          cancellation_requested: number;
        }
      | undefined;

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const reqDigits = normalizeBdPhoneDigits(phone);
    const orderDigits = normalizeBdPhoneDigits(order.customer_phone || "");
    if (!reqDigits || (reqDigits !== orderDigits && !orderDigits.endsWith(reqDigits))) {
      return NextResponse.json({ error: "Phone number does not match this order." }, { status: 403 });
    }

    // Cancellation requests are only allowed until shipped
    if (["shipped", "delivered", "cancelled"].includes(order.status)) {
      return NextResponse.json(
        {
          error:
            order.status === "cancelled"
              ? "This order is already cancelled."
              : "This order has already been shipped and can no longer be cancelled.",
        },
        { status: 400 }
      );
    }

    if (order.cancellation_requested) {
      return NextResponse.json(
        { error: "A cancellation request has already been submitted for this order." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    let timeline: { status: string; at: string; by: string; note: string }[] = [];
    try {
      timeline = JSON.parse(order.timeline_json);
    } catch {
      // ignore
    }

    timeline.push({
      status: order.status,
      at: now,
      by: "Customer",
      note: `Cancellation requested: ${reason}`,
    });

    const nextInternalNotes = [
      order.internal_notes,
      `[CUSTOMER CANCELLATION REQUESTED at ${new Date(now).toLocaleString("en-GB")}]: ${reason}`,
    ]
      .filter(Boolean)
      .join("\n");

    db.prepare(
      `UPDATE orders
       SET cancellation_requested = 1,
           cancellation_reason = ?,
           internal_notes = ?,
           timeline_json = ?,
           updated_at = ?
       WHERE id = ?`
    ).run(reason, nextInternalNotes, JSON.stringify(timeline), now, orderId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/orders/track error:", err);
    return NextResponse.json({ error: "Failed to submit cancellation request" }, { status: 500 });
  }
}
