import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Ensure it's an image
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image (PNG, JPG, WebP, SVG)" },
        { status: 400 }
      );
    }

    // Max 15MB
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 15MB limit" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Clean filename
    const safeName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "-")
      .replace(/-+/g, "-");

    const ext = path.extname(safeName) || ".jpg";
    const nameWithoutExt = path.basename(safeName, ext);
    const uniqueFileName = `${nameWithoutExt}-${Date.now()}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, uniqueFileName);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${uniqueFileName}`;
    return NextResponse.json({ ok: true, url: publicUrl });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload file: " + err.message },
      { status: 500 }
    );
  }
}
