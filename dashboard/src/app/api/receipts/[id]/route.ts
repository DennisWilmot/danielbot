import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { join, resolve } from "path";

const RECEIPTS_DIR = resolve(process.env.RECEIPTS_DIR || "./receipts");

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const filePath = join(RECEIPTS_DIR, `${id}.json`);

  try {
    const existing = JSON.parse(await fs.readFile(filePath, "utf-8"));

    if (body.vendor !== undefined) existing.parsed.merchant = body.vendor;
    if (body.amount !== undefined) existing.parsed.total = body.amount;
    if (body.category !== undefined)
      existing.parsed.category = body.category;
    if (body.location !== undefined)
      existing.parsed.location = body.location;
    if (body.purchase !== undefined)
      existing.parsed.purchase = body.purchase;
    if (body.notes !== undefined) existing.parsed.notes = body.notes;
    if (body.tax !== undefined) existing.parsed.tax = body.tax;
    if (body.status !== undefined) existing.status = body.status;

    await fs.writeFile(filePath, JSON.stringify(existing, null, 2));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Receipt not found" },
      { status: 404 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await fs.unlink(join(RECEIPTS_DIR, `${id}.json`));
    const imagesDir = join(RECEIPTS_DIR, "images");
    try {
      const files = await fs.readdir(imagesDir);
      for (const f of files) {
        if (f.startsWith(id)) await fs.unlink(join(imagesDir, f));
      }
    } catch {}
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Receipt not found" },
      { status: 404 }
    );
  }
}
