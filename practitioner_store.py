"""
PostgreSQL layer: practitioner monthly subscription + usage stats.
Falls back to no-op when DATABASE_URL is unset or psycopg2 unavailable.
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any, Literal, Optional

_STORE_READY = False
_STORE_ENABLED = False
_PSYCOPG_IMPORT_ERROR: Optional[Exception] = None

try:
    import psycopg2  # type: ignore
except Exception as exc:  # pragma: no cover
    psycopg2 = None  # type: ignore
    _PSYCOPG_IMPORT_ERROR = exc

PLAN_PRACTITIONER_MONTHLY = "practitioner_monthly"


def _database_url() -> str:
    return os.getenv("DATABASE_URL", "").strip()


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def init_practitioner_store() -> None:
    global _STORE_READY, _STORE_ENABLED
    if _STORE_READY:
        return
    _STORE_READY = True

    db_url = _database_url()
    if not db_url:
        print("ℹ️ practitioner_store: DATABASE_URL not set, practitioner persistence disabled")
        return
    if psycopg2 is None:
        print(f"⚠️ practitioner_store: psycopg2 unavailable ({_PSYCOPG_IMPORT_ERROR}), disabled")
        return

    try:
        with psycopg2.connect(db_url, connect_timeout=3) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS practitioner_subscription (
                        telegram_user_id BIGINT PRIMARY KEY,
                        plan TEXT NOT NULL DEFAULT 'practitioner_monthly',
                        status TEXT NOT NULL,
                        current_period_end TIMESTAMPTZ NOT NULL,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        payment_ref TEXT,
                        approved_by BIGINT
                    )
                    """
                )
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS practitioner_stats (
                        telegram_user_id BIGINT PRIMARY KEY,
                        passports_created INT NOT NULL DEFAULT 0,
                        users_processed INT NOT NULL DEFAULT 0,
                        last_activity_at TIMESTAMPTZ,
                        activated_at TIMESTAMPTZ
                    )
                    """
                )
        _STORE_ENABLED = True
        print("✅ practitioner_store: tables ready")
    except Exception as exc:
        print(f"⚠️ practitioner_store: init failed ({exc}), disabled")


def has_practitioner_access(user_id: int) -> bool:
    if not _STORE_ENABLED or not user_id:
        return False
    try:
        with psycopg2.connect(_database_url(), connect_timeout=3) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT current_period_end FROM practitioner_subscription
                    WHERE telegram_user_id = %s AND plan = %s
                    """,
                    (user_id, PLAN_PRACTITIONER_MONTHLY),
                )
                row = cur.fetchone()
        if not row or row[0] is None:
            return False
        end = row[0]
        if getattr(end, "tzinfo", None) is None:
            end = end.replace(tzinfo=timezone.utc)
        return end > _now_utc()
    except Exception as exc:
        print(f"⚠️ practitioner_store: has_practitioner_access failed ({exc})")
        return False


PractitionerState = Literal["none", "active", "expired"]


def get_practitioner_subscription_state(user_id: int) -> PractitionerState:
    if not _STORE_ENABLED or not user_id:
        return "none"
    try:
        with psycopg2.connect(_database_url(), connect_timeout=3) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT current_period_end FROM practitioner_subscription
                    WHERE telegram_user_id = %s AND plan = %s
                    """,
                    (user_id, PLAN_PRACTITIONER_MONTHLY),
                )
                row = cur.fetchone()
        if not row:
            return "none"
        end = row[0]
        if end is None:
            return "none"
        if getattr(end, "tzinfo", None) is None:
            end = end.replace(tzinfo=timezone.utc)
        return "active" if end > _now_utc() else "expired"
    except Exception as exc:
        print(f"⚠️ practitioner_store: get_practitioner_subscription_state failed ({exc})")
        return "none"


def extend_practitioner_subscription(
    user_id: int,
    *,
    approved_by: int | None,
    payment_ref: str | None = None,
    days: int = 30,
) -> Optional[datetime]:
    """
    Sets or extends subscription by `days` days from max(existing_end, now).
    Returns new current_period_end (aware UTC) or None on failure / disabled store.
    """
    if not _STORE_ENABLED or not user_id:
        return None
    if days <= 0:
        return None
    now = _now_utc()
    try:
        with psycopg2.connect(_database_url(), connect_timeout=3) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT current_period_end FROM practitioner_subscription
                    WHERE telegram_user_id = %s
                    """,
                    (user_id,),
                )
                row = cur.fetchone()
                old_end: datetime | None = row[0] if row else None
                if old_end is not None and getattr(old_end, "tzinfo", None) is None:
                    old_end = old_end.replace(tzinfo=timezone.utc)
                base = now
                if old_end is not None:
                    base = max(old_end, now)
                new_end = base + timedelta(days=days)

                cur.execute(
                    """
                    INSERT INTO practitioner_subscription (
                        telegram_user_id, plan, status, current_period_end,
                        created_at, updated_at, payment_ref, approved_by
                    )
                    VALUES (%s, %s, 'active', %s, NOW(), NOW(), %s, %s)
                    ON CONFLICT (telegram_user_id) DO UPDATE SET
                        plan = EXCLUDED.plan,
                        status = 'active',
                        current_period_end = EXCLUDED.current_period_end,
                        updated_at = NOW(),
                        payment_ref = COALESCE(EXCLUDED.payment_ref, practitioner_subscription.payment_ref),
                        approved_by = COALESCE(EXCLUDED.approved_by, practitioner_subscription.approved_by)
                    """,
                    (
                        user_id,
                        PLAN_PRACTITIONER_MONTHLY,
                        new_end,
                        payment_ref or "manual",
                        approved_by,
                    ),
                )

                cur.execute(
                    """
                    INSERT INTO practitioner_stats (telegram_user_id, activated_at)
                    VALUES (%s, NOW())
                    ON CONFLICT (telegram_user_id) DO NOTHING
                    """
                    ,
                    (user_id,),
                )
                cur.execute(
                    """
                    UPDATE practitioner_stats
                    SET activated_at = COALESCE(activated_at, NOW())
                    WHERE telegram_user_id = %s AND activated_at IS NULL
                    """,
                    (user_id,),
                )
            conn.commit()
        return new_end
    except Exception as exc:
        print(f"⚠️ practitioner_store: extend_practitioner_subscription failed ({exc})")
        return None


