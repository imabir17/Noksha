import { NextRequest, NextResponse } from "next/server";
import type Database from "better-sqlite3";
import { getDb } from "@/lib/db";

function ensureCancellationCols(db: Database.Database) {
  const cols = db.prepare("PRAGMA table_info(orders)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "cancellation_requested")) {
    db.exec("ALTER TABLE orders ADD COLUMN cancellation_requested INTEGER NOT NULL DEFAULT 0");
  }
  if (!cols.some((c) => c.name === "cancellation_reason")) {
    db.exec("ALTER TABLE orders ADD COLUMN cancellation_reason TEXT NOT NULL DEFAULT ''");
  }
}

function normalizeBdPhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("880") && digits.length >= 13) {
    return digits.slice(2);
  }
  if (digits.startsWith("88") && digits.length >= 12) {
    return digits.slice(2);
  }
  return digits;
}

export async function GET(req: NextRequest) {
  try {
    const orderId = (req.nextUrl.searchParams.get("orderId") || "").trim().toUpperCase();

    if (orderId.length < 4) {
      return NextResponse.json(
        { error: "Please enter a valid Order Number (e.g. NK-84K21)." },
        { status: 400 }
      );
    }

    const db = getDb();
    ensureCancellationCols(db);
    const o = db
      .prepare("SELECT * FROM orders WHERE upper(id) = ?")
      .get(orderId) as
      | {
          id: string;
          customer_name: string;
          customer_phone: string;
          district: string;
          address: string;
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
        }
      | undefined;

    if (!o) {
      return NextResponse.json(
        { error: `No order found with Order Number ${orderId}.` },
        { status: 404 }
      );
    }

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

    return NextResponse.json({
      order: {
        id: o.id,
        customerName: o.customer_name,
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
      },
    });
  } catch (err) {
    console.error("GET /api/orders/track error:", err);
    return NextResponse.json({ error: "Failed to look up order" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = String(body?.orderId || "").trim().toUpperCase();
    const phone = String(body?.phone || "").trim();
    const reason = String(body?.reason || "").trim() || "Requested by customer";

    if (!orderId || !phone) {
      return NextResponse.json(
        { error: "Order Number and the phone number used while ordering are required." },
        { status: 400 }
      );
    }

    const db = getDb();
    ensureCancellationCols(db);
    const order = db
      .prepare(
        "SELECT id, customer_phone, status, internal_notes, timeline_json, cancellation_requested FROM orders WHERE upper(id) = ?"
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
      return NextResponse.json(
        { error: "Phone number does not match the phone number used for this order." },
        { status: 403 }
      );
    }

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
    ).run(reason, nextInternalNotes, JSON.stringify(timeline), now, order.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/orders/track error:", err);
    return NextResponse.json({ error: "Failed to submit cancellation request" }, { status: 500 });
  }
}
