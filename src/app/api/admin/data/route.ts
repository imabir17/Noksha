import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionTokenFromCookies, hashPassword } from "@/lib/auth";
import {
  clearDemoData,
  getAllCategories,
  getAllCollections,
  getAllProducts,
  getAllPromoCodes,
  getDb,
  getSessionUser,
  getSiteContentMap,
  logAudit,
} from "@/lib/db";
import { getSupabaseConfig } from "@/lib/supabase";

export async function GET() {
  try {
    const token = await getSessionTokenFromCookies();
    const user = getSessionUser(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const categories = getAllCategories(true);
    const collections = getAllCollections(true);
    const products = getAllProducts(true);
    const promoCodes = getAllPromoCodes(false);
    const siteContent = getSiteContentMap();

    // Orders
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
      promo_code: string;
      subtotal_bdt: number;
      discount_bdt: number;
      delivery_bdt: number;
      total_bdt: number;
      status: string;
      courier_name: string;
      tracking_code: string;
      internal_notes: string;
      items_json: string;
      timeline_json: string;
      cancellation_requested?: number;
      cancellation_reason?: string;
      created_at: string;
      updated_at: string;
    }[];

    const orders = rawOrders.map((o) => {
      let items: {
        productId?: string;
        name: string;
        category?: string;
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
        customerEmail: o.customer_email,
        district: o.district,
        address: o.address,
        notes: o.notes,
        paymentMethod: o.payment_method,
        paymentStatus: o.payment_status,
        trxId: o.trx_id,
        giftNote: o.gift_note,
        promoCode: o.promo_code,
        subtotalBDT: o.subtotal_bdt,
        discountBDT: o.discount_bdt,
        deliveryBDT: o.delivery_bdt,
        totalBDT: o.total_bdt,
        status: o.status,
        courierName: o.courier_name,
        trackingCode: o.tracking_code,
        internalNotes: o.internal_notes,
        items,
        timeline,
        cancellationRequested: Boolean(o.cancellation_requested),
        cancellationReason: o.cancellation_reason || "",
        createdAt: o.created_at,
        updatedAt: o.updated_at,
      };
    });

    // Customer CRM profiles aggregated from orders + customer_notes
    const noteRows = db.prepare("SELECT * FROM customer_notes").all() as {
      phone: string;
      tags: string;
      notes: string;
      vip: number;
    }[];
    const noteMap = new Map(noteRows.map((n) => [n.phone, n]));

    const customerMap = new Map<
      string,
      {
        phone: string;
        name: string;
        email: string;
        district: string;
        address: string;
        ordersCount: number;
        totalSpentBDT: number;
        lastOrderAt: string;
        firstOrderAt: string;
        orderIds: string[];
        tags: string;
        notes: string;
        vip: boolean;
      }
    >();

    for (const o of orders) {
      const key = o.customerPhone.replace(/[\s-]/g, "");
      const existing = customerMap.get(key);
      const crmMeta = noteMap.get(key) ?? noteMap.get(o.customerPhone);
      if (!existing) {
        customerMap.set(key, {
          phone: o.customerPhone,
          name: o.customerName,
          email: o.customerEmail,
          district: o.district,
          address: o.address,
          ordersCount: o.status !== "cancelled" ? 1 : 0,
          totalSpentBDT: o.status !== "cancelled" ? o.totalBDT : 0,
          lastOrderAt: o.createdAt,
          firstOrderAt: o.createdAt,
          orderIds: [o.id],
          tags: crmMeta?.tags ?? (o.totalBDT >= 15000 ? "High-Value, Founding Batch" : "Founding Batch"),
          notes: crmMeta?.notes ?? "",
          vip: crmMeta ? Boolean(crmMeta.vip) : o.totalBDT >= 15000,
        });
      } else {
        if (o.status !== "cancelled") {
          existing.ordersCount += 1;
          existing.totalSpentBDT += o.totalBDT;
        }
        if (o.createdAt > existing.lastOrderAt) existing.lastOrderAt = o.createdAt;
        if (o.createdAt < existing.firstOrderAt) existing.firstOrderAt = o.createdAt;
        existing.orderIds.push(o.id);
      }
    }

    const customers = Array.from(customerMap.values()).sort(
      (a, b) => b.totalSpentBDT - a.totalSpentBDT
    );

    // Leads (Waitlist, Founding Circle, Newsletter)
    const leads = db
      .prepare("SELECT * FROM leads ORDER BY created_at DESC")
      .all() as {
      id: number;
      type: string;
      name: string;
      phone: string;
      email: string;
      product_id: string;
      product_name: string;
      courtesy_code: string;
      status: string;
      notes: string;
      created_at: string;
    }[];

    // Abandoned checkouts
    const rawAbandoned = db
      .prepare("SELECT * FROM abandoned_checkouts ORDER BY updated_at DESC")
      .all() as {
      session_id: string;
      visitor_id: string;
      customer_name: string;
      customer_phone: string;
      customer_email: string;
      district: string;
      address: string;
      last_step: string;
      items_json: string;
      subtotal_bdt: number;
      recovered: number;
      updated_at: string;
    }[];

    const abandonedCheckouts = rawAbandoned.map((a) => {
      let items: { name: string; priceBDT: number; quantity: number; selectedColor: string }[] = [];
      try {
        items = JSON.parse(a.items_json);
      } catch {
        // ignore
      }
      return {
        sessionId: a.session_id,
        visitorId: a.visitor_id,
        customerName: a.customer_name,
        customerPhone: a.customer_phone,
        customerEmail: a.customer_email,
        district: a.district,
        address: a.address,
        lastStep: a.last_step,
        items,
        subtotalBDT: a.subtotal_bdt,
        recovered: Boolean(a.recovered),
        updatedAt: a.updated_at,
      };
    });

    // Analytics Aggregations
    const totalVisitors = (
      db.prepare("SELECT COUNT(DISTINCT visitor_id) as c FROM analytics_events").get() as { c: number }
    ).c;
    const totalSessions = (
      db.prepare("SELECT COUNT(DISTINCT session_id) as c FROM analytics_events").get() as { c: number }
    ).c;
    const totalPageViews = (
      db
        .prepare("SELECT COUNT(*) as c FROM analytics_events WHERE event_type IN ('page_view', 'product_view')")
        .get() as { c: number }
    ).c;
    const avgDurationMs = Math.round(
      (
        db
          .prepare("SELECT AVG(duration_ms) as a FROM analytics_events WHERE duration_ms > 0")
          .get() as { a: number | null }
      ).a ?? 44000
    );

    // Top pages + exit rate per page
    const pageRows = db
      .prepare(
        `SELECT
           path,
           COUNT(*) as views,
           COUNT(DISTINCT visitor_id) as unique_visitors,
           ROUND(AVG(CASE WHEN duration_ms > 0 THEN duration_ms ELSE 40000 END)) as avg_duration_ms
         FROM analytics_events
         WHERE event_type IN ('page_view', 'product_view', 'checkout_step')
         GROUP BY path
         ORDER BY views DESC
         LIMIT 12`
      )
      .all() as { path: string; views: number; unique_visitors: number; avg_duration_ms: number }[];

    const exitByPathRows = db
      .prepare(
        `SELECT path, COUNT(*) as exits
         FROM analytics_events
         WHERE event_type = 'page_exit'
         GROUP BY path`
      )
      .all() as { path: string; exits: number }[];
    const exitPathMap = new Map(exitByPathRows.map((e) => [e.path, e.exits]));

    const topPages = pageRows.map((p) => {
      const exits = exitPathMap.get(p.path) ?? 0;
      const exitRate = p.views > 0 ? Math.min(100, Math.round((exits / p.views) * 100)) : 0;
      return {
        path: p.path,
        views: p.views,
        uniqueVisitors: p.unique_visitors,
        avgDurationSec: Math.round((p.avg_duration_ms || 38000) / 1000),
        exits,
        exitRate,
      };
    });

    // Funnel & Exit-Step Breakdown
    const funnelSteps = [
      { key: "landing", label: "1. Storefront Landing (/)" },
      { key: "product_detail", label: "2. Viewed Piece Page (/pieces/[id])" },
      { key: "bag_opened", label: "3. Added Piece to Bag" },
      { key: "checkout_viewed", label: "4. Opened Checkout (/checkout)" },
      { key: "recipient_filled", label: "5. Filled Recipient Info (Step 01)" },
      { key: "delivery_filled", label: "6. Filled Delivery Address (Step 02)" },
      { key: "payment_selected", label: "7. Selected Payment Method (Step 03)" },
      { key: "order_completed", label: "8. Completed Order" },
    ];

    const stepCounts = db
      .prepare(
        `SELECT step, COUNT(DISTINCT session_id) as sessions
         FROM analytics_events
         WHERE step != '' AND event_type != 'page_exit'
         GROUP BY step`
      )
      .all() as { step: string; sessions: number }[];
    const stepMap = new Map(stepCounts.map((s) => [s.step, s.sessions]));

    const stepExits = db
      .prepare(
        `SELECT step, COUNT(*) as exits
         FROM analytics_events
         WHERE event_type = 'page_exit' AND step != ''
         GROUP BY step`
      )
      .all() as { step: string; exits: number }[];
    const stepExitMap = new Map(stepExits.map((s) => [s.step, s.exits]));

    const baseSessions = Math.max(1, stepMap.get("landing") ?? totalSessions);
    const funnel = funnelSteps.map((st, idx) => {
      const count = stepMap.get(st.key) ?? 0;
      const prevCount = idx === 0 ? count : Math.max(1, stepMap.get(funnelSteps[idx - 1].key) ?? 1);
      const exitsHere = stepExitMap.get(st.key) ?? 0;
      return {
        key: st.key,
        label: st.label,
        sessions: count,
        pctOfTotal: Math.round((count / baseSessions) * 100),
        stepConversionPct: idx === 0 ? 100 : Math.min(100, Math.round((count / prevCount) * 100)),
        exitsHere,
        dropOffPct: idx === 0 ? 0 : Math.max(0, 100 - Math.min(100, Math.round((count / prevCount) * 100))),
      };
    });

    // Traffic sources & devices
    const referrers = db
      .prepare(
        `SELECT referrer, COUNT(DISTINCT session_id) as sessions
         FROM analytics_events
         GROUP BY referrer
         ORDER BY sessions DESC`
      )
      .all() as { referrer: string; sessions: number }[];

    const devices = db
      .prepare(
        `SELECT device, COUNT(DISTINCT session_id) as sessions
         FROM analytics_events
         GROUP BY device
         ORDER BY sessions DESC`
      )
      .all() as { device: string; sessions: number }[];

    // Daily trend (last 7 days)
    const dailyRows = db
      .prepare(
        `SELECT substr(created_at, 1, 10) as day,
                COUNT(DISTINCT visitor_id) as visitors,
                COUNT(DISTINCT session_id) as sessions,
                SUM(CASE WHEN event_type IN ('page_view', 'product_view') THEN 1 ELSE 0 END) as page_views
         FROM analytics_events
         GROUP BY substr(created_at, 1, 10)
         ORDER BY day ASC
         LIMIT 14`
      )
      .all() as { day: string; visitors: number; sessions: number; page_views: number }[];

    // Staff & Audit logs
    const staff =
      user.role === "owner"
        ? (db
            .prepare(
              "SELECT id, name, email, role, active, last_login_at, created_at FROM staff_users ORDER BY id ASC"
            )
            .all() as {
            id: number;
            name: string;
            email: string;
            role: string;
            active: number;
            last_login_at: string | null;
            created_at: string;
          }[])
        : [];

    const auditLogs = db
      .prepare("SELECT * FROM audit_logs ORDER BY id DESC")
      .all() as {
      id: number;
      user_email: string;
      user_role: string;
      action: string;
      entity_type: string;
      entity_id: string;
      details: string;
      created_at: string;
    }[];

    return NextResponse.json({
      user,
      supabaseEnabled: getSupabaseConfig().enabled,
      categories,
      collections,
      products,
      orders,
      customers,
      promoCodes,
      leads,
      abandonedCheckouts,
      siteContent,
      staff,
      auditLogs,
      analytics: {
        totalVisitors,
        totalSessions,
        totalPageViews,
        avgDurationSec: Math.round(avgDurationMs / 1000),
        topPages,
        funnel,
        referrers,
        devices,
        daily: dailyRows,
      },
    });
  } catch (err) {
    console.error("GET /api/admin/data error:", err);
    return NextResponse.json({ error: "Failed to load admin data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getSessionTokenFromCookies();
    const user = getSessionUser(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const action = body?.action as string;
    const db = getDb();
    const now = new Date().toISOString();

    // 1. Update Order (allowed for owner, manager, support)
    if (action === "update_order") {
      const { id, status, paymentStatus, courierName, trackingCode, internalNotes, note } = body;
      const existing = db
        .prepare("SELECT status, customer_name, items_json, timeline_json FROM orders WHERE id = ?")
        .get(id) as { status: string; customer_name: string; items_json: string; timeline_json: string } | undefined;
      if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

      let timeline: { status: string; at: string; by: string; note: string }[] = [];
      try {
        timeline = JSON.parse(existing.timeline_json);
      } catch {
        // ignore
      }
      if (status && status !== existing.status) {
        timeline.push({
          status: String(status),
          at: now,
          by: user.email,
          note: String(note || `Status changed to ${status}`),
        });
      }

      db.prepare(
        `UPDATE orders
         SET status = ?, payment_status = ?, courier_name = ?, tracking_code = ?, internal_notes = ?, timeline_json = ?, updated_at = ?
         WHERE id = ?`
      ).run(
        String(status || existing.status),
        String(paymentStatus || "pending"),
        String(courierName || ""),
        String(trackingCode || ""),
        String(internalNotes || ""),
        JSON.stringify(timeline),
        now,
        String(id)
      );

      // When an order is marked as delivered, record customer's name on any Collection (1 of 1) products in the order
      if (status === "delivered" && existing.customer_name) {
        try {
          const orderItems = JSON.parse(existing.items_json) as { productId?: string }[];
          for (const item of orderItems) {
            if (item.productId) {
              db.prepare(
                `UPDATE products
                 SET status = 'sold', status_label = 'Acquired', stock_qty = 0, acquired_by = ?, updated_at = ?
                 WHERE id = ? AND collection_id != ''`
              ).run(existing.customer_name, now, item.productId);
            }
          }
          revalidatePath("/");
        } catch {
          // ignore parse error
        }
      }

      logAudit(user, "update_order", "order", String(id), `Status → ${status}, Payment → ${paymentStatus}`);
      return NextResponse.json({ ok: true });
    }

    // 1b. Resolve Customer Cancellation Request (approve or dismiss)
    if (action === "resolve_cancellation") {
      const { id, decision } = body;
      const existing = db
        .prepare("SELECT status, items_json, timeline_json FROM orders WHERE id = ?")
        .get(id) as { status: string; items_json: string; timeline_json: string } | undefined;
      if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

      let timeline: { status: string; at: string; by: string; note: string }[] = [];
      try {
        timeline = JSON.parse(existing.timeline_json);
      } catch {
        // ignore
      }

      if (decision === "approve") {
        timeline.push({
          status: "cancelled",
          at: now,
          by: user.email,
          note: "Customer cancellation request approved",
        });

        db.prepare(
          `UPDATE orders
           SET status = 'cancelled', cancellation_requested = 0, timeline_json = ?, updated_at = ?
           WHERE id = ?`
        ).run(JSON.stringify(timeline), now, String(id));

        // Restore stock for cancelled items
        try {
          const items = JSON.parse(existing.items_json) as { productId?: string; quantity?: number }[];
          for (const item of items) {
            if (!item.productId) continue;
            const prod = db
              .prepare("SELECT collection_id, stock_qty, low_stock_threshold FROM products WHERE id = ?")
              .get(item.productId) as
              | { collection_id: string; stock_qty: number; low_stock_threshold: number }
              | undefined;
            if (!prod) continue;
            if (prod.collection_id) {
              db.prepare(
                "UPDATE products SET status = 'ready', status_label = 'One of One', stock_qty = 1, acquired_by = '', updated_at = ? WHERE id = ?"
              ).run(now, item.productId);
            } else {
              const restored = prod.stock_qty + (item.quantity || 1);
              const nextStatus = restored <= prod.low_stock_threshold ? "limited" : "ready";
              const nextLabel = restored <= prod.low_stock_threshold ? `Only ${restored} Left` : "In Stock";
              db.prepare(
                "UPDATE products SET status = ?, status_label = ?, stock_qty = ?, updated_at = ? WHERE id = ?"
              ).run(nextStatus, nextLabel, restored, now, item.productId);
            }
          }
          revalidatePath("/");
          revalidatePath("/shop");
        } catch {
          // ignore
        }

        logAudit(user, "approve_cancellation", "order", String(id), "Approved customer cancellation request");
      } else {
        timeline.push({
          status: existing.status,
          at: now,
          by: user.email,
          note: "Customer cancellation request dismissed",
        });

        db.prepare(
          `UPDATE orders
           SET cancellation_requested = 0, timeline_json = ?, updated_at = ?
           WHERE id = ?`
        ).run(JSON.stringify(timeline), now, String(id));

        logAudit(user, "dismiss_cancellation", "order", String(id), "Dismissed customer cancellation request");
      }

      return NextResponse.json({ ok: true });
    }

    // 2. Save Customer CRM Note / VIP tag (allowed for all staff)
    if (action === "save_customer_note") {
      const { phone, tags, notes, vip } = body;
      const cleanPhone = String(phone || "").replace(/[\s-]/g, "");
      db.prepare(
        `INSERT INTO customer_notes (phone, tags, notes, vip, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(phone) DO UPDATE SET
           tags = excluded.tags,
           notes = excluded.notes,
           vip = excluded.vip,
           updated_at = excluded.updated_at`
      ).run(cleanPhone, String(tags || ""), String(notes || ""), vip ? 1 : 0, now);

      logAudit(user, "save_customer_note", "customer", cleanPhone, `Updated CRM tags/notes`);
      return NextResponse.json({ ok: true });
    }

    // 3. Update Lead Status (allowed for all staff)
    if (action === "update_lead") {
      const { id, status, notes } = body;
      db.prepare("UPDATE leads SET status = ?, notes = ? WHERE id = ?").run(
        String(status || "contacted"),
        String(notes || ""),
        Number(id)
      );
      logAudit(user, "update_lead", "lead", String(id), `Status → ${status}`);
      return NextResponse.json({ ok: true });
    }

    // 3a-waitlist. Mark Waitlist Piece Sold to a Waitlist Customer
    if (action === "mark_waitlist_sold") {
      const { leadId, productId, customerName } = body;
      if (!leadId || !productId) {
        return NextResponse.json({ error: "Lead ID and Product ID are required" }, { status: 400 });
      }
      db.prepare(
        `UPDATE products
         SET status = 'sold', status_label = 'Acquired', stock_qty = 0, acquired_by = ?, updated_at = ?
         WHERE id = ?`
      ).run(String(customerName || ""), now, String(productId));
      db.prepare("UPDATE leads SET status = 'converted', notes = ? WHERE id = ?").run(
        `Sold to waitlist customer ${customerName || ""}`,
        Number(leadId)
      );
      logAudit(user, "mark_waitlist_sold", "product", String(productId), `Marked sold to waitlist lead #${leadId} (${customerName})`);
      revalidatePath("/");
      revalidatePath("/shop");
      revalidatePath("/drops");
      revalidatePath(`/pieces/${productId}`);
      return NextResponse.json({ ok: true });
    }

    // Everything below requires owner or manager
    if (user.role === "support") {
      return NextResponse.json({ error: "Support role cannot modify catalog or settings" }, { status: 403 });
    }

    // 3a. Save or Delete Category
    if (action === "save_category") {
      const c = body.category;
      if (!c || !c.name) {
        return NextResponse.json({ error: "Category name is required" }, { status: 400 });
      }
      const slug =
        String(c.id || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-") ||
        String(c.shortName || c.name)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

      db.prepare(
        `INSERT INTO categories (id, short_name, name, bengali_name, subtitle, sort_order, active, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           short_name = excluded.short_name,
           name = excluded.name,
           bengali_name = excluded.bengali_name,
           subtitle = excluded.subtitle,
           sort_order = excluded.sort_order,
           active = excluded.active,
           updated_at = excluded.updated_at`
      ).run(
        slug,
        String(c.shortName || c.name.split(" ")[0]),
        String(c.name),
        String(c.bengaliName || c.name),
        String(c.subtitle || ""),
        Number(c.sortOrder ?? 1),
        c.active === false ? 0 : 1,
        now
      );

      logAudit(user, "save_category", "category", slug, `Saved category "${c.name}"`);
      revalidatePath("/");
      return NextResponse.json({ ok: true, id: slug });
    }

    if (action === "delete_category") {
      const id = String(body.id || "");
      db.prepare("DELETE FROM categories WHERE id = ?").run(id);
      logAudit(user, "delete_category", "category", id, `Deleted category ${id}`);
      revalidatePath("/");
      return NextResponse.json({ ok: true });
    }

    // 3b. Save (Create or Update) Collection (Exclusive Drop)
    if (action === "save_collection") {
      const c = body.collection;
      if (!c || !c.title) {
        return NextResponse.json({ error: "Collection title is required" }, { status: 400 });
      }
      const slug =
        String(c.id || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-") ||
        String(c.dropNumber || c.shortName || c.title)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

      const heroImg = String(c.heroImage || "/images/hero-courtyard.png");
      const bannerImg = String(c.bannerImage || heroImg);
      const dropStatus = ["upcoming", "prebooking", "live", "archived"].includes(c.dropStatus)
        ? c.dropStatus
        : "live";

      db.prepare(
        `INSERT INTO collections (
          id, drop_number, short_name, title, bengali_title, subtitle, description, story,
          craft_metric, price_range, hero_image, banner_image, accent_hex,
          exclusivity, drop_status, release_date, sort_order, active, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'one_of_one', ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          drop_number = excluded.drop_number,
          short_name = excluded.short_name,
          title = excluded.title,
          bengali_title = excluded.bengali_title,
          subtitle = excluded.subtitle,
          description = excluded.description,
          story = excluded.story,
          craft_metric = excluded.craft_metric,
          price_range = excluded.price_range,
          hero_image = excluded.hero_image,
          banner_image = excluded.banner_image,
          accent_hex = excluded.accent_hex,
          exclusivity = 'one_of_one',
          drop_status = excluded.drop_status,
          release_date = excluded.release_date,
          sort_order = excluded.sort_order,
          active = excluded.active,
          updated_at = excluded.updated_at`
      ).run(
        slug,
        String(c.dropNumber || "Drop 01"),
        String(c.shortName || c.dropNumber || c.title.split(" ")[0]),
        String(c.title),
        String(c.bengaliTitle || c.title),
        String(c.subtitle || ""),
        String(c.description || ""),
        String(c.story || c.description || ""),
        String(c.craftMetric || "Exclusive 1-of-1 Drop · Handcrafted in Bangladesh"),
        String(c.priceRange || "৳ 6,500+"),
        heroImg,
        bannerImg,
        String(c.accentHex || "#B08A4F"),
        dropStatus,
        String(c.releaseDate || "Live Now"),
        Number(c.sortOrder ?? 1),
        c.active === false ? 0 : 1,
        now
      );

      logAudit(user, "save_collection", "collection", slug, `Saved collection "${c.title}" (${dropStatus})`);
      revalidatePath("/");
      revalidatePath(`/collections/${slug}`);
      return NextResponse.json({ ok: true, id: slug });
    }

    // 3c. Delete Collection
    if (action === "delete_collection") {
      const id = String(body.id || "");
      db.prepare("UPDATE products SET collection_id = '' WHERE collection_id = ?").run(id);
      db.prepare("DELETE FROM collections WHERE id = ?").run(id);
      logAudit(user, "delete_collection", "collection", id, `Deleted collection ${id}`);
      revalidatePath("/");
      return NextResponse.json({ ok: true });
    }

    // 4. Save (Create or Update) Product
    if (action === "save_product") {
      const p = body.product;
      if (!p || !p.name) {
        return NextResponse.json({ error: "Product name is required" }, { status: 400 });
      }
      const slug =
        String(p.id || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-") ||
        p.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

      const collectionId = String(p.collectionId || "").trim();
      const isCollectionPiece = Boolean(collectionId);
      const acquiredBy = isCollectionPiece ? String(p.acquiredBy || "").trim() : "";
      const stockQty = isCollectionPiece
        ? p.status === "sold"
          ? 0
          : 1
        : Math.max(0, Number(p.stockQty ?? 5));

      const statusVal =
        !isCollectionPiece && stockQty === 0
          ? "sold"
          : String(p.status || "ready");

      const statusLabelVal = isCollectionPiece
        ? statusVal === "sold"
          ? "Acquired"
          : String(p.statusLabel || "One of One")
        : stockQty === 0
        ? "Sold Out"
        : stockQty <= Number(p.lowStockThreshold ?? 2)
        ? `Only ${stockQty} Left`
        : String(p.statusLabel || "In Stock");

      const colors = Array.isArray(p.colors) && p.colors.length > 0 ? p.colors : [{ name: "Signature", hex: "#B08A4F" }];
      const gallery = Array.isArray(p.gallery) && p.gallery.length > 0 ? p.gallery : [p.image || "/images/hero-courtyard.png"];

      db.prepare(
        `INSERT INTO products (
          id, sku, name, bengali_name, category, collection_id, acquired_by, price_bdt, original_price_bdt,
          cost_bdt, stock_qty, low_stock_threshold, status, status_label, region,
          artisan_hours, artisan_hours_label, materials, dimensions, story, care,
          image, gallery_json, accent_color, colors_json, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          sku = excluded.sku,
          name = excluded.name,
          bengali_name = excluded.bengali_name,
          category = excluded.category,
          collection_id = excluded.collection_id,
          acquired_by = excluded.acquired_by,
          price_bdt = excluded.price_bdt,
          original_price_bdt = excluded.original_price_bdt,
          cost_bdt = excluded.cost_bdt,
          stock_qty = excluded.stock_qty,
          low_stock_threshold = excluded.low_stock_threshold,
          status = excluded.status,
          status_label = excluded.status_label,
          region = excluded.region,
          artisan_hours = excluded.artisan_hours,
          artisan_hours_label = excluded.artisan_hours_label,
          materials = excluded.materials,
          dimensions = excluded.dimensions,
          story = excluded.story,
          care = excluded.care,
          image = excluded.image,
          gallery_json = excluded.gallery_json,
          accent_color = excluded.accent_color,
          colors_json = excluded.colors_json,
          updated_at = excluded.updated_at`
      ).run(
        slug,
        String(p.sku || `NK-${slug.slice(0, 6).toUpperCase()}`),
        String(p.name),
        String(p.bengaliName || p.name),
        String(p.category || "light-shades"),
        collectionId,
        acquiredBy,
        Number(p.priceBDT || 0),
        p.originalPriceBDT ? Number(p.originalPriceBDT) : null,
        Number(p.costBDT || 0),
        stockQty,
        Number(p.lowStockThreshold ?? 2),
        statusVal,
        statusLabelVal,
        String(p.region || "Bangladesh"),
        Number(p.artisanHours || 40),
        String(p.artisanHoursLabel || `${p.artisanHours || 40} Hours Handcrafted`),
        String(p.materials || ""),
        String(p.dimensions || ""),
        String(p.story || ""),
        String(p.care || ""),
        String(p.image || "/images/hero-courtyard.png"),
        JSON.stringify(gallery),
        String(p.accentColor || "#B08A4F"),
        JSON.stringify(colors),
        now
      );

      logAudit(user, "save_product", "product", slug, `Saved product "${p.name}" (৳${p.priceBDT}, stock: ${stockQty}, collection: ${collectionId || "store"})`);
      revalidatePath("/");
      revalidatePath(`/pieces/${slug}`);
      if (collectionId) revalidatePath(`/collections/${collectionId}`);
      return NextResponse.json({ ok: true, id: slug });
    }

    // 5. Delete Product
    if (action === "delete_product") {
      const id = String(body.id || "");
      db.prepare("DELETE FROM products WHERE id = ?").run(id);
      logAudit(user, "delete_product", "product", id, `Deleted product ${id}`);
      revalidatePath("/");
      return NextResponse.json({ ok: true });
    }

    // 6. Save Promo Code
    if (action === "save_promo") {
      const code = String(body.code || "").trim().toUpperCase();
      if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });
      db.prepare(
        `INSERT INTO promo_codes (code, discount_type, discount_value, min_order_bdt, max_uses, label, active, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(code) DO UPDATE SET
           discount_type = excluded.discount_type,
           discount_value = excluded.discount_value,
           min_order_bdt = excluded.min_order_bdt,
           max_uses = excluded.max_uses,
           label = excluded.label,
           active = excluded.active,
           expires_at = excluded.expires_at`
      ).run(
        code,
        body.discountType === "fixed" ? "fixed" : "percent",
        Number(body.discountValue || 10),
        Number(body.minOrderBDT || 0),
        Number(body.maxUses || 0),
        String(body.label || `${body.discountValue}% Courtesy`),
        body.active === false ? 0 : 1,
        body.expiresAt ? String(body.expiresAt) : null,
        now
      );
      logAudit(user, "save_promo", "promo_code", code, `Saved promo ${code} (${body.discountValue} ${body.discountType})`);
      return NextResponse.json({ ok: true });
    }

    // 7. Delete Promo Code
    if (action === "delete_promo") {
      const code = String(body.code || "").trim().toUpperCase();
      db.prepare("DELETE FROM promo_codes WHERE code = ?").run(code);
      logAudit(user, "delete_promo", "promo_code", code, `Deleted promo ${code}`);
      return NextResponse.json({ ok: true });
    }

    // 8. Save Site Content
    if (action === "save_content") {
      const updates = body.content as Record<string, string>;
      if (updates && typeof updates === "object") {
        const up = db.prepare(
          `INSERT INTO site_content (key, value, updated_at) VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
        );
        const tx = db.transaction(() => {
          for (const [k, v] of Object.entries(updates)) {
            up.run(k, String(v), now);
          }
        });
        tx();
        logAudit(user, "save_content", "site_content", "global", `Updated site content settings`);
        revalidatePath("/");
        revalidatePath("/about");
        revalidatePath("/drops");
        revalidatePath("/shop");
      }
      return NextResponse.json({ ok: true });
    }

    // 8b. Clear Demo Data (Owner only)
    if (action === "clear_demo_data") {
      if (user.role !== "owner") {
        return NextResponse.json({ error: "Only Owner can clear demo data" }, { status: 403 });
      }
      const includeCatalog = Boolean(body.includeCatalog);
      clearDemoData(includeCatalog);
      logAudit(
        user,
        "clear_demo_data",
        "database",
        "all",
        includeCatalog
          ? "Cleared all demo orders, leads, analytics, and sample catalog"
          : "Cleared all demo orders, leads, abandoned carts, and analytics counters (reset to 0)"
      );
      revalidatePath("/");
      revalidatePath("/shop");
      revalidatePath("/drops");
      return NextResponse.json({ ok: true });
    }

    // 9. Staff management (Owner only)
    if (action === "save_staff" || action === "toggle_staff" || action === "delete_staff") {
      if (user.role !== "owner") {
        return NextResponse.json({ error: "Only Owner can manage staff accounts" }, { status: 403 });
      }
      if (action === "save_staff") {
        const email = String(body.email || "").trim().toLowerCase();
        const name = String(body.name || "").trim();
        const role = ["owner", "manager", "support"].includes(body.role) ? body.role : "support";
        const password = String(body.password || "");
        if (!email || !name) {
          return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
        }
        const existing = db.prepare("SELECT id FROM staff_users WHERE lower(email) = ?").get(email) as { id: number } | undefined;
        if (existing) {
          if (password) {
            db.prepare("UPDATE staff_users SET name = ?, role = ?, password_hash = ? WHERE id = ?").run(
              name,
              role,
              hashPassword(password),
              existing.id
            );
          } else {
            db.prepare("UPDATE staff_users SET name = ?, role = ? WHERE id = ?").run(name, role, existing.id);
          }
          logAudit(user, "update_staff", "staff_user", email, `Updated staff ${email} (${role})`);
        } else {
          if (!password) {
            return NextResponse.json({ error: "Password is required for new staff" }, { status: 400 });
          }
          db.prepare(
            "INSERT INTO staff_users (name, email, password_hash, role, active, created_at) VALUES (?, ?, ?, ?, 1, ?)"
          ).run(name, email, hashPassword(password), role, now);
          logAudit(user, "create_staff", "staff_user", email, `Created staff ${email} (${role})`);
        }
        return NextResponse.json({ ok: true });
      }
      if (action === "toggle_staff") {
        const id = Number(body.id);
        const active = body.active ? 1 : 0;
        db.prepare("UPDATE staff_users SET active = ? WHERE id = ?").run(active, id);
        logAudit(user, "toggle_staff", "staff_user", String(id), `Set active=${active}`);
        return NextResponse.json({ ok: true });
      }
      if (action === "delete_staff") {
        const id = Number(body.id);
        if (id === user.id) {
          return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
        }
        db.prepare("DELETE FROM staff_users WHERE id = ?").run(id);
        logAudit(user, "delete_staff", "staff_user", String(id), `Deleted staff #${id}`);
        return NextResponse.json({ ok: true });
      }
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("POST /api/admin/data error:", err);
    return NextResponse.json({ error: "Failed to save changes" }, { status: 500 });
  }
}
