import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const DB_BUCKET = "noksha-db";
const DB_OBJECT_PATH = "noksha.db";
const UPLOADS_BUCKET = "noksha-uploads";

function resolveSecretKey(): string {
  if (process.env.SUPABASE_SECRET_KEY) {
    return process.env.SUPABASE_SECRET_KEY.trim();
  }
  if (process.env.SUPABASE_SECRET_KEYS) {
    try {
      const parsed = JSON.parse(process.env.SUPABASE_SECRET_KEYS);
      if (parsed && typeof parsed === "object" && parsed.default) {
        return String(parsed.default).trim();
      }
    } catch {
      return process.env.SUPABASE_SECRET_KEYS.trim();
    }
  }
  return (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
}

export function getSupabaseConfig() {
  const url = (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ""
  ).replace(/\/+$/, "");
  const secretKey = resolveSecretKey();
  const publishableKey = (
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    ""
  ).trim();
  return {
    url,
    secretKey,
    publishableKey,
    isNewKeyFormat: secretKey.startsWith("sb_secret_"),
    enabled: Boolean(url && secretKey),
  };
}

/**
 * Builds headers for Supabase API calls.
 * New `sb_secret_...` keys are non-JWTs and use the `apikey` header;
 * legacy `eyJ...` service_role JWTs also include `Authorization: Bearer`.
 */
function buildSupabaseHeaders(
  secretKey: string,
  extra: Record<string, string> = {},
  includeBearerForNewKey = false
): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: secretKey,
    ...extra,
  };
  if (!secretKey.startsWith("sb_") || includeBearerForNewKey) {
    headers.Authorization = `Bearer ${secretKey}`;
  }
  return headers;
}

async function supabaseFetch(
  endpointUrl: string,
  secretKey: string,
  init: Omit<RequestInit, "headers"> & { headers?: Record<string, string> }
): Promise<Response> {
  const res = await fetch(endpointUrl, {
    ...init,
    headers: buildSupabaseHeaders(secretKey, init.headers, false),
  });
  // If a Storage endpoint still expects Authorization header alongside apikey, retry once with both
  if ((res.status === 401 || res.status === 403) && secretKey.startsWith("sb_")) {
    return fetch(endpointUrl, {
      ...init,
      headers: buildSupabaseHeaders(secretKey, init.headers, true),
    });
  }
  return res;
}

/**
 * Ensures a Supabase Storage bucket exists (auto-creates if missing).
 */
async function ensureBucket(bucketId: string, isPublic: boolean): Promise<void> {
  const { url, secretKey, enabled } = getSupabaseConfig();
  if (!enabled) return;

  try {
    await supabaseFetch(`${url}/storage/v1/bucket`, secretKey, {
      method: "POST",
      headers: {
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
  const { url, secretKey, enabled } = getSupabaseConfig();
  if (!enabled) return false;

  try {
    const dir = path.dirname(targetFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const script = `
      const fs = require("fs");
      const url = ${JSON.stringify(`${url}/storage/v1/object/${DB_BUCKET}/${DB_OBJECT_PATH}`)};
      const key = ${JSON.stringify(secretKey)};
      const dest = ${JSON.stringify(targetFilePath)};
      const headers = key.startsWith("sb_")
        ? { apikey: key }
        : { apikey: key, Authorization: "Bearer " + key };
      fetch(url, { headers })
        .then(async (res) => {
          if ((res.status === 401 || res.status === 403) && key.startsWith("sb_")) {
            res = await fetch(url, { headers: { apikey: key, Authorization: "Bearer " + key } });
          }
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
  const { url, secretKey, enabled } = getSupabaseConfig();
  if (!enabled) return false;

  try {
    await ensureBucket(DB_BUCKET, false);
    const res = await supabaseFetch(
      `${url}/storage/v1/object/${DB_BUCKET}/${DB_OBJECT_PATH}`,
      secretKey,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "x-upsert": "true",
        },
        body: new Uint8Array(buffer),
      }
    );
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
  const { url, secretKey, enabled } = getSupabaseConfig();
  if (!enabled) return null;

  try {
    await ensureBucket(UPLOADS_BUCKET, true);
    const res = await supabaseFetch(
      `${url}/storage/v1/object/${UPLOADS_BUCKET}/${filename}`,
      secretKey,
      {
        method: "POST",
        headers: {
          "Content-Type": contentType || "image/jpeg",
          "x-upsert": "true",
        },
        body: new Uint8Array(buffer),
      }
    );

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
  const { url, secretKey, enabled } = getSupabaseConfig();
  if (!enabled) return { ok: true, enabled: false };

  try {
    const res = await supabaseFetch(`${url}/storage/v1/bucket`, secretKey, {
      method: "GET",
    });
    return { ok: res.ok, enabled: true };
  } catch {
    return { ok: false, enabled: true };
  }
}
