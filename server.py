from flask import Flask, request
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes
import os
import asyncio

app = Flask(__name__)

TOKEN = os.getenv("TOKEN")

application = ApplicationBuilder().token(TOKEN).build()

# ===== ЛОГИКА БОТА =====
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    print("🔥 /start received")
    await update.message.reply_text("Бот работает через webhook 🚀")

application.add_handler(CommandHandler("start", start))

# ===== WEBHOOK =====
@app.route("/", methods=["POST"])
def webhook():
    data = request.get_json()

    update = Update.de_json(data, application.bot)

    asyncio.run(process(update))

    return "ok"

async def process(update):
    await application.initialize()
    await application.process_update(update)

# ===== ПРОВЕРКА =====
@app.route("/", methods=["GET"])
def index():
    return "Bot is running"

# ===== ЗАПУСК =====
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)