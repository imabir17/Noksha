import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSessionTokenFromCookies } from "@/lib/auth";
import { getSessionUser, logAudit } from "@/lib/db";
import { getSupabaseConfig, uploadImageToSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const token = await getSessionTokenFromCookies();
    const user = getSessionUser(token);
    if (!user || user.role === "support") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}-${safeName}`;

    // 1. Prefer Supabase Storage when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are configured
    if (getSupabaseConfig().enabled) {
      const supabaseUrl = await uploadImageToSupabase(
        filename,
        file.type || "image/jpeg",
        buffer
      );
      if (supabaseUrl) {
        logAudit(
          user,
          "upload_image",
          "supabase_storage",
          filename,
          `Uploaded ${supabaseUrl} (${buffer.length} bytes)`
        );
        return NextResponse.json({ url: supabaseUrl, storage: "supabase" });
      }
    }

    // 2. Local filesystem fallback for localhost development
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const fullPath = path.join(uploadDir, filename);
    fs.writeFileSync(fullPath, buffer);

    const publicUrl = `/uploads/${filename}`;
    logAudit(user, "upload_image", "media", filename, `Uploaded ${publicUrl} (${buffer.length} bytes)`);

    return NextResponse.json({ url: publicUrl, storage: "local" });
  } catch (err) {
    console.error("POST /api/admin/upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
