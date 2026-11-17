import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAllCategories, getAllCollections, getAllProducts, getAllPromoCodes, getDb, getSiteContentMap } from "@/lib/db";

export async function GET() {
  try {
    const categories = getAllCategories(false);
    const collections = getAllCollections(false);
    const products = getAllProducts(false);
    const promoCodes = getAllPromoCodes(true);
    const siteContent = getSiteContentMap();
    return NextResponse.json({ categories, collections, products, promoCodes, siteContent });
  } catch (err) {
    console.error("GET /api/store error:", err);
    return NextResponse.json({ error: "Failed to load store data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action as string;
    const db = getDb();
    const now = new Date().toISOString();

    if (action === "track_event") {
      const visitorId = String(body.visitorId || "anon");
      const sessionId = String(body.sessionId || "sess");
      const eventType = String(body.eventType || "page_view");
      const pathStr = String(body.path || "/");
      const productId = String(body.productId || "");
      const step = String(body.step || "");
      const referrer = String(body.referrer || "Direct");
      const device = String(body.device || "desktop");
      const durationMs = Number(body.durationMs || 0);

      db.prepare(
        `INSERT INTO analytics_events (
          visitor_id, session_id, event_type, path, product_id, step, referrer, device, duration_ms, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(visitorId, sessionId, eventType, pathStr, productId, step, referrer, device, durationMs, now);

      if (eventType === "product_view" && productId) {
        db.prepare("UPDATE products SET views_count = views_count + 1 WHERE id = ?").run(productId);
      } else if (eventType === "add_to_bag" && productId) {
        db.prepare("UPDATE products SET add_to_bag_count = add_to_bag_count + 1 WHERE id = ?").run(productId);
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "sync_checkout") {
      const sessionId = String(body.sessionId || "");
      if (!sessionId) return NextResponse.json({ ok: false });
      db.prepare(
        `INSERT INTO abandoned_checkouts (
          session_id, visitor_id, customer_name, customer_phone, customer_email,
          district, address, last_step, items_json, subtotal_bdt, recovered, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
        ON CONFLICT(session_id) DO UPDATE SET
          customer_name = excluded.customer_name,
          customer_phone = excluded.customer_phone,
          customer_email = excluded.customer_email,
          district = excluded.district,
          address = excluded.address,
          last_step = excluded.last_step,
          items_json = excluded.items_json,
          subtotal_bdt = excluded.subtotal_bdt,
          updated_at = excluded.updated_at`
      ).run(
        sessionId,
        String(body.visitorId || ""),
        String(body.name || ""),
        String(body.phone || ""),
        String(body.email || ""),
        String(body.district || "Dhaka"),
        String(body.address || ""),
        String(body.lastStep || "checkout_viewed"),
        JSON.stringify(body.items || []),
        Number(body.subtotalBDT || 0),
        now
      );
      return NextResponse.json({ ok: true });
    }

    if (action === "place_order") {
      const order = body.order;
      if (!order || !order.id) {
        return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
      }

      const items = Array.isArray(order.items) ? order.items : [];
      const normalizedItems = items.map((i: { product?: { id: string; name: string; category: string; priceBDT: number; image: string }; quantity: number; selectedColor: string }) => ({
        productId: i.product?.id ?? "",
        name: i.product?.name ?? "Noksha Piece",
        category: i.product?.category ?? "",
        priceBDT: Number(i.product?.priceBDT ?? 0),
        quantity: Number(i.quantity ?? 1),
        selectedColor: String(i.selectedColor ?? ""),
        image: i.product?.image ?? "",
      }));

      const tx = db.transaction(() => {
        // Validate availability & Drop payment rules before recording order
        for (const item of normalizedItems) {
          if (!item.productId) continue;
          const row = db
            .prepare("SELECT name, collection_id, status, stock_qty FROM products WHERE id = ?")
            .get(item.productId) as
            | { name: string; collection_id: string; status: string; stock_qty: number }
            | undefined;
          if (!row) continue;

          const isCollectionPiece = Boolean(row.collection_id && row.collection_id.trim() !== "");
          if (isCollectionPiece) {
            if (row.status === "sold") {
              throw new Error(`"${row.name}" has already been acquired by another collector.`);
            }
            if (String(order.payment || "") !== "uddoktapay") {
              throw new Error(`Exclusive Drop piece "${row.name}" requires online payment (no Cash on Delivery).`);
            }
          }
        }

        db.prepare(
          `INSERT INTO orders (
            id, customer_name, customer_phone, customer_email, district, address, notes,
            payment_method, payment_status, trx_id, gift_note, promo_code,
            subtotal_bdt, discount_bdt, delivery_bdt, total_bdt,
            status, courier_name, tracking_code, internal_notes,
            items_json, timeline_json, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, 'new', '', '', '', ?, ?, ?, ?)`
        ).run(
          String(order.id),
          String(order.name || ""),
          String(order.phone || ""),
          String(order.email || ""),
          String(order.district || "Dhaka"),
          String(order.address || ""),
          String(order.notes || ""),
          String(order.payment || "cod"),
          String(order.trxId || ""),
          String(order.giftNote || ""),
          String(order.promoCode || ""),
          Number(order.price?.subtotal ?? 0),
          Number(order.price?.discount ?? 0),
          Number(order.price?.delivery ?? 0),
          Number(order.price?.total ?? 0),
          JSON.stringify(normalizedItems),
          JSON.stringify([{ status: "new", at: now, by: "Customer", note: "Order placed on website" }]),
          now,
          now
        );

        // Update product inventory for regular store pieces immediately.
        // For 1-of-1 Drop pieces paid via UddoktaPay, ownership is locked when payment is verified (first-to-pay wins).
        for (const item of normalizedItems) {
          if (!item.productId) continue;
          const row = db
            .prepare("SELECT category, collection_id, stock_qty, low_stock_threshold FROM products WHERE id = ?")
            .get(item.productId) as { category: string; collection_id: string; stock_qty: number; low_stock_threshold: number } | undefined;
          if (!row) continue;

          const isCollectionPiece = Boolean(row.collection_id && row.collection_id.trim() !== "");
          if (isCollectionPiece) {
            db.prepare("UPDATE products SET orders_count = orders_count + 1, updated_at = ? WHERE id = ?").run(
              now,
              item.productId
            );
            continue;
          }

          const newStock = Math.max(0, row.stock_qty - item.quantity);
          let nextStatus = "ready";
          let nextLabel = "In Stock";

          if (newStock === 0) {
            nextStatus = "sold";
            nextLabel = "Sold Out";
          } else if (newStock <= row.low_stock_threshold) {
            nextStatus = "limited";
            nextLabel = `Only ${newStock} Left`;
          }

          db.prepare(
            `UPDATE products
             SET stock_qty = ?, status = ?, status_label = ?, orders_count = orders_count + ?, updated_at = ?
             WHERE id = ?`
          ).run(newStock, nextStatus, nextLabel, item.quantity, now, item.productId);
        }

        if (order.promoCode) {
          db.prepare("UPDATE promo_codes SET used_count = used_count + 1 WHERE code = ?").run(
            String(order.promoCode).toUpperCase()
          );
        }

        if (body.sessionId) {
          db.prepare(
            "UPDATE abandoned_checkouts SET recovered = 1, last_step = 'completed', updated_at = ? WHERE session_id = ?"
          ).run(now, String(body.sessionId));
        }
      });

      tx();
      revalidatePath("/");
      revalidatePath("/checkout");
      return NextResponse.json({ ok: true });
    }

    if (action === "reserve_waitlist") {
      db.prepare(
        `INSERT INTO leads (type, name, phone, email, product_id, product_name, courtesy_code, status, notes, created_at)
         VALUES ('waitlist', ?, ?, ?, ?, ?, '', 'new', 'Batch #02 reservation from product page', ?)`
      ).run(
        String(body.name || ""),
        String(body.phone || ""),
        String(body.email || ""),
        String(body.productId || ""),
        String(body.productName || ""),
        now
      );
      return NextResponse.json({ ok: true });
    }

    if (action === "join_circle") {
      db.prepare(
        `INSERT INTO leads (type, name, phone, email, product_id, product_name, courtesy_code, status, notes, created_at)
         VALUES ('founding_circle', ?, ?, ?, '', ?, 'SHUVO10', 'new', 'Joined Founding Circle', ?)`
      ).run(
        String(body.name || ""),
        String(body.phone || ""),
        String(body.email || ""),
        `Founding Circle No. ${body.memberNo || "100"}`,
        now
      );
      return NextResponse.json({ ok: true });
    }

    if (action === "subscribe_newsletter") {
      db.prepare(
        `INSERT INTO leads (type, name, phone, email, product_id, product_name, courtesy_code, status, notes, created_at)
         VALUES ('newsletter', '', '', ?, '', 'Letters from the looms', '', 'new', 'Footer newsletter signup', ?)`
      ).run(String(body.email || ""), now);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("POST /api/store error:", err);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
