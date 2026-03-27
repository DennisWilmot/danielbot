import { promises as fs } from "fs";
import { join, resolve } from "path";
import { Receipt } from "./types.js";
import { RECEIPTS_DIR } from "./config.js";

const receiptsDir = resolve(RECEIPTS_DIR);
const imagesDir = join(receiptsDir, "images");

async function ensureDirs() {
  await fs.mkdir(receiptsDir, { recursive: true });
  await fs.mkdir(imagesDir, { recursive: true });
}

export async function saveReceipt(receipt: Receipt): Promise<void> {
  await ensureDirs();
  const filePath = join(receiptsDir, `${receipt.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(receipt, null, 2));
}

export async function getReceiptById(
  id: string
): Promise<Receipt | null> {
  try {
    const filePath = join(receiptsDir, `${id}.json`);
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function getAllReceipts(): Promise<Receipt[]> {
  await ensureDirs();
  const files = await fs.readdir(receiptsDir);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));
  const receipts: Receipt[] = [];
  for (const file of jsonFiles) {
    try {
      const data = await fs.readFile(join(receiptsDir, file), "utf-8");
      receipts.push(JSON.parse(data));
    } catch {
      // skip malformed files
    }
  }
  return receipts.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getLastReceiptByUserId(
  userId: number
): Promise<Receipt | null> {
  const all = await getAllReceipts();
  return all.find((r) => r.userId === userId) || null;
}

export async function updateReceipt(receipt: Receipt): Promise<void> {
  await saveReceipt(receipt);
}

export async function deleteReceipt(id: string): Promise<void> {
  try {
    await fs.unlink(join(receiptsDir, `${id}.json`));
  } catch {}
  try {
    const imageFiles = await fs.readdir(imagesDir);
    for (const f of imageFiles) {
      if (f.startsWith(id)) await fs.unlink(join(imagesDir, f));
    }
  } catch {}
}

export async function saveReceiptImage(
  sourceFilePath: string,
  receiptId: string,
  ext: string
): Promise<string> {
  await ensureDirs();
  const destPath = join(imagesDir, `${receiptId}.${ext}`);
  await fs.copyFile(sourceFilePath, destPath);
  return `images/${receiptId}.${ext}`;
}
