"""
Единое место чтения токена бота для Railway / локально.
Поддержка: переменные с разными именами, файл BOT_TOKEN_FILE, эвристика по формату.
"""
from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Optional

# Типичный вид: 123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx_x
_TOKEN_RE = re.compile(r"^\d{6,20}:[A-Za-z0-9_-]{20,128}$")


def _clean(raw: object) -> str:
    if raw is None:
        return ""
    s = str(raw).strip()
    if len(s) >= 2 and s[0] == s[-1] and s[0] in "\"'":
        s = s[1:-1].strip()
    return s


def _from_named_env() -> Optional[str]:
    keys = (
        "BOT_TOKEN",
        "TOKEN",
        "TELEGRAM_BOT_TOKEN",
        "TELEGRAM_TOKEN",
        "TG_BOT_TOKEN",
        "TG_TOKEN",
    )
    for key in keys:
        t = _clean(os.environ.get(key, ""))
        if t:
            return t
    return None


def _from_token_file() -> Optional[str]:
    path = os.environ.get("BOT_TOKEN_FILE", "").strip()
    if not path:
        base = Path(__file__).resolve().parent
        for candidate in (
            base / ".bot_token",
            base / "bot_token.txt",
            Path("/run/secrets/bot_token"),
        ):
            if candidate.is_file():
                path = str(candidate)
                break
        else:
            return None
    try:
        t = _clean(Path(path).read_text(encoding="utf-8"))
        return t or None
    except OSError:
        return None


def _from_env_heuristic() -> Optional[str]:
    """Ключ назван иначе, но в имени есть BOT/TG/TELEGRAM/TOKEN и значение похоже на токен."""
    for k, v in os.environ.items():
        kl = k.upper()
        if not any(s in kl for s in ("BOT", "TG", "TELEGRAM", "TOKEN", "FATHER")):
            continue
        t = _clean(v)
        if t and _TOKEN_RE.match(t):
            return t
    return None


def resolve_bot_token() -> Optional[str]:
    for fn in (_from_named_env, _from_token_file, _from_env_heuristic):
        t = fn()
        if t:
            return t
    return None


def env_token_hint() -> str:
    keys = sorted(k for k in os.environ if "TOKEN" in k.upper())
    if keys:
        return f"переменные с TOKEN в имени: {keys} (если список пустой после деплоя — переменная не попала в сервис web)"
    return "ни одной переменной *TOKEN* в окружении — создай BOT_TOKEN у сервиса **web**, сделай Redeploy"
