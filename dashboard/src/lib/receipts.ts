import { promises as fs } from "fs";
import { join, resolve } from "path";

const RECEIPTS_DIR = resolve(process.env.RECEIPTS_DIR || "./receipts");

export type ReceiptItem = {
  name: string;
  quantity: number | null;
  unitPrice: number | null;
  lineTotal: number | null;
};

export type DashboardReceipt = {
  id: string;
  imageUrl: string;
  amount: number;
  purchase: string;
  items: ReceiptItem[];
  location: string;
  date: string;
  time: string;
  vendor: string;
  category: string;
  status: "Approved" | "Pending" | "Rejected";
  submittedBy: string;
  notes?: string;
  tax?: number;
  source: string;
};

function formatDate(dateStr: string | null): string {
  if (!dateStr)
    return new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export async function getAllReceipts(): Promise<DashboardReceipt[]> {
  try {
    await fs.mkdir(RECEIPTS_DIR, { recursive: true });
    const files = await fs.readdir(RECEIPTS_DIR);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));
    const receipts: DashboardReceipt[] = [];

    for (const file of jsonFiles) {
      try {
        const raw = await fs.readFile(join(RECEIPTS_DIR, file), "utf-8");
        const data = JSON.parse(raw);

        let imageUrl = "";
        if (data.imagePath) {
          imageUrl = `/api/receipts/images/${data.imagePath}`;
        }

        receipts.push({
          id: data.id,
          imageUrl,
          amount: data.parsed?.total || 0,
          purchase: data.parsed?.purchase || "Purchase",
          items: data.parsed?.items || [],
          location: data.parsed?.location || "Unknown",
          date: formatDate(data.parsed?.date || data.createdAt),
          time: formatTime(data.createdAt),
          vendor: data.parsed?.merchant || "Unknown Vendor",
          category: data.parsed?.category || "Other",
          status: data.status || "Pending",
          submittedBy:
            data.displayName || data.username || "Unknown",
          notes: data.parsed?.notes || undefined,
          tax: data.parsed?.tax || undefined,
          source: data.source || "unknown",
        });
      } catch {
        // skip malformed files
      }
    }

    return receipts.sort((a, b) => {
      const da = new Date(a.date).getTime() || 0;
      const db = new Date(b.date).getTime() || 0;
      return db - da;
    });
  } catch {
    return [];
  }
}
