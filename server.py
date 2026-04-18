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

# создаём Telegram приложение

tg_app = ApplicationBuilder().token(TOKEN).build()

# регистрируем обработчики

tg_app.add_handler(CommandHandler("start", start))

tg_app.add_handler(CallbackQueryHandler(main_menu_callback))

tg_app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))

# 🔥 Webhook endpoint (Telegram шлёт сюда)

@app.route("/", methods=["POST"])

def webhook():

    try:

        data = request.get_json(force=True)

        if not data:

            return "no data", 400

        update = Update.de_json(data, tg_app.bot)

        # безопасный запуск async

        asyncio.run(tg_app.process_update(update))

        return "ok", 200

    except Exception as e:

        print("❌ Webhook error:", e)

        return "error", 500

# 👉 чтобы Railway видел, что сервер жив

@app.route("/", methods=["GET"])

def health():

    return "Bot is running 🚀", 200

# 🔥 КРИТИЧЕСКИ ВАЖНО

if __name__ == "__main__":

    port = int(os.environ.get("PORT", 8000))

    app.run(host="0.0.0.0", port=port)