"""Паспорт, начатый на сайте: код связывает браузер с подтверждением оплаты в Telegram."""
import json
import os
from typing import Optional

_STORE_READY = False
_STORE_ENABLED = False

try:
    import psycopg2  # type: ignore
except Exception:
    psycopg2 = None  # type: ignore


def _database_url() -> str:
    return os.getenv("DATABASE_URL", "").strip()


def init_site_pass() -> None:
    global _STORE_READY, _STORE_ENABLED
    if _STORE_READY:
        return
    _STORE_READY = True
    db_url = _database_url()
    if not db_url or psycopg2 is None:
        print("ℹ️ site_pass: persistence disabled")
        return
    try:
        with psycopg2.connect(db_url, connect_timeout=3) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS site_passport_pass (
                        code TEXT PRIMARY KEY,
                        profile JSONB NOT NULL,
                        paid BOOLEAN NOT NULL DEFAULT FALSE,
                        telegram_user_id BIGINT NULL,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        paid_at TIMESTAMPTZ NULL
                    )
                    """
                )
        _STORE_ENABLED = True
        print("✅ site_pass: persistence initialized")
    except Exception as exc:
        print(f"⚠️ site_pass: init failed ({exc})")


def save_site_pass(code: str, profile: dict) -> None:
    init_site_pass()
    if not _STORE_ENABLED:
        return
    try:
        serialized = json.dumps(profile, ensure_ascii=False)
        with psycopg2.connect(_database_url(), connect_timeout=3) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO site_passport_pass (code, profile, paid)
                    VALUES (%s, %s::jsonb, FALSE)
                    ON CONFLICT (code) DO NOTHING
                    """,
                    (code, serialized),
                )
    except Exception as exc:
        print(f"⚠️ site_pass: save failed ({exc})")


def load_site_pass(code: str) -> Optional[dict]:
    init_site_pass()
    if not _STORE_ENABLED or not code:
        return None
    try:
        with psycopg2.connect(_database_url(), connect_timeout=3) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT profile, paid FROM site_passport_pass WHERE code = %s",
                    (code,),
                )
                row = cur.fetchone()
        if not row:
            return None
        profile = row[0]
        if isinstance(profile, str):
            profile = json.loads(profile)
        return {"profile": profile, "paid": bool(row[1])}
    except Exception as exc:
        print(f"⚠️ site_pass: load failed ({exc})")
        return None


def bind_site_pass_user(code: str, telegram_user_id: int | None) -> None:
    """Привязать код сайта к Telegram ещё до подтверждения оплаты."""
    init_site_pass()
    if not _STORE_ENABLED or not code or not telegram_user_id:
        return
    try:
        with psycopg2.connect(_database_url(), connect_timeout=3) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE site_passport_pass
                    SET telegram_user_id = %s
                    WHERE code = %s
                    """,
                    (telegram_user_id, code),
                )
    except Exception as exc:
        print(f"⚠️ site_pass: bind user failed ({exc})")


def mark_site_pass_paid(code: str, telegram_user_id: int | None = None) -> None:
    init_site_pass()
    if not code:
        return
    if not _STORE_ENABLED:
        return
    try:
        with psycopg2.connect(_database_url(), connect_timeout=3) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE site_passport_pass
                    SET paid = TRUE,
                        paid_at = NOW(),
                        telegram_user_id = COALESCE(%s, telegram_user_id)
                    WHERE code = %s
                    """,
                    (telegram_user_id, code),
                )
    except Exception as exc:
        print(f"⚠️ site_pass: mark paid failed ({exc})")


def mark_unpaid_site_passes(telegram_user_id: int | None) -> list[str]:
    """Открыть все ещё не оплаченные паспорта, которые этот человек начал с сайта."""
    init_site_pass()
    if not _STORE_ENABLED or not telegram_user_id:
        return []
    try:
        with psycopg2.connect(_database_url(), connect_timeout=3) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE site_passport_pass
                    SET paid = TRUE,
                        paid_at = NOW()
                    WHERE telegram_user_id = %s AND paid = FALSE
                    RETURNING code
                    """,
                    (telegram_user_id,),
                )
                rows = cur.fetchall()
        return [str(row[0]) for row in rows]
    except Exception as exc:
        print(f"⚠️ site_pass: mark user failed ({exc})")
        return []
