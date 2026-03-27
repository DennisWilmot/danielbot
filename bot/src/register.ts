import { InlineKeyboard } from "grammy";
import { bot } from "./bot.js";
import {
  pendingReceipts,
  editStates,
  pendingTextReceipts,
} from "./state.js";
import {
  createConfirmationKeyboard,
  createEditKeyboard,
} from "./keyboards.js";
import { processReceipt } from "./handlers.js";
import { formatReceiptForDisplay } from "./format.js";
import {
  saveReceipt,
  updateReceipt,
  getReceiptById,
  getLastReceiptByUserId,
  saveReceiptImage,
} from "./storage.js";
import {
  downloadTelegramFile,
  cleanupFile,
} from "./telegramFiles.js";

export function registerHandlers() {
  bot.command("start", async (ctx) => {
    await ctx.reply(
      "👋 *Welcome to Receipt Bot!*\n\n" +
        "Send me:\n• A photo of a receipt\n• A PDF receipt\n• Or type the receipt details\n\n" +
        "Use /receipt to start or /help for more.",
      { parse_mode: "Markdown" }
    );
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(
      "📋 *Commands:*\n" +
        "/receipt — Start receipt processing\n" +
        "/last — View your last receipt\n" +
        "/cancel — Cancel current flow\n" +
        "/help — Show this message\n\n" +
        "You can also just send a photo, PDF, or text message directly.",
      { parse_mode: "Markdown" }
    );
  });

  bot.command("cancel", async (ctx) => {
    const userId = ctx.from?.id;
    if (userId) {
      pendingReceipts.delete(userId);
      editStates.delete(userId);
      pendingTextReceipts.delete(userId);
    }
    await ctx.reply(
      "❌ Cancelled. Send a new receipt whenever you're ready."
    );
  });

  bot.command("receipt", async (ctx) => {
    await ctx.reply(
      "📝 *Process Receipt*\n\nSend me:\n• A photo of a receipt\n• A PDF receipt\n• Or type the receipt details as text",
      { parse_mode: "Markdown" }
    );
  });

  bot.command("last", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const receipt = await getLastReceiptByUserId(userId);
    if (!receipt) {
      await ctx.reply(
        "📭 No receipts found. Send me a receipt to get started!"
      );
      return;
    }
    const formatted = formatReceiptForDisplay(receipt);
    await ctx.reply(`${formatted}\n\nID: \`${receipt.id}\``, {
      parse_mode: "Markdown",
    });
  });

  bot.callbackQuery(/^(confirm|edit|cancel|back):(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const action = ctx.match[1];
    const receiptId = ctx.match[2];
    const pending = pendingReceipts.get(userId);
    if (!pending || pending.id !== receiptId) {
      await ctx.answerCallbackQuery("Receipt not found");
      return;
    }

    if (action === "confirm") {
      await ctx.answerCallbackQuery("Saving...");

      if (pending.source === "photo" && pending.raw.fileId) {
        try {
          const ext = pending.raw.mimeType?.includes("png")
            ? "png"
            : "jpg";
          const tmpPath = await downloadTelegramFile(
            ctx.api,
            pending.raw.fileId,
            `save_${receiptId}.${ext}`
          );
          pending.imagePath = await saveReceiptImage(
            tmpPath,
            receiptId,
            ext
          );
          await cleanupFile(tmpPath);
        } catch (err) {
          console.error("Failed to save image:", err);
        }
      }

      const existing = await getReceiptById(receiptId);
      if (existing) {
        await updateReceipt(pending);
      } else {
        await saveReceipt(pending);
      }
      pendingReceipts.delete(userId);
      editStates.delete(userId);

      const formatted = formatReceiptForDisplay(pending);
      await ctx.editMessageText(
        `${formatted}\n\n✅ Saved successfully!`,
        { parse_mode: "Markdown" }
      );
    } else if (action === "edit") {
      const keyboard = createEditKeyboard(receiptId);
      await ctx.editMessageReplyMarkup({ reply_markup: keyboard });
      await ctx.answerCallbackQuery();
    } else if (action === "cancel") {
      pendingReceipts.delete(userId);
      editStates.delete(userId);
      await ctx.editMessageText("❌ Receipt cancelled.");
      await ctx.answerCallbackQuery("Cancelled");
    } else if (action === "back") {
      const keyboard = createConfirmationKeyboard(receiptId);
      const formatted = formatReceiptForDisplay(pending);
      await ctx.editMessageText(formatted, {
        reply_markup: keyboard,
        parse_mode: "Markdown",
      });
      await ctx.answerCallbackQuery();
    }
  });

  bot.callbackQuery(/^edit_field:(.+):(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const receiptId = ctx.match[1];
    const field = ctx.match[2];
    const pending = pendingReceipts.get(userId);
    if (!pending || pending.id !== receiptId) return;

    editStates.set(userId, { receiptId, field });
    const fieldName =
      field === "paymentMethod"
        ? "Payment Method"
        : field.charAt(0).toUpperCase() + field.slice(1);
    await ctx.answerCallbackQuery(`Editing ${fieldName}`);
    await ctx.reply(
      `✏️ Editing *${fieldName}*\n\nSend the new value, or /cancel to cancel.`,
      { parse_mode: "Markdown" }
    );
  });

  bot.callbackQuery(
    /^(process_text_receipt|cancel_text_receipt)$/,
    async (ctx) => {
      const userId = ctx.from?.id;
      if (!userId) return;
      if (ctx.match[1] === "process_text_receipt") {
        const text = pendingTextReceipts.get(userId);
        if (!text) return;
        pendingTextReceipts.delete(userId);
        await ctx.answerCallbackQuery("Processing...");
        await processReceipt(ctx, "text", undefined, undefined, text);
      } else {
        pendingTextReceipts.delete(userId);
        await ctx.editMessageText("❌ Cancelled.");
        await ctx.answerCallbackQuery("Cancelled");
      }
    }
  );

  bot.on("message:photo", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    if (editStates.has(userId)) {
      await ctx.reply(
        "⚠️ Please finish editing the current field first, or use /cancel."
      );
      return;
    }
    const photo = ctx.message.photo;
    const largest = photo[photo.length - 1];
    await processReceipt(ctx, "photo", largest.file_id, "image/jpeg");
  });

  bot.on("message:document", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    if (editStates.has(userId)) {
      await ctx.reply(
        "⚠️ Please finish editing the current field first, or use /cancel."
      );
      return;
    }
    const doc = ctx.message.document;
    if (doc.mime_type !== "application/pdf") {
      await ctx.reply("❌ Only PDF documents are supported.");
      return;
    }
    await processReceipt(ctx, "pdf", doc.file_id, doc.mime_type);
  });

  bot.on("message:text", async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const text = ctx.message.text;
    if (text.startsWith("/")) return;

    const editState = editStates.get(userId);
    if (editState) {
      const pending = pendingReceipts.get(userId);
      if (!pending || pending.id !== editState.receiptId) {
        editStates.delete(userId);
        return;
      }

      const { field } = editState;
      const updated = { ...pending, parsed: { ...pending.parsed } };

      if (field === "merchant") {
        updated.parsed.merchant = text.trim() || null;
      } else if (field === "date") {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(text.trim())) {
          await ctx.reply(
            "❌ Use YYYY-MM-DD format (e.g., 2026-03-27)"
          );
          return;
        }
        updated.parsed.date = text.trim();
      } else if (field === "total") {
        const num = parseFloat(text.trim());
        if (isNaN(num)) {
          await ctx.reply("❌ Enter a valid number.");
          return;
        }
        updated.parsed.total = num;
      } else if (field === "currency") {
        updated.parsed.currency = text.trim() || null;
      } else if (field === "tax") {
        const num = parseFloat(text.trim());
        if (isNaN(num)) {
          await ctx.reply("❌ Enter a valid number.");
          return;
        }
        updated.parsed.tax = num;
      } else if (field === "paymentMethod") {
        updated.parsed.paymentMethod = text.trim() || null;
      } else if (field === "category") {
        const valid = [
          "Software",
          "Equipment",
          "Infrastructure",
          "Training",
          "Marketing",
          "Services",
          "Other",
        ];
        if (!valid.includes(text.trim())) {
          await ctx.reply(
            `❌ Must be one of: ${valid.join(", ")}`
          );
          return;
        }
        updated.parsed.category = text.trim();
      } else if (field === "location") {
        updated.parsed.location = text.trim() || null;
      } else if (field === "purchase") {
        updated.parsed.purchase = text.trim() || null;
      } else if (field === "notes") {
        updated.parsed.notes = text.trim() || null;
      }

      pendingReceipts.set(userId, updated);
      editStates.delete(userId);

      const formatted = formatReceiptForDisplay(updated);
      const keyboard = createConfirmationKeyboard(
        editState.receiptId
      );
      await ctx.reply(`✅ ${field} updated!\n\n${formatted}`, {
        reply_markup: keyboard,
        parse_mode: "Markdown",
      });
      return;
    }

    pendingTextReceipts.set(userId, text);
    const keyboard = new InlineKeyboard()
      .text("📝 Process as Receipt", "process_text_receipt")
      .row()
      .text("❌ Cancel", "cancel_text_receipt");

    await ctx.reply(
      `📝 I received your text:\n\n"${text}"\n\nWould you like to process this as a receipt?`,
      { reply_markup: keyboard }
    );
  });
}
