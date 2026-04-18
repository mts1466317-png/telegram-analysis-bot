from flask import Flask, request
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, CallbackQueryHandler, filters
import asyncio
import os

from bot import start, handle_text, main_menu_callback

TOKEN = os.getenv("TOKEN")

app = Flask(__name__)

# создаём event loop
loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)

# создаём приложение
tg_app = ApplicationBuilder().token(TOKEN).build()

tg_app.add_handler(CommandHandler("start", start))
tg_app.add_handler(CallbackQueryHandler(main_menu_callback))
tg_app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))

# 🔥 ВАЖНО: инициализация при старте
loop.run_until_complete(tg_app.initialize())
loop.run_until_complete(tg_app.start())


@app.route("/", methods=["POST"])
def webhook():
    try:
        data = request.get_json(force=True)
        print("🔥 GOT UPDATE:", data)

        update = Update.de_json(data, tg_app.bot)

        loop.run_until_complete(tg_app.process_update(update))

        return "ok"
    except Exception as e:
        print("❌ Webhook error:", e)
        return "error", 500