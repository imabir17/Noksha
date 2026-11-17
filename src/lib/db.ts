import Database from "better-sqlite3";
import fs from "fs";
import os from "os";
import path from "path";
import { DropStatus, NOKSHA_PRODUCTS, NokshaProduct, PillarId, ProductStatus } from "@/data/nokshaData";
import { hashPassword, SessionUser, StaffRole } from "./auth";

function resolveDataDir(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join(os.tmpdir(), "noksha-data");
  }
  return path.join(process.cwd(), "data");
}

function openSqliteDb(): Database.Database {
  const primaryDir = resolveDataDir();
  try {
    if (!fs.existsSync(primaryDir)) {
      fs.mkdirSync(primaryDir, { recursive: true });
    }
    return new Database(path.join(primaryDir, "noksha.db"));
  } catch {
    const fallbackDir = path.join(os.tmpdir(), "noksha-data");
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true });
    }
    return new Database(path.join(fallbackDir, "noksha.db"));
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __nokshaDb: Database.Database | undefined;
  // eslint-disable-next-line no-var
  var __nokshaDbVer: number | undefined;
}

const DB_SCHEMA_VERSION = 7;

export function getDb(): Database.Database {
  if (global.__nokshaDb) {
    if (global.__nokshaDbVer !== DB_SCHEMA_VERSION) {
      initSchema(global.__nokshaDb);
      seedIfNeeded(global.__nokshaDb);
      global.__nokshaDbVer = DB_SCHEMA_VERSION;
    }
    return global.__nokshaDb;
  }
  const db = openSqliteDb();
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  initSchema(db);
  seedIfNeeded(db);
  global.__nokshaDb = db;
  global.__nokshaDbVer = DB_SCHEMA_VERSION;
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'support',
      active INTEGER NOT NULL DEFAULT 1,
      last_login_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES staff_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT NOT NULL,
      name TEXT NOT NULL,
      bengali_name TEXT NOT NULL,
      category TEXT NOT NULL,
      price_bdt INTEGER NOT NULL,
      original_price_bdt INTEGER,
      cost_bdt INTEGER NOT NULL DEFAULT 0,
      stock_qty INTEGER NOT NULL DEFAULT 5,
      low_stock_threshold INTEGER NOT NULL DEFAULT 2,
      status TEXT NOT NULL DEFAULT 'ready',
      status_label TEXT NOT NULL DEFAULT 'Available',
      region TEXT NOT NULL DEFAULT 'Bangladesh',
      artisan_hours INTEGER NOT NULL DEFAULT 40,
      artisan_hours_label TEXT NOT NULL DEFAULT '40 Hours Handcrafted',
      materials TEXT NOT NULL DEFAULT '',
      dimensions TEXT NOT NULL DEFAULT '',
      story TEXT NOT NULL DEFAULT '',
      care TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL,
      gallery_json TEXT NOT NULL DEFAULT '[]',
      accent_color TEXT NOT NULL DEFAULT '#B08A4F',
      colors_json TEXT NOT NULL DEFAULT '[]',
      views_count INTEGER NOT NULL DEFAULT 0,
      add_to_bag_count INTEGER NOT NULL DEFAULT 0,
      orders_count INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS promo_codes (
      code TEXT PRIMARY KEY,
      discount_type TEXT NOT NULL DEFAULT 'percent',
      discount_value REAL NOT NULL,
      min_order_bdt INTEGER NOT NULL DEFAULT 0,
      max_uses INTEGER NOT NULL DEFAULT 0,
      used_count INTEGER NOT NULL DEFAULT 0,
      label TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      expires_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT NOT NULL DEFAULT '',
      district TEXT NOT NULL,
      address TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      trx_id TEXT NOT NULL DEFAULT '',
      gift_note TEXT NOT NULL DEFAULT '',
      promo_code TEXT NOT NULL DEFAULT '',
      subtotal_bdt INTEGER NOT NULL,
      discount_bdt INTEGER NOT NULL DEFAULT 0,
      delivery_bdt INTEGER NOT NULL DEFAULT 0,
      total_bdt INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      courier_name TEXT NOT NULL DEFAULT '',
      tracking_code TEXT NOT NULL DEFAULT '',
      internal_notes TEXT NOT NULL DEFAULT '',
      items_json TEXT NOT NULL,
      timeline_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customer_notes (
      phone TEXT PRIMARY KEY,
      tags TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      vip INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      product_id TEXT NOT NULL DEFAULT '',
      product_name TEXT NOT NULL DEFAULT '',
      courtesy_code TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS abandoned_checkouts (
      session_id TEXT PRIMARY KEY,
      visitor_id TEXT NOT NULL DEFAULT '',
      customer_name TEXT NOT NULL DEFAULT '',
      customer_phone TEXT NOT NULL DEFAULT '',
      customer_email TEXT NOT NULL DEFAULT '',
      district TEXT NOT NULL DEFAULT 'Dhaka',
      address TEXT NOT NULL DEFAULT '',
      last_step TEXT NOT NULL DEFAULT 'bag_opened',
      items_json TEXT NOT NULL DEFAULT '[]',
      subtotal_bdt INTEGER NOT NULL DEFAULT 0,
      recovered INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visitor_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      path TEXT NOT NULL DEFAULT '/',
      product_id TEXT NOT NULL DEFAULT '',
      step TEXT NOT NULL DEFAULT '',
      referrer TEXT NOT NULL DEFAULT 'Direct',
      device TEXT NOT NULL DEFAULT 'desktop',
      duration_ms INTEGER NOT NULL DEFAULT 0,
      meta_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS site_content (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      drop_number TEXT NOT NULL DEFAULT 'Drop 01',
      drop_status TEXT NOT NULL DEFAULT 'live',
      release_date TEXT NOT NULL DEFAULT 'Live Now',
      short_name TEXT NOT NULL,
      title TEXT NOT NULL,
      bengali_title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      description TEXT NOT NULL,
      story TEXT NOT NULL,
      craft_metric TEXT NOT NULL DEFAULT 'Handcrafted in Bangladesh',
      price_range TEXT NOT NULL DEFAULT '৳ 4,500+',
      hero_image TEXT NOT NULL,
      banner_image TEXT NOT NULL,
      accent_hex TEXT NOT NULL DEFAULT '#B08A4F',
      exclusivity TEXT NOT NULL DEFAULT 'one_of_one',
      sort_order INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      short_name TEXT NOT NULL,
      name TEXT NOT NULL,
      bengali_name TEXT NOT NULL,
      subtitle TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );
  `);

  // Safe column migrations for existing noksha.db
  const ensureCol = (table: string, col: string, def: string) => {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!cols.some((c) => c.name === col)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
    }
  };
  ensureCol("collections", "drop_number", "TEXT NOT NULL DEFAULT 'Drop 01'");
  ensureCol("collections", "drop_status", "TEXT NOT NULL DEFAULT 'live'");
  ensureCol("collections", "release_date", "TEXT NOT NULL DEFAULT 'Live Now'");
  ensureCol("products", "collection_id", "TEXT NOT NULL DEFAULT ''");
  ensureCol("products", "acquired_by", "TEXT NOT NULL DEFAULT ''");
}

function seedIfNeeded(db: Database.Database) {
  const now = new Date().toISOString();

  // 1. Seed staff accounts
  const userCount = (db.prepare("SELECT COUNT(*) as c FROM staff_users").get() as { c: number }).c;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO staff_users (name, email, password_hash, role, active, created_at)
      VALUES (?, ?, ?, ?, 1, ?)
    `);
    insertUser.run("Sheikh Abir (Owner)", "owner@noksha.bd", hashPassword("NokshaOwner2026!"), "owner", now);
    insertUser.run("Nusrat Jahan (Atelier Manager)", "manager@noksha.bd", hashPassword("NokshaManager2026!"), "manager", now);
    insertUser.run("Tanvir Ahmed (Client Care)", "support@noksha.bd", hashPassword("NokshaSupport2026!"), "support", now);
  }

  // 1a. Seed categories (Light Shades, Nakshi Kanthas, Wooden Jewelry Boxes, etc.)
  const catCount = (db.prepare("SELECT COUNT(*) as c FROM categories").get() as { c: number }).c;
  if (catCount === 0) {
    const insertCat = db.prepare(`
      INSERT INTO categories (id, short_name, name, bengali_name, subtitle, sort_order, active, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `);
    insertCat.run("light-shades", "Alo", "Light Shades", "আলোর ছায়া", "Woven Bamboo, Jamdani & Terracotta Lighting", 1, now);
    insertCat.run("nakshi-kantha", "Kantha", "Nakshi Kanthas", "নকশিকাঁথা", "Hand-Stitched Story Quilts & Throws", 2, now);
    insertCat.run("jewelry-boxes", "Boxes", "Wooden Jewelry Boxes", "কাঠের গহনার বাক্স", "Hand-Carved Timber & Alpona Brass Chests", 3, now);
  } else {
    db.prepare(
      "UPDATE categories SET short_name = 'Boxes', name = 'Wooden Jewelry Boxes', bengali_name = 'কাঠের গহনার বাক্স' WHERE id = 'jewelry-boxes'"
    ).run();
  }

  // 1b. Seed or upgrade exclusive collections (Drop 01, Drop 02, Drop 03)
  const hasDrop01 = db.prepare("SELECT id FROM collections WHERE id = 'drop-01'").get();
  if (!hasDrop01) {
    db.prepare("DELETE FROM collections WHERE id IN ('light-shades', 'nakshi-kantha', 'jewelry-boxes')").run();
    const insertCol = db.prepare(`
      INSERT OR REPLACE INTO collections (
        id, drop_number, drop_status, release_date, short_name, title, bengali_title,
        subtitle, description, story, craft_metric, price_range, hero_image, banner_image,
        accent_hex, exclusivity, sort_order, active, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'one_of_one', ?, 1, ?)
    `);

    insertCol.run(
      "drop-01",
      "Drop 01",
      "live",
      "Live Now",
      "Shonar Bangla",
      "Shonar Bangla Inaugural Drop",
      "প্রথম সম্ভার — সোনার বাংলা",
      "One-of-One Inaugural Collector Release",
      "Our debut collector release of singular, one-of-a-kind Nakshi Kanthas, sculptural lanterns, and master-inlaid timber chests—each created once and never repeated.",
      "Drop 01 marks the inaugural release of Noksha’s one-of-one archive. Every piece in this drop was conceived and executed as a singular creation—from a 220-hour Rajshahi Alta Padma Kantha to a hand-painted Padmaboti rosewood chest.\n\nOnce a piece in an exclusive drop is acquired and delivered, it is permanently archived with its collector’s name and never reproduced.",
      "1 of 1 Exclusive Pieces",
      "৳ 11,900 – ৳ 15,800",
      "/images/kantha-crimson-padma.png",
      "/images/about-shital-pati.jpg",
      "#8C2F2F",
      1,
      now
    );

    insertCol.run(
      "drop-02",
      "Drop 02",
      "prebooking",
      "Open for Pre-Booking",
      "Monsoon & Bridal",
      "Monsoon & Bridal Collector Drop",
      "দ্বিতীয় সম্ভার — বর্ষা ও বিবাহ",
      "One-of-One Trousseau Kanthas & Architectural Chandeliers",
      "Exclusive one-of-one bridal tussar silk kanthas and tiered cane chandeliers currently on the final stage of handwork—open now for collector pre-booking.",
      "Conceived for wedding trousseaus and statement living rooms, Drop 02 pairs luminous Rajshahi tussar silk needlework with double-tiered architectural cane and brass lighting.\n\nBecause each piece is strictly one-of-one, collectors may pre-book their chosen piece before the drop formally opens.",
      "1 of 1 · Pre-Booking Open",
      "৳ 9,400 – ৳ 18,500",
      "/images/light-jamdani-pendant.png",
      "/images/artisan-hands.jpg",
      "#B9772C",
      2,
      now
    );

    insertCol.run(
      "drop-03",
      "Drop 03",
      "upcoming",
      "Preview · Launching Soon",
      "Zamindari Archive",
      "Zamindari Courtyard Drop",
      "তৃতীয় সম্ভার — জমিদার বাড়ি",
      "Upcoming Collector Release of Heirloom Timber & Indigo Stitch",
      "An upcoming study in deep river indigo, aged hardwood joinery, and brass filigree—previewing ahead of pre-booking.",
      "Inspired by the evening courtyards of historic Bengal estates, Drop 03 explores deep indigo kantha threadwork and brass-inlaid heirloom caskets.\n\nPreview the collection now; pre-booking dates are controlled from the Noksha Command Centre.",
      "1 of 1 · Upcoming Drop",
      "৳ 12,500 – ৳ 22,000",
      "/images/box-teak-brass.png",
      "/images/hero-courtyard.png",
      "#2F5D58",
      3,
      now
    );
  }

  // 2. Seed products from NOKSHA_PRODUCTS
  const prodCount = (db.prepare("SELECT COUNT(*) as c FROM products").get() as { c: number }).c;
  if (prodCount === 0) {
    const insertProd = db.prepare(`
      INSERT INTO products (
        id, sku, name, bengali_name, category, price_bdt, original_price_bdt,
        cost_bdt, stock_qty, low_stock_threshold, status, status_label, region,
        artisan_hours, artisan_hours_label, materials, dimensions, story, care,
        image, gallery_json, accent_color, colors_json,
        views_count, add_to_bag_count, orders_count, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `);

    const seedMetrics: Record<string, { views: number; bag: number; orders: number; stock: number; sku: string }> = {
      "alo-jamdani-pendant": { views: 342, bag: 48, orders: 14, stock: 7, sku: "NK-ALO-001" },
      "alo-terracotta-jali": { views: 289, bag: 39, orders: 11, stock: 2, sku: "NK-ALO-002" },
      "alo-veranda-chandelier": { views: 198, bag: 22, orders: 0, stock: 0, sku: "NK-ALO-003" },
      "kantha-alta-padma": { views: 512, bag: 64, orders: 1, stock: 1, sku: "NK-KNT-001" },
      "kantha-mayur-emerald": { views: 428, bag: 51, orders: 1, stock: 1, sku: "NK-KNT-002" },
      "kantha-tussar-bridal": { views: 376, bag: 37, orders: 0, stock: 0, sku: "NK-KNT-003" },
      "box-teak-brass": { views: 395, bag: 53, orders: 16, stock: 6, sku: "NK-SHN-001" },
      "box-rosewood-alpona": { views: 310, bag: 41, orders: 9, stock: 2, sku: "NK-SHN-002" },
      "box-kadam-sindoor": { views: 184, bag: 19, orders: 0, stock: 0, sku: "NK-SHN-003" },
    };

    for (const p of NOKSHA_PRODUCTS) {
      const m = seedMetrics[p.id] ?? { views: 120, bag: 15, orders: 3, stock: 5, sku: `NK-${p.id.slice(0, 6).toUpperCase()}` };
      const isKantha = p.category === "nakshi-kantha";
      insertProd.run(
        p.id,
        m.sku,
        p.name,
        p.bengaliName,
        p.category,
        p.priceBDT,
        p.originalPriceBDT ?? null,
        Math.round(p.priceBDT * 0.48),
        p.status === "waitlist" ? 0 : isKantha ? 1 : m.stock,
        isKantha ? 1 : 2,
        p.status,
        p.statusLabel,
        p.region,
        p.artisanHours,
        p.artisanHoursLabel,
        p.materials,
        p.dimensions,
        p.story,
        p.care,
        p.image,
        JSON.stringify([p.image]),
        p.accentColor,
        JSON.stringify(p.colors),
        m.views,
        m.bag,
        m.orders,
        now
      );
    }
  }

  // 2b. Ensure Collection Drop tags, Acquired attribution, and a regular multi-stock Kantha exist
  const altaKantha = db.prepare("SELECT collection_id, acquired_by FROM products WHERE id = 'kantha-alta-padma'").get() as
    | { collection_id: string; acquired_by: string }
    | undefined;
  if (altaKantha && !altaKantha.collection_id) {
    // Drop 01 pieces (1 of 1 Exclusive)
    db.prepare(
      "UPDATE products SET collection_id = 'drop-01', status = 'sold', status_label = 'Acquired', stock_qty = 0, acquired_by = 'Farhana Chowdhury' WHERE id = 'kantha-alta-padma'"
    ).run();
    db.prepare(
      "UPDATE products SET collection_id = 'drop-01', status = 'ready', status_label = 'One of One', stock_qty = 1 WHERE id = 'kantha-mayur-emerald'"
    ).run();
    db.prepare(
      "UPDATE products SET collection_id = 'drop-01', status = 'ready', status_label = 'One of One', stock_qty = 1 WHERE id = 'box-rosewood-alpona'"
    ).run();

    // Drop 02 pieces (1 of 1 Pre-Booking)
    db.prepare(
      "UPDATE products SET collection_id = 'drop-02', status = 'waitlist', status_label = 'Pre-Booking Open', stock_qty = 1 WHERE id = 'kantha-tussar-bridal'"
    ).run();
    db.prepare(
      "UPDATE products SET collection_id = 'drop-02', status = 'waitlist', status_label = 'Pre-Booking Open', stock_qty = 1 WHERE id = 'alo-veranda-chandelier'"
    ).run();

    // Regular Store Products (outside any collection -> multi-stock normal store)
    db.prepare(
      "UPDATE products SET collection_id = '', status = 'ready', status_label = 'In Stock', stock_qty = 12 WHERE id = 'alo-jamdani-pendant'"
    ).run();
    db.prepare(
      "UPDATE products SET collection_id = '', status = 'limited', status_label = 'Low Stock', stock_qty = 3 WHERE id = 'alo-terracotta-jali'"
    ).run();
    db.prepare(
      "UPDATE products SET collection_id = '', status = 'ready', status_label = 'In Stock', stock_qty = 9 WHERE id = 'box-teak-brass'"
    ).run();
    db.prepare(
      "UPDATE products SET collection_id = '', status = 'ready', status_label = 'In Stock', stock_qty = 6 WHERE id = 'box-kadam-sindoor'"
    ).run();

    // Add a regular store multi-stock Kantha throw so the Kanthas category also has a non-collection store item
    db.prepare(`
      INSERT OR IGNORE INTO products (
        id, sku, name, bengali_name, category, price_bdt, original_price_bdt,
        cost_bdt, stock_qty, low_stock_threshold, status, status_label, region,
        artisan_hours, artisan_hours_label, materials, dimensions, story, care,
        image, gallery_json, accent_color, colors_json,
        views_count, add_to_bag_count, orders_count, collection_id, acquired_by, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', ?)
    `).run(
      "kantha-kora-everyday",
      "NK-KNT-004",
      "Bishnupur Kora Cotton Running-Stitch Throw",
      "বিষ্ণুপুর কোরা সুতি কাঁথা",
      "nakshi-kantha",
      6800,
      null,
      3200,
      8,
      2,
      "ready",
      "In Stock",
      "Bangladesh",
      45,
      "45 Hours Hand-Stitched",
      "3-ply unbleached kora cotton, terracotta & indigo running stitch",
      "Sofa / Bed Throw • 155 cm × 215 cm",
      "Designed for everyday warmth across sofas and reading chairs, featuring classic rhythmic kantha wave stitching in terracotta and deep indigo on breathable kora cotton.",
      "Gentle cold wash with mild soap; dry flat in shade.",
      "/images/kantha-peacock-emerald.png",
      JSON.stringify(["/images/kantha-peacock-emerald.png"]),
      "#8C2F2F",
      JSON.stringify([
        { name: "Kora & Terracotta", hex: "#9A4A2F" },
        { name: "Indigo Stitch", hex: "#2F5D58" },
      ]),
      164,
      24,
      7,
      now
    );
  }

  // 3. Seed promo codes
  const promoCount = (db.prepare("SELECT COUNT(*) as c FROM promo_codes").get() as { c: number }).c;
  if (promoCount === 0) {
    const insertPromo = db.prepare(`
      INSERT INTO promo_codes (code, discount_type, discount_value, min_order_bdt, max_uses, used_count, label, active, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertPromo.run("SHUVO10", "percent", 10, 0, 500, 18, "10% Inaugural Launch Privilege", 1, null, now);
    insertPromo.run("FOUNDER15", "percent", 15, 12000, 100, 4, "15% Founding Collector Tier (Orders ≥ ৳12,000)", 1, null, now);
    insertPromo.run("DHAKA500", "fixed", 500, 6000, 200, 7, "৳500 Courtesy on Orders ≥ ৳6,000", 1, null, now);
  }

  // 4. Seed site content
  const contentCount = (db.prepare("SELECT COUNT(*) as c FROM site_content").get() as { c: number }).c;
  if (contentCount === 0) {
    const defaults: Record<string, string> = {
      announcement_enabled: "false",
      announcement_text: "Complimentary kora muslin wrapping on all Founding Batch orders · Code SHUVO10",
      hero_eyebrow: "The Inaugural Collection",
      hero_title_line1: "Heirlooms for the",
      hero_title_line2: "Bengali home.",
      hero_bengali: "আলো, সুতো ও কাঠের কাব্য",
      manifesto_eyebrow: "নকশা — meaning “design, pattern”",
      manifesto_body:
        "We began with three objects every Bengali home has always held dear — a lamp for the evening, a kantha for rest, and a carved box for what we cannot bear to lose. Each is made slowly, by hand, by Bangladeshi Artisans.",
      whatsapp_number: "8801973673217",
      merchant_number: "01700-665742",
      support_email: "atelier@noksha.bd",
      free_delivery_threshold: "8000",
      delivery_dhaka: "120",
      delivery_outside: "200",
    };
    const insertContent = db.prepare("INSERT INTO site_content (key, value, updated_at) VALUES (?, ?, ?)");
    for (const [k, v] of Object.entries(defaults)) {
      insertContent.run(k, v, now);
    }
  } else {
    db.prepare(
      "UPDATE site_content SET value = '8801973673217', updated_at = ? WHERE key = 'whatsapp_number' AND value = '8801700665742'"
    ).run(now);
  }

  // 5. Seed realistic orders, leads, abandoned carts & analytics if empty
  const orderCount = (db.prepare("SELECT COUNT(*) as c FROM orders").get() as { c: number }).c;
  if (orderCount === 0) {
    const d1 = new Date(Date.now() - 4 * 86400000).toISOString();
    const d2 = new Date(Date.now() - 2 * 86400000).toISOString();
    const d3 = new Date(Date.now() - 18 * 3600000).toISOString();
    const d4 = new Date(Date.now() - 3 * 3600000).toISOString();

    const insertOrder = db.prepare(`
      INSERT INTO orders (
        id, customer_name, customer_phone, customer_email, district, address, notes,
        payment_method, payment_status, trx_id, gift_note, promo_code,
        subtotal_bdt, discount_bdt, delivery_bdt, total_bdt,
        status, courier_name, tracking_code, internal_notes,
        items_json, timeline_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertOrder.run(
      "NK-84102",
      "Farhana Chowdhury",
      "01711-234567",
      "farhana.c@example.com",
      "Dhaka",
      "House 18, Road 55, Gulshan-2, Dhaka",
      "Leave with building concierge if in meeting",
      "bkash",
      "verified",
      "BGD94KL21M",
      "শুভ বিবাহবার্ষিকী — With love, Farhana",
      "SHUVO10",
      22250,
      2225,
      0,
      20025,
      "delivered",
      "Pathao Prime Courier",
      "PTH-BD-99281",
      "Repeat VIP collector; loves crimson & brass pieces.",
      JSON.stringify([
        {
          productId: "kantha-alta-padma",
          name: "Rajshahi Alta Padma Heirloom Kantha",
          category: "nakshi-kantha",
          priceBDT: 15800,
          quantity: 1,
          selectedColor: "Alta Crimson",
          image: "/images/kantha-crimson-padma.png",
        },
        {
          productId: "alo-jamdani-pendant",
          name: "Sonargaon Jamdani & Bamboo Dome Shade",
          category: "light-shades",
          priceBDT: 6450,
          quantity: 1,
          selectedColor: "Kora Ivory & Alta",
          image: "/images/light-jamdani-pendant.png",
        },
      ]),
      JSON.stringify([
        { status: "new", at: d1, by: "System", note: "Order placed online" },
        { status: "confirmed", at: d1, by: "owner@noksha.bd", note: "bKash TrxID verified" },
        { status: "packed", at: d2, by: "manager@noksha.bd", note: "Wrapped in kora muslin with calligraphy card" },
        { status: "shipped", at: d2, by: "manager@noksha.bd", note: "Dispatched via Pathao Prime" },
        { status: "delivered", at: d3, by: "support@noksha.bd", note: "Delivered and signed for" },
      ]),
      d1,
      d3
    );

    insertOrder.run(
      "NK-84119",
      "Tariqul Islam",
      "01819-876543",
      "tariq.islam@example.com",
      "Chattogram",
      "Flat 4B, Nasirabad Housing Society, Chattogram",
      "Call before arrival",
      "cod",
      "pending",
      "",
      "",
      "",
      15600,
      0,
      0,
      15600,
      "shipped",
      "Steadfast Curated",
      "SF-CTG-44210",
      "Confirmed via phone call.",
      JSON.stringify([
        {
          productId: "box-teak-brass",
          name: "Shegun & Kansa Alpona Inlay Jewelry Chest",
          category: "jewelry-boxes",
          priceBDT: 7800,
          quantity: 2,
          selectedColor: "Chattogram Teak",
          image: "/images/box-teak-brass.png",
        },
      ]),
      JSON.stringify([
        { status: "new", at: d2, by: "System", note: "Order placed online" },
        { status: "confirmed", at: d2, by: "support@noksha.bd", note: "Confirmed recipient address by phone" },
        { status: "packed", at: d3, by: "manager@noksha.bd", note: "Double-boxed for Chattogram transit" },
        { status: "shipped", at: d3, by: "manager@noksha.bd", note: "Handed to Steadfast Curated" },
      ]),
      d2,
      d3
    );

    insertOrder.run(
      "NK-84135",
      "Samira Huq",
      "01911-334455",
      "samira.huq@example.com",
      "Dhaka",
      "Road 11, Banani, Dhaka",
      "",
      "bkash",
      "verified",
      "BGD88TX10P",
      "For Ammu's birthday",
      "SHUVO10",
      11900,
      1190,
      0,
      10710,
      "confirmed",
      "",
      "",
      "Calligraphy card written in Bengali.",
      JSON.stringify([
        {
          productId: "box-rosewood-alpona",
          name: "Padmaboti Multi-Tier Rosewood & Kadam Chest",
          category: "jewelry-boxes",
          priceBDT: 11900,
          quantity: 1,
          selectedColor: "Aged Rosewood",
          image: "/images/box-rosewood-alpona.png",
        },
      ]),
      JSON.stringify([
        { status: "new", at: d3, by: "System", note: "Order placed online" },
        { status: "confirmed", at: d3, by: "owner@noksha.bd", note: "Payment verified" },
      ]),
      d3,
      d3
    );

    insertOrder.run(
      "NK-84148",
      "Zarina Kabir",
      "01755-667788",
      "zarina.k@example.com",
      "Sylhet",
      "Zindabazar, Sylhet",
      "Please wrap carefully",
      "cod",
      "pending",
      "",
      "",
      "",
      4850,
      0,
      200,
      5050,
      "new",
      "",
      "",
      "",
      JSON.stringify([
        {
          productId: "alo-terracotta-jali",
          name: "Padma Terracotta & Brass Jali Table Lantern",
          category: "light-shades",
          priceBDT: 4850,
          quantity: 1,
          selectedColor: "Terracotta Clay",
          image: "/images/light-terracotta-jali.png",
        },
      ]),
      JSON.stringify([{ status: "new", at: d4, by: "System", note: "Order placed online" }]),
      d4,
      d4
    );

    // Seed leads
    const insertLead = db.prepare(`
      INSERT INTO leads (type, name, phone, email, product_id, product_name, courtesy_code, status, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertLead.run("waitlist", "Mehnaz Tabassum", "01712-998877", "mehnaz@example.com", "kantha-tussar-bridal", "Shonar Bangla Bridal Silk-Blend Kantha", "", "new", "Interested for December wedding trousseau", d2);
    insertLead.run("waitlist", "Rafiq Azad", "01811-445566", "rafiq@example.com", "alo-veranda-chandelier", "Barandah Tiered Cane & Brass Pendant", "", "contacted", "Needs 2 units for dining space", d3);
    insertLead.run("founding_circle", "Anika Rahman", "01799-112233", "anika.r@example.com", "", "Founding Circle No. 108", "SHUVO10", "new", "Joined Founding Circle", d3);
    insertLead.run("newsletter", "", "", "collector.dhaka@example.com", "", "Letters from the looms", "", "new", "Footer journal signup", d4);

    // Seed abandoned checkouts
    const insertAbandoned = db.prepare(`
      INSERT INTO abandoned_checkouts (
        session_id, visitor_id, customer_name, customer_phone, customer_email,
        district, address, last_step, items_json, subtotal_bdt, recovered, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertAbandoned.run(
      "sess_abn_01",
      "vis_901",
      "Sadia Afrin",
      "01722-889900",
      "sadia.afrin@example.com",
      "Dhaka",
      "Dhanmondi Road 9A",
      "payment_selected",
      JSON.stringify([
        { name: "Moyurakshi Emerald & Ivory Peacock Kantha", priceBDT: 13200, quantity: 1, selectedColor: "Padma Emerald" },
      ]),
      13200,
      0,
      d3
    );
    insertAbandoned.run(
      "sess_abn_02",
      "vis_902",
      "Imran Hossain",
      "01611-556677",
      "",
      "Dhaka",
      "",
      "recipient_filled",
      JSON.stringify([
        { name: "Sonargaon Jamdani & Bamboo Dome Shade", priceBDT: 6450, quantity: 2, selectedColor: "Kora Ivory & Alta" },
      ]),
      12900,
      0,
      d4
    );

    // Seed baseline analytics events across last 7 days so charts, top pages, exit steps & funnels are rich immediately
    const insertEvent = db.prepare(`
      INSERT INTO analytics_events (
        visitor_id, session_id, event_type, path, product_id, step, referrer, device, duration_ms, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const referrers = ["Instagram", "Direct", "WhatsApp", "Facebook", "Google Search"];
    const paths = [
      "/",
      "/pieces/kantha-alta-padma",
      "/pieces/kantha-mayur-emerald",
      "/pieces/box-teak-brass",
      "/pieces/alo-jamdani-pendant",
      "/pieces/box-rosewood-alpona",
      "/pieces/alo-terracotta-jali",
      "/pieces/kantha-tussar-bridal",
      "/checkout",
    ];

    const seedTx = db.transaction(() => {
      for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
        const sessionsToday = 24 + (6 - dayOffset) * 5;
        for (let s = 0; s < sessionsToday; s++) {
          const visId = `vis_seed_${dayOffset}_${s}`;
          const sessId = `sess_seed_${dayOffset}_${s}`;
          const ref = referrers[(s + dayOffset) % referrers.length];
          const dev = s % 3 === 0 ? "desktop" : "mobile";
          const ts = new Date(Date.now() - dayOffset * 86400000 - (s % 12) * 3600000).toISOString();

          // Landing page view
          insertEvent.run(visId, sessId, "page_view", "/", "", "landing", ref, dev, 42000, ts);

          // 72% view a product page
          if (s % 10 < 7) {
            const pPath = paths[1 + ((s + dayOffset) % 7)];
            const pId = pPath.replace("/pieces/", "");
            insertEvent.run(visId, sessId, "product_view", pPath, pId, "product_detail", ref, dev, 68000, ts);

            // 32% add to bag
            if (s % 10 < 3) {
              insertEvent.run(visId, sessId, "add_to_bag", pPath, pId, "bag_opened", ref, dev, 15000, ts);

              // 20% start checkout
              if (s % 10 < 2) {
                insertEvent.run(visId, sessId, "checkout_step", "/checkout", pId, "checkout_viewed", ref, dev, 25000, ts);
                if (s % 15 !== 0) {
                  insertEvent.run(visId, sessId, "checkout_step", "/checkout", pId, "recipient_filled", ref, dev, 22000, ts);
                } else {
                  insertEvent.run(visId, sessId, "page_exit", "/checkout", pId, "checkout_viewed", ref, dev, 25000, ts);
                  continue;
                }
                if (s % 12 !== 0) {
                  insertEvent.run(visId, sessId, "checkout_step", "/checkout", pId, "delivery_filled", ref, dev, 19000, ts);
                } else {
                  insertEvent.run(visId, sessId, "page_exit", "/checkout", pId, "recipient_filled", ref, dev, 22000, ts);
                  continue;
                }
                if (s % 10 === 0) {
                  insertEvent.run(visId, sessId, "checkout_step", "/checkout", pId, "payment_selected", ref, dev, 18000, ts);
                  insertEvent.run(visId, sessId, "order_placed", "/checkout", pId, "order_completed", ref, dev, 12000, ts);
                } else {
                  insertEvent.run(visId, sessId, "page_exit", "/checkout", pId, "delivery_filled", ref, dev, 19000, ts);
                }
              } else {
                insertEvent.run(visId, sessId, "page_exit", pPath, pId, "bag_opened", ref, dev, 15000, ts);
              }
            } else {
              insertEvent.run(visId, sessId, "page_exit", pPath, pId, "product_detail", ref, dev, 68000, ts);
            }
          } else {
            insertEvent.run(visId, sessId, "page_exit", "/", "", "landing", ref, dev, 42000, ts);
          }
        }
      }
    });
    seedTx();
  }
}

/* ───────────────────────── Query & Mutation Helpers ───────────────────────── */

export interface DbProduct extends NokshaProduct {
  sku: string;
  costBDT: number;
  stockQty: number;
  lowStockThreshold: number;
  gallery: string[];
  viewsCount: number;
  addToBagCount: number;
  ordersCount: number;
  updatedAt: string;
}

interface RawProductRow {
  id: string;
  sku: string;
  name: string;
  bengali_name: string;
  category: PillarId;
  price_bdt: number;
  original_price_bdt: number | null;
  cost_bdt: number;
  stock_qty: number;
  low_stock_threshold: number;
  status: ProductStatus;
  status_label: string;
  region: string;
  artisan_hours: number;
  artisan_hours_label: string;
  materials: string;
  dimensions: string;
  story: string;
  care: string;
  image: string;
  gallery_json: string;
  accent_color: string;
  colors_json: string;
  views_count: number;
  add_to_bag_count: number;
  orders_count: number;
  collection_id?: string;
  acquired_by?: string;
  col_title?: string | null;
  col_drop_number?: string | null;
  col_drop_status?: string | null;
  updated_at: string;
}

function mapProductRow(r: RawProductRow): DbProduct {
  let colors = [{ name: "Signature", hex: "#B08A4F" }];
  let gallery = [r.image];
  try {
    const parsedColors = JSON.parse(r.colors_json);
    if (Array.isArray(parsedColors) && parsedColors.length > 0) colors = parsedColors;
  } catch {
    // fallback
  }
  try {
    const parsedGallery = JSON.parse(r.gallery_json);
    if (Array.isArray(parsedGallery) && parsedGallery.length > 0) gallery = parsedGallery;
  } catch {
    // fallback
  }
  const collectionId = r.collection_id || "";
  return {
    id: r.id,
    sku: r.sku,
    name: r.name,
    bengaliName: r.bengali_name,
    category: r.category,
    priceBDT: r.price_bdt,
    originalPriceBDT: r.original_price_bdt ?? undefined,
    costBDT: r.cost_bdt,
    stockQty: r.stock_qty,
    lowStockThreshold: r.low_stock_threshold,
    status: r.status,
    statusLabel: r.status_label,
    region: r.region,
    artisanHours: r.artisan_hours,
    artisanHoursLabel: r.artisan_hours_label,
    materials: r.materials,
    dimensions: r.dimensions,
    story: r.story,
    care: r.care,
    image: r.image,
    gallery,
    accentColor: r.accent_color,
    colors,
    viewsCount: r.views_count,
    addToBagCount: r.add_to_bag_count,
    ordersCount: r.orders_count,
    collectionId,
    collectionName: r.col_title || "",
    dropNumber: r.col_drop_number || "",
    dropStatus: (r.col_drop_status as DropStatus) || undefined,
    acquiredBy: r.acquired_by || "",
    updatedAt: r.updated_at,
  };
}

export function getAllProducts(includeHidden = false): DbProduct[] {
  const db = getDb();
  const sql = `
    SELECT p.*,
           c.title as col_title,
           c.drop_number as col_drop_number,
           c.drop_status as col_drop_status
    FROM products p
    LEFT JOIN collections c ON p.collection_id != '' AND p.collection_id = c.id
    ${includeHidden ? "" : "WHERE p.status != 'hidden'"}
    ORDER BY CASE WHEN p.collection_id != '' THEN 0 ELSE 1 END, p.category ASC, p.price_bdt ASC
  `;
  const rows = db.prepare(sql).all() as RawProductRow[];
  return rows.map(mapProductRow);
}

export function getProductById(id: string): DbProduct | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT p.*,
              c.title as col_title,
              c.drop_number as col_drop_number,
              c.drop_status as col_drop_status
       FROM products p
       LEFT JOIN collections c ON p.collection_id != '' AND p.collection_id = c.id
       WHERE p.id = ?`
    )
    .get(id) as RawProductRow | undefined;
  return row ? mapProductRow(row) : null;
}

export function getSiteContentMap(): Record<string, string> {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM site_content").all() as { key: string; value: string }[];
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export interface DbPromoCode {
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrderBDT: number;
  maxUses: number;
  usedCount: number;
  label: string;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export function getAllPromoCodes(onlyActive = false): DbPromoCode[] {
  const db = getDb();
  const rows = db
    .prepare(onlyActive ? "SELECT * FROM promo_codes WHERE active = 1 ORDER BY created_at DESC" : "SELECT * FROM promo_codes ORDER BY created_at DESC")
    .all() as {
    code: string;
    discount_type: "percent" | "fixed";
    discount_value: number;
    min_order_bdt: number;
    max_uses: number;
    used_count: number;
    label: string;
    active: number;
    expires_at: string | null;
    created_at: string;
  }[];
  return rows.map((r) => ({
    code: r.code,
    discountType: r.discount_type,
    discountValue: r.discount_value,
    minOrderBDT: r.min_order_bdt,
    maxUses: r.max_uses,
    usedCount: r.used_count,
    label: r.label,
    active: Boolean(r.active),
    expiresAt: r.expires_at,
    createdAt: r.created_at,
  }));
}

export function getSessionUser(token: string | null): SessionUser | null {
  if (!token) return null;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, s.expires_at
       FROM sessions s
       JOIN staff_users u ON u.id = s.user_id
       WHERE s.token = ? AND u.active = 1`
    )
    .get(token) as { id: number; name: string; email: string; role: StaffRole; expires_at: string } | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return null;
  }
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

export function logAudit(
  user: { email: string; role: string },
  action: string,
  entityType: string,
  entityId: string,
  details: string
) {
  const db = getDb();
  db.prepare(
    `INSERT INTO audit_logs (user_email, user_role, action, entity_type, entity_id, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(user.email, user.role, action, entityType, entityId, details, new Date().toISOString());
}

export interface DbCategory {
  id: string;
  shortName: string;
  name: string;
  bengaliName: string;
  subtitle: string;
  sortOrder: number;
  active: boolean;
  updatedAt: string;
}

export function getAllCategories(includeInactive = false): DbCategory[] {
  const db = getDb();
  const rows = db
    .prepare(
      includeInactive
        ? "SELECT * FROM categories ORDER BY sort_order ASC, name ASC"
        : "SELECT * FROM categories WHERE active = 1 ORDER BY sort_order ASC, name ASC"
    )
    .all() as {
    id: string;
    short_name: string;
    name: string;
    bengali_name: string;
    subtitle: string;
    sort_order: number;
    active: number;
    updated_at: string;
  }[];
  return rows.map((r) => ({
    id: r.id,
    shortName: r.short_name,
    name: r.name,
    bengaliName: r.bengali_name,
    subtitle: r.subtitle,
    sortOrder: r.sort_order,
    active: Boolean(r.active),
    updatedAt: r.updated_at,
  }));
}

export interface DbCollection {
  id: string;
  dropNumber: string;
  dropStatus: DropStatus;
  releaseDate: string;
  shortName: string;
  title: string;
  bengaliTitle: string;
  subtitle: string;
  description: string;
  story: string;
  craftMetric: string;
  priceRange: string;
  heroImage: string;
  bannerImage: string;
  accentHex: string;
  exclusivity: "multi" | "one_of_one";
  sortOrder: number;
  active: boolean;
  updatedAt: string;
}

interface RawCollectionRow {
  id: string;
  drop_number?: string;
  drop_status?: string;
  release_date?: string;
  short_name: string;
  title: string;
  bengali_title: string;
  subtitle: string;
  description: string;
  story: string;
  craft_metric: string;
  price_range: string;
  hero_image: string;
  banner_image: string;
  accent_hex: string;
  exclusivity: "multi" | "one_of_one";
  sort_order: number;
  active: number;
  updated_at: string;
}

function mapCollectionRow(r: RawCollectionRow): DbCollection {
  return {
    id: r.id,
    dropNumber: r.drop_number || "Drop 01",
    dropStatus: (r.drop_status as DropStatus) || "live",
    releaseDate: r.release_date || "Live Now",
    shortName: r.short_name,
    title: r.title,
    bengaliTitle: r.bengali_title,
    subtitle: r.subtitle,
    description: r.description,
    story: r.story,
    craftMetric: r.craft_metric,
    priceRange: r.price_range,
    heroImage: r.hero_image,
    bannerImage: r.banner_image || r.hero_image,
    accentHex: r.accent_hex,
    exclusivity: "one_of_one",
    sortOrder: r.sort_order,
    active: Boolean(r.active),
    updatedAt: r.updated_at,
  };
}

export function getAllCollections(includeInactive = false): DbCollection[] {
  const db = getDb();
  const rows = db
    .prepare(
      includeInactive
        ? "SELECT * FROM collections ORDER BY sort_order ASC, title ASC"
        : "SELECT * FROM collections WHERE active = 1 ORDER BY sort_order ASC, title ASC"
    )
    .all() as RawCollectionRow[];
  return rows.map(mapCollectionRow);
}

export function getCollectionById(id: string): DbCollection | null {
  const db = getDb();
  let row = db.prepare("SELECT * FROM collections WHERE id = ?").get(id) as RawCollectionRow | undefined;
  if (!row) {
    const legacyMap: Record<string, string> = {
      "nakshi-kantha": "drop-01",
      "light-shades": "drop-02",
      "jewelry-boxes": "drop-03",
    };
    if (legacyMap[id]) {
      row = db.prepare("SELECT * FROM collections WHERE id = ?").get(legacyMap[id]) as RawCollectionRow | undefined;
    }
  }
  return row ? mapCollectionRow(row) : null;
}

