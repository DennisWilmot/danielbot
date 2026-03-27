import { InlineKeyboard } from "grammy";

export function createConfirmationKeyboard(
  receiptId: string
): InlineKeyboard {
  return new InlineKeyboard()
    .text("✅ Confirm & Save", `confirm:${receiptId}`)
    .text("✏️ Edit", `edit:${receiptId}`)
    .row()
    .text("❌ Cancel", `cancel:${receiptId}`);
}

export function createEditKeyboard(
  receiptId: string
): InlineKeyboard {
  return new InlineKeyboard()
    .text("🏪 Merchant", `edit_field:${receiptId}:merchant`)
    .text("📅 Date", `edit_field:${receiptId}:date`)
    .row()
    .text("💰 Total", `edit_field:${receiptId}:total`)
    .text("💱 Currency", `edit_field:${receiptId}:currency`)
    .row()
    .text("📊 Tax", `edit_field:${receiptId}:tax`)
    .text("💳 Payment", `edit_field:${receiptId}:paymentMethod`)
    .row()
    .text("🏷️ Category", `edit_field:${receiptId}:category`)
    .text("📍 Location", `edit_field:${receiptId}:location`)
    .row()
    .text("🛒 Purchase Name", `edit_field:${receiptId}:purchase`)
    .text("📝 Notes", `edit_field:${receiptId}:notes`)
    .row()
    .text("⬅️ Back", `back:${receiptId}`);
}
