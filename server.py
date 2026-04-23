import asyncio
import os
import threading
import traceback
from typing import Optional

from flask import Flask, request
from telegram import Update
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    filters,
)

from env_token import env_token_hint, resolve_bot_token

# По этому маркеру в логах видно, что задеплоена актуальная версия (не старый server.py:27)
print("📌 boot server.py (env_token resolver v2026-04-19)")
print(
    f"📌 env check: PORT={'yes' if os.getenv('PORT') else 'no'}, "
    f"RAILWAY_ENVIRONMENT={os.getenv('RAILWAY_ENVIRONMENT', '')!r}"
)

TOKEN = resolve_bot_token()
print(f"🔑 TOKEN: {'установлен' if TOKEN else 'ОТСУТСТВУЕТ'}")

if not TOKEN:
    raise RuntimeError(
        "Токен бота не найден в окружении процесса.\n"
        "1) Railway → сервис **web** → Variables → создай BOT_TOKEN = токен от @BotFather.\n"
        "2) Убедись, что переменная не только в «Project», а доступна именно сервису web (Redeploy).\n"
        "3) Опционально: файл BOT_TOKEN_FILE=/path или секрет в .bot_token рядом с приложением.\n"
        f"Диагностика: {env_token_hint()}"
    )

os.environ["BOT_TOKEN"] = TOKEN

from bot import start, handle_text, main_menu_callback, admin_payment_callback, portal_callback_router

# Один event loop в отдельном потоке (Flask воркеры в разных потоках).
_app_loop: Optional[asyncio.AbstractEventLoop] = None
_loop_ready = threading.Event()


def _run_event_loop():
    global _app_loop
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    _app_loop = loop
    _loop_ready.set()
    loop.run_forever()


threading.Thread(target=_run_event_loop, name="ptb-async-loop", daemon=True).start()
_loop_ready.wait()

if _app_loop is None:
    raise RuntimeError("Asyncio event loop failed to start")

tg_app = ApplicationBuilder().token(TOKEN).build()
tg_app.add_handler(CommandHandler("start", start))
tg_app.add_handler(CallbackQueryHandler(admin_payment_callback, pattern=r"^(approve|reject)_\d+$"))
tg_app.add_handler(CallbackQueryHandler(portal_callback_router, pattern=r"^(portal_|map_|library_|path_|community_|practice_|support_|daily_|guide_|channel_|continue_)"))
tg_app.add_handler(CallbackQueryHandler(main_menu_callback))
tg_app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))


def _run_on_loop(coro, timeout: float = 180.0):
    fut = asyncio.run_coroutine_threadsafe(coro, _app_loop)
    return fut.result(timeout=timeout)


_run_on_loop(tg_app.initialize())
_run_on_loop(tg_app.start())

app = Flask(__name__)


@app.route("/", methods=["POST"])
def webhook():
    try:
        data = request.get_json(force=True)
        print("🔥 UPDATE RECEIVED:", data)

        update = Update.de_json(data, tg_app.bot)

        _run_on_loop(tg_app.process_update(update))

        return "ok", 200

    except Exception as e:
        print("ERROR:", e)
        traceback.print_exc()
        return "error", 500


@app.route("/", methods=["GET"])
def health():
    return "Bot is running 🚀", 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port)
