"""User-facing UI strings for RU and EN bots (same structure, different copy)."""
from __future__ import annotations

from app_locale import get_locale

UI = {
    "ru": {
        "start_welcome": "В твоих инициалах и дате рождения уже хранятся все ответы🌟",
        "btn_get_passport": "Получить мой Паспорт Души",
        "btn_partners": "🌛Партнерам и практикам🌜",
        "btn_passport_self": "💌 Паспорт для себя",
        "btn_i_paid": "✅ Я оплатил",
        "btn_copy_card": "📋 Скопировать номер карты",
        "birth_prompt": (
            "Введите данные одной строкой из актуального паспорта:\n"
            "Фамилия Имя Отчество ДД.ММ.ГГГГ\n\n"
            "Пример (русский алфавит):\nИванов Иван Иванович 12.05.1991\n\n"
            "Пример (английский алфавит):\nSmith John Michael 12.05.1991\n\n"
            "Алфавит определяется автоматически по буквам в ФИО."
        ),
        "input_format_error": (
            "❌ Неверный формат.\n\n"
            "Введи одной строкой:\n"
            "Фамилия Имя Отчество ДД.ММ.ГГГГ\n\n"
            "Пример:\nИванов Иван Иванович 12.05.1991\n"
            "Или:\nSmith John Michael 12.05.1991"
        ),
        "paywall": (
            "К оплате 3333 рублей - за лучший инструмент для самопознания на всю жизнь\n"
            "Реквизиты:\n"
            "💳 Т-Банк: <code>2200 7008 8290 3809</code>\n"
            "💸 СБП: <code>89990238238</code>\n"
            "Получатель: Кристина Г.\n\n"
            "После перевода нажми «Я оплатил» — и мы сразу пришлем твой Паспорт."
        ),
        "label_manifestation": "🔹 Как проявляется:",
        "label_risks": "⚠️ Риски:",
        "label_recommendations": "✅ Рекомендации:",
        "label_focus": "🎯 Фокус периода:",
        "label_social_impl": "🔹 Как задача реализуется в социуме:",
        "label_professions": "💼 Профессии и сферы реализации:",
        "master_boost": "\n\n✨ Мастер-вибрация усиливает влияние.",
        "master_cycle": "\n\n✨ Мастер-цикл — судьбоносный период.",
        "section_physical": "Физическое тело",
        "section_astral": "Астральное тело",
        "section_mental": "Ментальное тело",
        "section_life": "Жизненная задача",
        "section_egregor": "Родовой эгрегор",
        "section_higher": "Высшее Я",
        "section_program": "Родовая программа",
        "section_social": "Социальная задача",
        "section_combo": "Сочетание задач",
        "section_cycle": "Текущий 7-летний цикл",
        "planet_prefix": "Планета:",
        "pdf_title": "Паспорт Души",
        "alphabet_mixed_error": (
            "❌ Смешанный алфавит в ФИО.\n"
            "Используйте только русский или только английский алфавит."
        ),
        "alphabet_cyrillic_required_hint": "",
    },
    "en": {
        "start_welcome": "Your initials and date of birth already hold all the answers🌟",
        "btn_get_passport": "Get my Soul Passport",
        "btn_partners": "🌛 Partners & practitioners 🌜",
        "btn_passport_self": "💌 Passport for myself",
        "btn_i_paid": "✅ I paid",
        "btn_copy_card": "📋 Copy card number",
        "birth_prompt": (
            "Enter your details in one line from your current legal ID / passport:\n"
            "Last First [Middle] DD.MM.YYYY\n\n"
            "Middle name is optional.\n\n"
            "Example:\nSmith John Michael 12.05.1991\n"
            "Example without middle name:\nSmith John 12.05.1991\n\n"
            "Use the Latin alphabet only."
        ),
        "input_format_error": (
            "❌ Invalid format.\n\n"
            "Enter one line:\n"
            "Last First [Middle] DD.MM.YYYY\n\n"
            "Example:\nSmith John Michael 12.05.1991\n"
            "Or:\nSmith John 12.05.1991"
        ),
        "paywall": (
            "Payment due: $49 — the best lifelong tool for self-knowledge\n"
            "Payment details:\n"
            "💳 T-Bank: <code>2200 7008 8290 3809</code>\n"
            "💸 SBP: <code>89990238238</code>\n"
            "Recipient: Kristina G.\n\n"
            "After transfer tap «I paid» — and we will send your Passport right away."
        ),
        "label_manifestation": "🔹 How it shows up:",
        "label_risks": "⚠️ Risks:",
        "label_recommendations": "✅ Recommendations:",
        "label_focus": "🎯 Focus of the period:",
        "label_social_impl": "🔹 How the task plays out in society:",
        "label_professions": "💼 Professions and fields of expression:",
        "master_boost": "\n\n✨ A master vibration amplifies the influence.",
        "master_cycle": "\n\n✨ A master cycle is a destiny-level period.",
        "section_physical": "Physical body",
        "section_astral": "Astral body",
        "section_mental": "Mental body",
        "section_life": "Life task",
        "section_egregor": "Ancestral egregore",
        "section_higher": "Higher Self",
        "section_program": "Ancestral program",
        "section_social": "Social task",
        "section_combo": "Task combination",
        "section_cycle": "Current 7-year cycle",
        "planet_prefix": "Planet:",
        "pdf_title": "Soul Passport",
        "alphabet_mixed_error": (
            "❌ Mixed alphabets in the name.\n"
            "Please use Latin letters only for this bot."
        ),
        "alphabet_cyrillic_required_hint": (
            "❌ Please use Latin letters only (English spelling of the name)."
        ),
    },
}


def t(key: str) -> str:
    locale = get_locale()
    pack = UI.get(locale) or UI["ru"]
    if key in pack:
        return pack[key]
    return UI["ru"].get(key, key)
