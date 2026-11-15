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
        "date_format_error": (
            "Дата должна быть в формате ДД.ММ.ГГГГ\n\n"
            "Пример:\nИванов Иван Иванович 12.05.1991"
        ),
        "pdf_title": "Паспорт Души",
        "pdf_subtitle": "Персональный нумерологический отчёт",
        "pdf_birth": "Дата рождения: {birth_date}",
        "pdf_intro": (
            "Документ сформирован на основе ФИО и дате рождения. "
            "Ниже — сводная матрица сфер и развёрнутый текстовый разбор."
        ),
        "pdf_matrix": "Персональная матрица",
        "pdf_col_sphere": "СФЕРА",
        "pdf_col_vibration": "ВИБРАЦИЯ",
        "pdf_col_planet": "ПЛАНЕТА",
        "pdf_profile": "Итоговый профиль",
        "pdf_profile_intro": "Краткая карта вашего профиля по ключевым сферам и числовым акцентам:",
        "pdf_profile_line": "• {title} — вибрация {v} ({planet})",
        "pdf_profile_line_plain": "• {title} ({planet})",
        "pdf_age_line": (
            "Текущий расчётный возраст: {age} полных лет. "
            "Номер 7-летнего цикла: {cycle_number} "
            "(полоса {cycle_start_age}–{cycle_end_age} лет); "
            "энергия цикла — {cycle_energy} ({planet_cycle})."
        ),
        "pdf_share": (
            "Если разбор откликается, вы можете поделиться им с тем, кому сейчас важно "
            "лучше понять себя.\n\n"
            "Контакт: @GodStatistics_bot\n"
            "Статистика Души"
        ),
        "pdf_footer": "Статистика Души",
        "pdf_page": "Стр. {page}",
        "pdf_generating": "⏳ Генерирую PDF...",
        "pdf_ready_status": "✅ PDF готов",
        "pdf_failed": "❌ Не удалось создать PDF",
        "pdf_not_found": "❌ PDF не найден после генерации",
        "pdf_empty": "❌ PDF пустой",
        "pdf_too_big": "❌ PDF слишком большой",
        "pdf_caption": "Ваш персональный PDF-разбор готов.",
        "pdf_filename_suffix": "Паспорт Души.pdf",
        "payment_checking": "⏳ Проверяем оплату, это займёт до 1–2 минут",
        "payment_confirmed": "✅ Оплата подтверждена! Отправляю ваш Паспорт Души.",
        "payment_rejected": "❌ Платёж не подтверждён. Проверь перевод и попробуй снова.",
        "calc_not_found": "❌ Данные расчёта не найдены. Пожалуйста, сделай расчёт заново.",
        "pdf_create_failed": "❌ Не удалось создать PDF. Обратитесь в поддержку.",
        "pdf_error": "❌ Ошибка при генерации PDF. Обратитесь в поддержку.",
        "after_pdf": (
            "Запомни этот момент и воспользуйся полученной информацией со всей любовью и мудростью. "
            "Сейчас ты прикоснулся к более глубокому пониманию себя. "
            "Я рядом как проводник и понимаю, насколько ценно не потерять импульс 🤍\n\n"
            "Если почувствуешь отклик — продолжим путь в удобном для тебя формате 🙏"
        ),
        "btn_new_calc": "🔮 Новый расчет Паспорта Души",
        "btn_share": "📢 Поделиться с другом",
        "btn_feedback": "💬 Оставить отзыв",
        "btn_consult": "🕊 Записаться на личный разбор",
        "section_cycle_n": "Текущий 7-летний цикл ({n}-й)",
        "latin_only_error": "",
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
        "date_format_error": (
            "The date must be DD.MM.YYYY\n\n"
            "Example:\nSmith John 12.05.1991"
        ),
        "pdf_title": "Soul Passport",
        "pdf_subtitle": "Personal numerological report",
        "pdf_birth": "Date of birth: {birth_date}",
        "pdf_intro": (
            "This document is built from your legal name and date of birth. "
            "Below is the sphere matrix and the full written reading."
        ),
        "pdf_matrix": "Personal matrix",
        "pdf_col_sphere": "SPHERE",
        "pdf_col_vibration": "VIBRATION",
        "pdf_col_planet": "PLANET",
        "pdf_profile": "Final profile",
        "pdf_profile_intro": "A short map of your profile across the key spheres and number accents:",
        "pdf_profile_line": "• {title} — vibration {v} ({planet})",
        "pdf_profile_line_plain": "• {title} ({planet})",
        "pdf_age_line": (
            "Current calculated age: {age} full years. "
            "7-year cycle number: {cycle_number} "
            "(ages {cycle_start_age}–{cycle_end_age}); "
            "cycle energy — {cycle_energy} ({planet_cycle})."
        ),
        "pdf_share": (
            "If this reading resonates, you can share it with someone who needs "
            "a clearer view of themselves right now.\n\n"
            "Contact: @SoulPassportBot\n"
            "Soul Passport"
        ),
        "pdf_footer": "Soul Passport",
        "pdf_page": "Page {page}",
        "pdf_generating": "⏳ Creating your PDF...",
        "pdf_ready_status": "✅ PDF is ready",
        "pdf_failed": "❌ Could not create the PDF",
        "pdf_not_found": "❌ PDF was not found after generation",
        "pdf_empty": "❌ The PDF is empty",
        "pdf_too_big": "❌ The PDF is too large",
        "pdf_caption": "Your personal Soul Passport PDF is ready.",
        "pdf_filename_suffix": "Soul Passport.pdf",
        "payment_checking": "⏳ We are checking the payment. This takes up to 1–2 minutes.",
        "payment_confirmed": "✅ Payment confirmed. Sending your Soul Passport.",
        "payment_rejected": "❌ Payment was not confirmed. Check the transfer and try again.",
        "calc_not_found": "❌ The calculation was not found. Please enter your details again.",
        "pdf_create_failed": "❌ Could not create the PDF. Please contact support.",
        "pdf_error": "❌ PDF generation failed. Please contact support.",
        "after_pdf": (
            "Keep this moment and use what you received with care and clarity. "
            "You just touched a deeper reading of yourself. "
            "I am here as a guide, and the next step can wait until you are ready.\n\n"
            "If it resonates, we can continue in a form that suits you."
        ),
        "btn_new_calc": "🔮 New Soul Passport",
        "btn_share": "📢 Share with a friend",
        "btn_feedback": "💬 Leave feedback",
        "btn_consult": "🕊 Book a personal reading",
        "section_cycle_n": "Current 7-year cycle ({n})",
        "latin_only_error": "❌ Please use Latin letters only (English spelling of the name).",
    },
}


def t(key: str) -> str:
    locale = get_locale()
    pack = UI.get(locale) or UI["ru"]
    if key in pack:
        return pack[key]
    return UI["ru"].get(key, key)
