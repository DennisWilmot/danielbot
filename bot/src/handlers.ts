import { Context } from "grammy";
import { v4 as uuidv4 } from "uuid";
import { Receipt, ReceiptSource, ParsedReceipt } from "./types.js";
import {
  parseTextReceipt,
  parseImageReceipt,
  parsePdfReceipt,
} from "./openrouter.js";
import {
  downloadTelegramFile,
  cleanupFile,
} from "./telegramFiles.js";
import { formatReceiptForDisplay } from "./format.js";
import { pendingReceipts } from "./state.js";
import { createConfirmationKeyboard } from "./keyboards.js";

export async function processReceipt(
  ctx: Context,
  source: ReceiptSource,
  fileId?: string,
  mimeType?: string,
  text?: string
) {
  const userId = ctx.from?.id;
  const username = ctx.from?.username || null;
  const firstName = ctx.from?.first_name || "";
  const lastName = ctx.from?.last_name || "";
  const displayName =
    [firstName, lastName].filter(Boolean).join(" ").trim() || null;

  if (!userId) {
    await ctx.reply("❌ Could not identify user");
    return;
  }

  try {
    const processingMsg = await ctx.reply("⏳ Processing receipt...");
    const receiptId = uuidv4();

    let parsed: ParsedReceipt;
    let localFilePath: string | undefined;

    try {
      if (source === "text") {
        if (!text) throw new Error("No text provided");
        parsed = await parseTextReceipt(text);
      } else if (source === "photo") {
        if (!fileId) throw new Error("No file ID");
        const ext = mimeType?.includes("png") ? "png" : "jpg";
        localFilePath = await downloadTelegramFile(
          ctx.api,
          fileId,
          `receipt_${uuidv4()}.${ext}`
        );
        parsed = await parseImageReceipt(localFilePath, text || undefined);
      } else if (source === "pdf") {
        if (!fileId) throw new Error("No file ID");
        localFilePath = await downloadTelegramFile(
          ctx.api,
          fileId,
          `receipt_${uuidv4()}.pdf`
        );
        parsed = await parsePdfReceipt(localFilePath);
      } else {
        throw new Error(`Unknown source: ${source}`);
      }
    } catch (parseError) {
      console.error("Parse error:", parseError);
      await ctx.api.deleteMessage(
        ctx.chat!.id,
        processingMsg.message_id
      );
      await ctx.reply(
        "❌ Failed to parse receipt. Try a clearer photo or type the details."
      );
      return;
    } finally {
      if (localFilePath) await cleanupFile(localFilePath);
    }

    const receipt: Receipt = {
      id: receiptId,
      userId,
      username,
      displayName,
      createdAt: new Date().toISOString(),
      source,
      raw: {
        fileId: fileId || null,
        mimeType: mimeType || null,
        text: text || null,
      },
      parsed,
      imagePath: null,
      status: "Pending",
    };

    pendingReceipts.set(userId, receipt);

    try {
      await ctx.api.deleteMessage(
        ctx.chat!.id,
        processingMsg.message_id
      );
    } catch {}

    const formatted = formatReceiptForDisplay(receipt);
    const keyboard = createConfirmationKeyboard(receiptId);

    await ctx.reply(formatted, {
      reply_markup: keyboard,
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error("Error processing receipt:", error);
    await ctx.reply(
      "❌ An unexpected error occurred. Please try again."
    );
  }
}
