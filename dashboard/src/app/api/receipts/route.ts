import { NextResponse } from "next/server";
import { getAllReceipts } from "@/lib/receipts";
import { promises as fs } from "fs";
import { join, resolve } from "path";
import { v4 as uuidv4 } from "uuid";

const RECEIPTS_DIR = resolve(process.env.RECEIPTS_DIR || "./receipts");

export async function GET() {
  const receipts = await getAllReceipts();
  return NextResponse.json(receipts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const id = uuidv4();
  const receipt = {
    id,
    userId: 0,
    username: null,
    displayName: body.submittedBy || "Manual Entry",
    createdAt: new Date().toISOString(),
    source: "manual",
    raw: { fileId: null, mimeType: null, text: null },
    parsed: {
      merchant: body.vendor || null,
      date: body.date || null,
      currency: body.currency || null,
      total: body.amount || 0,
      tax: body.tax || null,
      paymentMethod: body.paymentMethod || null,
      items: body.items || [],
      notes: body.notes || null,
      confidence: 1.0,
      category: body.category || "Other",
      location: body.location || null,
      purchase: body.purchase || null,
    },
    imagePath: null,
    status: body.status || "Pending",
  };

  await fs.mkdir(RECEIPTS_DIR, { recursive: true });
  await fs.writeFile(
    join(RECEIPTS_DIR, `${id}.json`),
    JSON.stringify(receipt, null, 2)
  );
  return NextResponse.json({ id, ...body });
}
