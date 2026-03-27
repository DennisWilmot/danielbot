import { Receipt } from "./types.js";

export function formatReceiptForDisplay(receipt: Receipt): string {
  const { parsed } = receipt;
  const lines: string[] = [];

  lines.push("📄 *Receipt Details:*\n");
  lines.push(`🏪 *Merchant:* ${parsed.merchant || "_Not set_"}`);
  lines.push(`📅 *Date:* ${parsed.date || "_Not set_"}`);
  lines.push(`💱 *Currency:* ${parsed.currency || "_Not set_"}`);
  lines.push(
    `💰 *Total:* ${parsed.total !== null && parsed.total !== undefined ? parsed.total.toFixed(2) : "_Not set_"}`
  );
  lines.push(
    `📊 *Tax:* ${parsed.tax !== null && parsed.tax !== undefined ? parsed.tax.toFixed(2) : "_Not set_"}`
  );
  lines.push(
    `💳 *Payment Method:* ${parsed.paymentMethod || "_Not set_"}`
  );

  if (parsed.items.length > 0) {
    lines.push(`\n📦 *Items (${parsed.items.length}):*`);
    parsed.items.forEach((item, idx) => {
      const parts = [`${idx + 1}. ${item.name}`];
      if (item.quantity !== null) parts.push(`Qty: ${item.quantity}`);
      if (item.unitPrice !== null)
        parts.push(`Unit: ${item.unitPrice.toFixed(2)}`);
      if (item.lineTotal !== null)
        parts.push(`Total: ${item.lineTotal.toFixed(2)}`);
      lines.push(`   ${parts.join(" | ")}`);
    });
  } else {
    lines.push(`\n📦 *Items:* _None_`);
  }

  if (parsed.purchase) lines.push(`\n🛒 *Purchase:* ${parsed.purchase}`);
  if (parsed.notes) lines.push(`\n📝 *Notes:* ${parsed.notes}`);
  if (parsed.category)
    lines.push(`\n🏷️ *Category:* ${parsed.category}`);
  if (parsed.location)
    lines.push(`\n📍 *Location:* ${parsed.location}`);
  lines.push(
    `\n🎯 *Confidence:* ${(parsed.confidence * 100).toFixed(0)}%`
  );

  return lines.join("\n");
}
