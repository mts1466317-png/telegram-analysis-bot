from flask import Flask, request
from telegram import Update
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    filters,
)
import asyncio
import os

from bot import start, handle_text, main_menu_callback

TOKEN = os.getenv("TOKEN")

app = Flask(__name__)

tg_app = ApplicationBuilder().token(TOKEN).build()

# handlers
tg_app.add_handler(CommandHandler("start", start))
tg_app.add_handler(CallbackQueryHandler(main_menu_callback))
tg_app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))


# 🔥 ИНИЦИАЛИЗАЦИЯ (ВОТ ЭТО КЛЮЧ)
async def init_telegram():
    await tg_app.initialize()


# запускаем при старте
asyncio.run(init_telegram())


@app.route("/", methods=["POST"])
def webhook():
    try:
        data = request.get_json(force=True)

        print("🔥 GOT UPDATE:", data)

        update = Update.de_json(data, tg_app.bot)

        asyncio.run(tg_app.process_update(update))

        return "ok", 200

    except Exception as e:
        print("❌ Webhook error:", e)
        return "error", 500


@app.route("/", methods=["GET"])
def health():
    return "Bot is running 🚀", 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port)