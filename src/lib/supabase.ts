import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const DB_BUCKET = "noksha-db";
const DB_OBJECT_PATH = "noksha.db";
const UPLOADS_BUCKET = "noksha-uploads";

export function getSupabaseConfig() {
  const url = (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ""
  ).replace(/\/+$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return {
    url,
    serviceKey,
    enabled: Boolean(url && serviceKey),
  };
}

/**
 * Ensures a Supabase Storage bucket exists (auto-creates if missing).
 */
async function ensureBucket(bucketId: string, isPublic: boolean): Promise<void> {
  const { url, serviceKey, enabled } = getSupabaseConfig();
  if (!enabled) return;

  try {
    await fetch(`${url}/storage/v1/bucket`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: bucketId,
        name: bucketId,
        public: isPublic,
      }),
    });
  } catch {
    // Ignore if bucket already exists
  }
}

/**
 * Cold-start synchronous restore of noksha.db from Supabase Storage.
 * Runs only once when the local/tmp noksha.db file does not exist yet.
 */
export function downloadDbFromSupabaseSync(targetFilePath: string): boolean {
  const { url, serviceKey, enabled } = getSupabaseConfig();
  if (!enabled) return false;

  try {
    const dir = path.dirname(targetFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const script = `
      const fs = require("fs");
      const url = ${JSON.stringify(`${url}/storage/v1/object/${DB_BUCKET}/${DB_OBJECT_PATH}`)};
      const key = ${JSON.stringify(serviceKey)};
      const dest = ${JSON.stringify(targetFilePath)};
      fetch(url, { headers: { Authorization: "Bearer " + key, apikey: key } })
        .then(async (res) => {
          if (!res.ok) process.exit(2);
          const buf = Buffer.from(await res.arrayBuffer());
          if (buf.length < 100) process.exit(3);
          fs.writeFileSync(dest, buf);
          process.exit(0);
        })
        .catch(() => process.exit(1));
    `;

    execFileSync(process.execPath, ["-e", script], {
      timeout: 8000,
      stdio: "ignore",
    });
    return fs.existsSync(targetFilePath);
  } catch {
    return false;
  }
}

/**
 * Uploads the serialized SQLite database buffer to Supabase Storage (`noksha-db/noksha.db`).
 */
export async function uploadDbBufferToSupabase(buffer: Buffer): Promise<boolean> {
  const { url, serviceKey, enabled } = getSupabaseConfig();
  if (!enabled) return false;

  try {
    await ensureBucket(DB_BUCKET, false);
    const res = await fetch(`${url}/storage/v1/object/${DB_BUCKET}/${DB_OBJECT_PATH}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": "application/octet-stream",
        "x-upsert": "true",
      },
      body: new Uint8Array(buffer),
    });
    return res.ok;
  } catch (err) {
    console.error("Supabase DB sync error:", err);
    return false;
  }
}

/**
 * Uploads an admin-uploaded image to Supabase Storage (`noksha-uploads`)
 * and returns its permanent public CDN URL.
 */
export async function uploadImageToSupabase(
  filename: string,
  contentType: string,
  buffer: Buffer
): Promise<string | null> {
  const { url, serviceKey, enabled } = getSupabaseConfig();
  if (!enabled) return null;

  try {
    await ensureBucket(UPLOADS_BUCKET, true);
    const res = await fetch(`${url}/storage/v1/object/${UPLOADS_BUCKET}/${filename}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        "Content-Type": contentType || "image/jpeg",
        "x-upsert": "true",
      },
      body: new Uint8Array(buffer),
    });

    if (!res.ok) {
      return null;
    }

    return `${url}/storage/v1/object/public/${UPLOADS_BUCKET}/${filename}`;
  } catch (err) {
    console.error("Supabase image upload error:", err);
    return null;
  }
}

/**
 * Pings Supabase Storage so the free-tier project stays active and never pauses.
 */
export async function pingSupabaseKeepAlive(): Promise<{ ok: boolean; enabled: boolean }> {
  const { url, serviceKey, enabled } = getSupabaseConfig();
  if (!enabled) return { ok: true, enabled: false };

  try {
    const res = await fetch(`${url}/storage/v1/bucket`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
    });
    return { ok: res.ok, enabled: true };
  } catch {
    return { ok: false, enabled: true };
  }
}
