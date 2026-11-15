"""
Locale switch for RU / EN bots from the same codebase.

Railway:
  - service web     → APP_LOCALE=ru (default) + RU BOT_TOKEN
  - service web-en  → APP_LOCALE=en + EN BOT_TOKEN
"""
from __future__ import annotations

import os
from typing import Dict

_SUPPORTED = {"ru", "en"}


def get_locale() -> str:
    raw = (os.getenv("APP_LOCALE") or os.getenv("BOT_LOCALE") or "ru").strip().lower()
    if raw in ("eng", "english", "en-us", "en_us"):
        return "en"
    if raw in ("rus", "russian", "ru-ru", "ru_ru"):
        return "ru"
    return raw if raw in _SUPPORTED else "ru"


def is_en() -> bool:
    return get_locale() == "en"


def is_ru() -> bool:
    return get_locale() == "ru"


# Canonical planet keys used for content lookup (language-agnostic).
PLANET_KEYS = {
    1: "sun",
    2: "moon",
    3: "mercury",
    4: "venus",
    5: "mars",
    6: "jupiter",
    7: "saturn",
    8: "uranus",
    9: "neptune",
    11: "moon_master",
    22: "venus_master",
    33: "jupiter_master",
    44: "uranus_master",
    55: "sun_master",
    66: "mercury_master",
    77: "mars_master",
    88: "saturn_master",
    99: "neptune_master",
}

PLANET_LABELS_RU: Dict[int, str] = {
    1: "Солнце",
    2: "Луна",
    3: "Меркурий",
    4: "Венера",
    5: "Марс",
    6: "Юпитер",
    7: "Сатурн",
    8: "Уран",
    9: "Нептун",
    11: "Луна (мастер)",
    22: "Венера (мастер)",
    33: "Юпитер (мастер)",
    44: "Уран (мастер)",
    55: "Солнце (мастер)",
    66: "Меркурий (мастер)",
    77: "Марс (мастер)",
    88: "Сатурн (мастер)",
    99: "Нептун (мастер)",
}

PLANET_LABELS_EN: Dict[int, str] = {
    1: "Sun",
    2: "Moon",
    3: "Mercury",
    4: "Venus",
    5: "Mars",
    6: "Jupiter",
    7: "Saturn",
    8: "Uranus",
    9: "Neptune",
    11: "Moon (master)",
    22: "Venus (master)",
    33: "Jupiter (master)",
    44: "Uranus (master)",
    55: "Sun (master)",
    66: "Mercury (master)",
    77: "Mars (master)",
    88: "Saturn (master)",
    99: "Neptune (master)",
}

# Map legacy RU planet labels → canonical keys (for existing RU content dicts).
RU_LABEL_TO_KEY = {}
for num, label in PLANET_LABELS_RU.items():
    RU_LABEL_TO_KEY[label] = PLANET_KEYS[num]
    base = label.replace(" (мастер)", "")
    if num <= 9:
        RU_LABEL_TO_KEY[base] = PLANET_KEYS[num]


def planet_label(num: int) -> str:
    table = PLANET_LABELS_EN if is_en() else PLANET_LABELS_RU
    return table.get(num, str(num))


def planet_key(num: int) -> str:
    return PLANET_KEYS.get(num, str(num))


def base_planet_key(num: int) -> str:
    """Master numbers resolve to their base planet key for fallback copy."""
    key = planet_key(num)
    if key.endswith("_master"):
        return key[: -len("_master")]
    return key
