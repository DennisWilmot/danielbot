import express from "express";
import { bot } from "./bot.js";
import { WEBHOOK_PATH, WEBHOOK_URL, PORT } from "./config.js";

export async function startServer() {
  await bot.init();
  console.log("Bot initialized");

  try {
    await bot.api.setMyCommands([
      { command: "start", description: "Welcome message" },
      { command: "receipt", description: "Process a receipt" },
      { command: "last", description: "Show last receipt" },
      { command: "help", description: "Show help" },
      { command: "cancel", description: "Cancel current flow" },
    ]);
  } catch (error) {
    console.error("Failed to set bot commands:", error);
  }

  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post(WEBHOOK_PATH, async (req, res) => {
    try {
      await bot.handleUpdate(req.body);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error handling webhook:", error);
      res.sendStatus(500);
    }
  });

  app.listen(PORT, async () => {
    console.log(`Server listening on port ${PORT}`);
    if (WEBHOOK_URL) {
      await bot.api.setWebhook(WEBHOOK_URL, {
        allowed_updates: ["message", "callback_query"],
      });
      console.log(`Webhook set to: ${WEBHOOK_URL}`);
    } else {
      bot.start();
      console.log("Running in polling mode");
    }
  });
}
