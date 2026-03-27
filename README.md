# Receipt Bot

Standalone Telegram bot + web dashboard for receipt extraction. The bot parses receipts via LLM (OpenRouter) and a Next.js dashboard lets you view and manage them. Receipts are stored as JSON files in a `receipts/` directory.

## Quick Start

1. Create a Telegram bot via [@BotFather](https://t.me/BotFather) and get the token
2. Get an OpenRouter API key from [openrouter.ai](https://openrouter.ai)
3. Copy `.env.example` to `.env` and fill in both keys
4. Start the bot:
   ```bash
   cd bot && npm install && npm run dev
   ```
5. Start the dashboard:
   ```bash
   cd dashboard && npm install && npm run dev
   ```
6. Send a photo of a receipt to your bot on Telegram
7. View it on the dashboard at http://localhost:3000

## Architecture

- **Bot** (port 3200) — grammY + Express, polling mode by default
- **Dashboard** (port 3000) — Next.js + shadcn/ui
- **Storage** — flat JSON files in `receipts/`, images in `receipts/images/`

## Development

```bash
# Terminal 1 — Bot
cd bot && npm run dev

# Terminal 2 — Dashboard
cd dashboard && npm run dev
```

## Production

```bash
# Bot
cd bot && npm run build && npm start

# Dashboard
cd dashboard && npm run build && npm start
```

For webhook mode, set `WEBHOOK_URL` in `.env` to your public URL + `/webhook`.
