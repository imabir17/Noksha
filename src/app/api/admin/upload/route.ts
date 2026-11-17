import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSessionTokenFromCookies } from "@/lib/auth";
import { getSessionUser, logAudit } from "@/lib/db";

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

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}-${safeName}`;
    const fullPath = path.join(uploadDir, filename);
    fs.writeFileSync(fullPath, buffer);

    const publicUrl = `/uploads/${filename}`;
    logAudit(user, "upload_image", "media", filename, `Uploaded ${publicUrl} (${buffer.length} bytes)`);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("POST /api/admin/upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
