import json
import os
from typing import Optional

_STORE_READY = False
_STORE_ENABLED = False
_PSYCOPG_IMPORT_ERROR: Optional[Exception] = None

try:
    import psycopg2  # type: ignore
except Exception as exc:  # pragma: no cover - environment dependent
    psycopg2 = None  # type: ignore
    _PSYCOPG_IMPORT_ERROR = exc


def _database_url() -> str:
    return os.getenv("DATABASE_URL", "").strip()


def init_snapshot_store() -> None:
    global _STORE_READY, _STORE_ENABLED
    if _STORE_READY:
        return
    _STORE_READY = True

    db_url = _database_url()
    if not db_url:
        print("ℹ️ snapshot_store: DATABASE_URL not set, running in memory-only mode")
        return
    if psycopg2 is None:
        print(f"⚠️ snapshot_store: psycopg2 unavailable ({_PSYCOPG_IMPORT_ERROR}), persistence disabled")
        return

    try:
        with psycopg2.connect(db_url, connect_timeout=3) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS soul_last_snapshot (
                        telegram_user_id BIGINT PRIMARY KEY,
                        last_snapshot_payload JSONB NOT NULL,
                        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        last_level_selection INTEGER NULL
                    )
                    """
                )
        _STORE_ENABLED = True
        print("✅ snapshot_store: persistence initialized")
    except Exception as exc:
        print(f"⚠️ snapshot_store: init failed ({exc}), persistence disabled")


def load_last_snapshot(user_id: int) -> Optional[dict]:
    if not _STORE_ENABLED or not user_id:
        return None
    try:
        with psycopg2.connect(_database_url(), connect_timeout=3) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT last_snapshot_payload FROM soul_last_snapshot WHERE telegram_user_id = %s",
                    (user_id,),
                )
                row = cur.fetchone()
        if not row:
            return None
        payload = row[0]
        if isinstance(payload, str):
            return json.loads(payload)
        return payload
    except Exception as exc:
        print(f"⚠️ snapshot_store: load failed for {user_id} ({exc})")
        return None


def save_last_snapshot(user_id: int, payload: dict, last_level_selection: int | None = None) -> None:
    if not _STORE_ENABLED or not user_id or not payload:
        return
    try:
        serialized = json.dumps(payload, ensure_ascii=False)
        with psycopg2.connect(_database_url(), connect_timeout=3) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO soul_last_snapshot (telegram_user_id, last_snapshot_payload, updated_at, last_level_selection)
                    VALUES (%s, %s::jsonb, NOW(), %s)
                    ON CONFLICT (telegram_user_id)
                    DO UPDATE SET
                        last_snapshot_payload = EXCLUDED.last_snapshot_payload,
                        updated_at = NOW(),
                        last_level_selection = COALESCE(EXCLUDED.last_level_selection, soul_last_snapshot.last_level_selection)
                    """,
                    (user_id, serialized, last_level_selection),
                )
    except Exception as exc:
        print(f"⚠️ snapshot_store: save failed for {user_id} ({exc})")
