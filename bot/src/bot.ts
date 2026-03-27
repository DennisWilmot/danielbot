import { Bot } from "grammy";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is required");
  process.exit(1);
}

export const bot = new Bot(BOT_TOKEN);
