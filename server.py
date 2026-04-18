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
import traceback

from bot import start, handle_text, main_menu_callback

# 🔥 берём токен из Railway Variables
TOKEN = os.getenv("TOKEN")
print("🔑 TOKEN:", TOKEN)

app = Flask(__name__)

# ✅ один стабильный event loop
loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)

# ✅ создаём Telegram приложение
tg_app = ApplicationBuilder().token(TOKEN).build()

# ✅ регистрируем handlers
tg_app.add_handler(CommandHandler("start", start))
tg_app.add_handler(CallbackQueryHandler(main_menu_callback))
tg_app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))

# ✅ инициализация (ВАЖНО)
loop.run_until_complete(tg_app.initialize())


# 🔥 webhook endpoint
@app.route("/", methods=["POST"])
def webhook():
    try:
        data = request.get_json(force=True)
        print("🔥 UPDATE RECEIVED:", data)

        update = Update.de_json(data, tg_app.bot)

        loop.run_until_complete(tg_app.process_update(update))

        return "ok", 200

    except Exception as e:
        print("❌ WEBHOOK ERROR:")
        traceback.print_exc()
        return "error", 500


# ✅ health check (чтобы Railway не убивал сервис)
@app.route("/", methods=["GET"])
def health():
    return "Bot is running 🚀", 200


# ✅ запуск сервера
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port)