def get_practitioner_stats(user_id: int) -> dict[str, Any]:
    """Returns counters for UX; zeros when disabled or no row."""
    empty = {
        "passports_created": 0,
        "users_processed": 0,
        "last_activity_at": None,
        "activated_at": None,
    }
    if not _STORE_ENABLED or not user_id:
        return empty
    try:
        with psycopg2.connect(_database_url(), connect_timeout=3) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT passports_created, users_processed, last_activity_at, activated_at
                    FROM practitioner_stats WHERE telegram_user_id = %s
                    """,
                    (user_id,),
                )
                row = cur.fetchone()
        if not row:
            return empty
        return {
            "passports_created": int(row[0] or 0),
            "users_processed": int(row[1] or 0),
            "last_activity_at": row[2],
            "activated_at": row[3],
        }
    except Exception as exc:
        print(f"⚠️ practitioner_store: get_practitioner_stats failed ({exc})")
        return empty


def increment_practitioner_usage_after_pdf(user_id: int) -> None:
    if not _STORE_ENABLED or not user_id:
        return
    try:
        with psycopg2.connect(_database_url(), connect_timeout=3) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO practitioner_stats (
                        telegram_user_id, passports_created, users_processed, last_activity_at
                    )
                    VALUES (%s, 1, 1, NOW())
                    ON CONFLICT (telegram_user_id) DO UPDATE SET
                        passports_created = practitioner_stats.passports_created + 1,
                        users_processed = practitioner_stats.users_processed + 1,
                        last_activity_at = NOW()
                    """,
                    (user_id,),
                )
            conn.commit()
    except Exception as exc:
        print(f"⚠️ practitioner_store: increment_practitioner_usage_after_pdf failed ({exc})")


def revoke_practitioner_subscription(user_id: int) -> bool:
    """Hard-delete subscription row. Stats are preserved. Returns True if a row was deleted."""
    if not _STORE_ENABLED or not user_id:
        return False
    try:
        with psycopg2.connect(_database_url(), connect_timeout=3) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM practitioner_subscription WHERE telegram_user_id = %s",
                    (user_id,),
                )
                deleted = cur.rowcount or 0
            conn.commit()
        return deleted > 0
    except Exception as exc:
        print(f"⚠️ practitioner_store: revoke_practitioner_subscription failed ({exc})")
        return False


def get_practitioner_subscription_details(user_id: int) -> Optional[dict[str, Any]]:
    if not _STORE_ENABLED or not user_id:
        return None
    try:
        with psycopg2.connect(_database_url(), connect_timeout=3) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT plan, status, current_period_end, created_at, updated_at,
                           payment_ref, approved_by
                    FROM practitioner_subscription
                    WHERE telegram_user_id = %s
                    """,
                    (user_id,),
                )
                row = cur.fetchone()
        if not row:
            return None
        end = row[2]
        if end is not None and getattr(end, "tzinfo", None) is None:
            end = end.replace(tzinfo=timezone.utc)
        return {
            "plan": row[0],
            "status": row[1],
            "current_period_end": end,
            "created_at": row[3],
            "updated_at": row[4],
            "payment_ref": row[5],
            "approved_by": row[6],
            "active": bool(end and end > _now_utc()),
        }
    except Exception as exc:
        print(f"⚠️ practitioner_store: get_practitioner_subscription_details failed ({exc})")
        return None


def list_active_practitioner_subscriptions(limit: int = 50) -> list[dict[str, Any]]:
    if not _STORE_ENABLED:
        return []
    try:
        with psycopg2.connect(_database_url(), connect_timeout=3) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT telegram_user_id, plan, current_period_end
                    FROM practitioner_subscription
                    WHERE current_period_end > NOW()
                    ORDER BY current_period_end ASC
                    LIMIT %s
                    """,
                    (limit,),
                )
                rows = cur.fetchall() or []
        result: list[dict[str, Any]] = []
        for r in rows:
            end = r[2]
            if end is not None and getattr(end, "tzinfo", None) is None:
                end = end.replace(tzinfo=timezone.utc)
            result.append(
                {
                    "telegram_user_id": int(r[0]),
                    "plan": r[1],
                    "current_period_end": end,
                }
            )
        return result
    except Exception as exc:
        print(f"⚠️ practitioner_store: list_active_practitioner_subscriptions failed ({exc})")
        return []


def practitioner_days_in_system(user_id: int) -> int:
    st = get_practitioner_stats(user_id)
    act = st.get("activated_at")
    if not act:
        return 0
    if getattr(act, "tzinfo", None) is None:
        act = act.replace(tzinfo=timezone.utc)
    delta = _now_utc() - act
    return max(1, delta.days + 1)
