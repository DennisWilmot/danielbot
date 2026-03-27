import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { join, resolve } from "path";

const RECEIPTS_DIR = resolve(process.env.RECEIPTS_DIR || "./receipts");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filePath = join(RECEIPTS_DIR, ...path);

  try {
    const buffer = await fs.readFile(filePath);
    const ext = filePath.split(".").pop()?.toLowerCase();
    const contentType =
      ext === "png"
        ? "image/png"
        : ext === "jpg" || ext === "jpeg"
          ? "image/jpeg"
          : ext === "pdf"
            ? "application/pdf"
            : "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Image not found" },
      { status: 404 }
    );
  }
}
