import json
import os
from datetime import datetime, timezone
from typing import Any

_READY = False
_ENABLED = False
_IMPORT_ERROR: Exception | None = None

try:
    import psycopg2  # type: ignore
except Exception as exc:  # pragma: no cover
    psycopg2 = None  # type: ignore
    _IMPORT_ERROR = exc


def _db_url() -> str:
    return os.getenv("DATABASE_URL", "").strip()


def init_telemetry_store() -> None:
    global _READY, _ENABLED
    if _READY:
        return
    _READY = True

    if not _db_url():
        print("ℹ️ telemetry: DATABASE_URL not set, db sink disabled")
        return
    if psycopg2 is None:
        print(f"⚠️ telemetry: psycopg2 unavailable ({_IMPORT_ERROR}), db sink disabled")
        return

    try:
        with psycopg2.connect(_db_url(), connect_timeout=3) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS telemetry_events (
                        id BIGSERIAL PRIMARY KEY,
                        event_name TEXT NOT NULL,
                        telegram_user_id BIGINT NULL,
                        session_id TEXT NULL,
                        event_ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        source_layer TEXT NULL,
                        props JSONB NULL
                    )
                    """
                )
                cur.execute(
                    "CREATE INDEX IF NOT EXISTS idx_telemetry_events_ts ON telemetry_events (event_ts DESC)"
                )
                cur.execute(
                    "CREATE INDEX IF NOT EXISTS idx_telemetry_events_name_ts ON telemetry_events (event_name, event_ts DESC)"
                )
                cur.execute(
                    "CREATE INDEX IF NOT EXISTS idx_telemetry_events_user_ts ON telemetry_events (telegram_user_id, event_ts DESC)"
                )
        _ENABLED = True
        print("✅ telemetry: store initialized")
    except Exception as exc:
        print(f"⚠️ telemetry: init failed ({exc}), continuing without db sink")


def track_event(event_name: str, user_id: int | None = None, source_layer: str = "bot", props: dict[str, Any] | None = None) -> None:
    props = props or {}
    ts = datetime.now(timezone.utc).isoformat()
    log_payload = {
        "event": event_name,
        "user_id": user_id,
        "source_layer": source_layer,
        "ts": ts,
        "props": props,
    }
    try:
        print("📈 telemetry:", json.dumps(log_payload, ensure_ascii=False))
    except Exception:
        print(f"📈 telemetry: event={event_name} user_id={user_id} source={source_layer}")

    if not _ENABLED:
        return
    try:
        with psycopg2.connect(_db_url(), connect_timeout=3) as conn:  # type: ignore[arg-type]
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO telemetry_events (event_name, telegram_user_id, source_layer, props)
                    VALUES (%s, %s, %s, %s::jsonb)
                    """,
                    (event_name, user_id, source_layer, json.dumps(props, ensure_ascii=False)),
                )
    except Exception as exc:
        print(f"⚠️ telemetry: write failed for {event_name} ({exc})")
