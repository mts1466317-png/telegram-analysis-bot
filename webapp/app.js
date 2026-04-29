const passportScreen = document.getElementById("screen-passport");
const contentScreen = document.getElementById("screen-content");
const pageContentEl = document.getElementById("page-content");
const pageIndicatorEl = document.getElementById("page-indicator");
const prevPageBtn = document.getElementById("passport-prev-btn");
const nextPageBtn = document.getElementById("passport-next-btn");
const editorPanelEl = document.getElementById("editor-panel");
const editorLabelEl = document.getElementById("editor-label");
const editorInputEl = document.getElementById("editor-input");
const editorCancelBtn = document.getElementById("editor-cancel-btn");
const editorSaveBtn = document.getElementById("editor-save-btn");
const titleEl = document.getElementById("content-title");
const textEl = document.getElementById("content-text");
const backBtn = document.getElementById("back-btn");
const pdfCtaBtn = document.getElementById("pdf-cta-btn");
const heroCycleEl = document.getElementById("hero-cycle");
const heroTitleEl = document.getElementById("hero-title");
const heroSubtitleEl = document.getElementById("hero-subtitle");

let contentData = null;
let currentPage = 1;
const TOTAL_PAGES = 6;
let editingKey = null;
let effectiveUid = "";
let passportForm = {
  fio: "",
  birth_date: "",
  birth_place: "",
  spiritual_name: "",
  spiritual_level: "",
};

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
}

function showError(text) {
  titleEl.textContent = "Разбор недоступен";
  textEl.textContent = text || "Ошибка загрузки данных";
  passportScreen.classList.add("hidden");
  contentScreen.classList.remove("hidden");
}

const params = new URLSearchParams(window.location.search);
const data = params.get("data");
const uid = params.get("uid");
const tgUserId = tg?.initDataUnsafe?.user?.id ? String(tg.initDataUnsafe.user.id) : "";

if (data) {
  try {
    contentData = JSON.parse(decodeURIComponent(data));
    console.log("✅ Данные получены из URL:", contentData);
  } catch (error) {
    console.error("❌ Ошибка парсинга данных:", error);
    showError("Ошибка формата данных");
  }
}

function hydrateFormFromPayload(result) {
  const profile = result?.profile || {};
  const passportProfile = result?.passport_profile || {};
  passportForm = {
    fio: profile.fio || "—",
    birth_date: profile.birth_date || "—",
    birth_place: passportProfile.birth_place || "—",
    spiritual_name: passportProfile.spiritual_name || "—",
    spiritual_level: passportProfile.spiritual_level || "—",
  };
  if (!profile.fio || profile.fio === "—") {
    const userName = tg?.initDataUnsafe?.user?.first_name || "";
    passportForm.fio = userName || "—";
  }
}

async function loadPayloadByUid() {
  effectiveUid = uid || tgUserId;
  if (!effectiveUid) {
    showError("Нет данных от Telegram");
    return false;
  }
  try {
    const response = await fetch(`data/${effectiveUid}`, { method: "GET" });
    if (!response.ok) {
      showError("Данные для пользователя пока недоступны. Повтори запуск из чата.");
      return false;
    }
    contentData = await response.json();
    return true;
  } catch (error) {
    console.error("❌ Ошибка загрузки payload по uid:", error);
    showError("Ошибка загрузки данных");
    return false;
  }
}

function renderResult(result) {
  if (!result || typeof result !== "object") {
    showError("Данные разбора пусты");
    return;
  }

  contentData = result;
  hydrateFormFromPayload(result);
  renderHero(result);
  renderPage(currentPage);
  console.log("✅ Данные готовы к отображению");
}

function renderHero(result) {
  const profile = result.profile || {};
  heroCycleEl.textContent = formatCycleLine(profile);
  heroSubtitleEl.textContent = "Паспорт Души помогает понять ваши сильные стороны, текущие задачи и ближайший фокус. Ниже — страницы с простыми пояснениями и вашим персональным разбором.";
}

function formatPlanetName(planetRaw) {
  const raw = String(planetRaw || "—");
  const isMaster = raw.includes("(мастер)");
  const clean = raw.replace(" (мастер)", "");
  return isMaster ? `Мастер ${clean}` : clean;
}

function formatCycleLine(profile) {
  const cycle = profile?.cycle_number || "—";
  const energy = profile?.cycle_energy || "—";
  const planet = formatPlanetName(profile?.cycle_planet || "—");
  return `Цикл ${cycle} • Энергия ${energy} • ${planet}`;
}

function extractMarker(text, marker) {
  if (!text) return "";
  const idx = text.indexOf(marker);
  if (idx === -1) return "";
  const start = idx + marker.length;
  const end = text.indexOf("\n\n", start);
  return (end === -1 ? text.slice(start) : text.slice(start, end)).trim();
}

function buildFriendlyMeaning(sectionText) {
  const focus = extractMarker(sectionText, "🎯 Фокус периода:\n");
  const recommendation = extractMarker(sectionText, "✅ Рекомендации:\n");
  if (focus || recommendation) {
    const parts = [];
    if (focus) parts.push(`Сейчас важно: ${focus}`);
    if (recommendation) parts.push(`Практично: ${recommendation}`);
    return parts.join("\n");
  }
  const plain = String(sectionText || "").replace(/Планета:[^\n]*\n?/g, "").replace(/🔹 Как проявляется:\n?/g, "").trim();
  return plain.slice(0, 280);
}

function openSection(sectionKey, fallbackTitle) {
  if (!contentData) {
    showError("Данные для разбора не найдены.");
    return;
  }
  const section = contentData[sectionKey];
  titleEl.textContent = section?.title || fallbackTitle;
  const main = buildFriendlyMeaning(section?.text || "");
  textEl.textContent = `${main || "Данные этого раздела пока недоступны."}\n\nЧто это вам дает:\n— понимание, где вы в ресурсе\n— где нужен фокус на рост\n— что можно улучшить уже сейчас`;
  passportScreen.classList.add("hidden");
  contentScreen.classList.remove("hidden");
}

function buildPlanetSummary(profile) {
  const items = [
    ["Физическое тело", contentData?.physical?.text],
    ["Астральное тело", contentData?.astral?.text],
    ["Ментальное тело", contentData?.mental?.text],
    ["Родовой эгрегор", contentData?.egregor?.text],
    ["Высшее Я", contentData?.higher?.text],
    ["Жизненная задача", contentData?.life?.text],
    ["Родовая программа", contentData?.program?.text],
    ["Социальная задача", contentData?.social?.text],
    ["Текущий цикл", profile?.cycle_planet || "—"],
  ];
  const lines = items.map(([label, raw]) => {
    let planet = "—";
    if (typeof raw === "string") {
      const m = raw.match(/Планета:\s*([^\n]+)/);
      planet = m ? formatPlanetName(m[1].trim()) : "—";
    } else if (typeof raw === "number" || typeof raw === "object") {
      planet = formatPlanetName(String(raw || "—"));
    } else if (label === "Текущий цикл") {
      planet = formatPlanetName(String(raw || "—"));
    }
    return `• ${label} — ${planet}`;
  });
  return lines.join("\n");
}

async function savePassportProfile() {
  if (!effectiveUid) return;
  const payload = {
    birth_place: passportForm.birth_place === "—" ? "" : passportForm.birth_place,
    spiritual_name: passportForm.spiritual_name === "—" ? "" : passportForm.spiritual_name,
    spiritual_level: passportForm.spiritual_level === "—" ? "" : passportForm.spiritual_level,
  };
  try {
    await fetch(`data/${effectiveUid}/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error("profile save failed", e);
  }
}

function renderPage(page) {
  currentPage = Math.max(1, Math.min(TOTAL_PAGES, page));
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === TOTAL_PAGES;
  pageIndicatorEl.textContent = `Страница ${currentPage} из ${TOTAL_PAGES}`;
  const profile = contentData?.profile || {};

  if (currentPage === 1) {
    pageContentEl.innerHTML = `
      <h3 class="page-title">Страница 1 — Данные воплощения</h3>
      <p class="page-note">Заполните эти поля один раз: они помогают сделать ваш паспорт точнее и персональнее.</p>
      <div class="field-list">
        ${renderField("ФИО", "fio", "Имя из расчета по дате рождения.")}
        ${renderField("Дата рождения", "birth_date", "Определяет расчет жизненных циклов и задач.")}
        ${renderField("Место рождения", "birth_place", "Укажите город/страну рождения.")}
        ${renderField("Духовное имя", "spiritual_name", "Напишите, как себя называет ваша душа. Имя может совпадать с паспортным или отличаться.")}
        ${renderField("Духовный уровень", "spiritual_level", "Это личное поле. Есть уровни при рождении и текущие уровни развития. Если не знаете уровень — оставьте пусто и уточните у нас или на сессии сонастройки с Высшим Я.")}
      </div>
      <div class="field-explain">
        <p class="page-note">Что это дает:</p>
        <p class="page-note">• Духовное имя усиливает персональную настройку паспорта и помогает точнее считывать ваш внутренний отклик.</p>
        <p class="page-note">• Место рождения (топоним и координаты) добавляет контекст воплощения: среду, в которой формировались базовые паттерны пути.</p>
        <p class="page-note">• Духовный уровень динамичен: он может повышаться и снижаться в течение жизни. Поэтому паспорт нужен как инструмент осознанности — чтобы держать фокус и быть ближе к своему Абсолюту.</p>
      </div>
    `;
  } else if (currentPage === 2) {
    pageContentEl.innerHTML = `
      <h3 class="page-title">Страница 2 — Что внутри Паспорта Души</h3>
      <p class="page-note">Паспорт показывает 9 ключевых сфер: тело, эмоции, мышление, родовые и социальные задачи, Высшее Я и текущий цикл.</p>
      <p class="page-note">Вы получаете не просто расчет, а понятную карту: где ваш ресурс, где зона роста и на чем сфокусироваться сейчас.</p>
      <p class="page-note">Дальше идут персональные страницы с вашим текущим разбором.</p>
    `;
  } else if (currentPage === 3) {
    const physical = buildFriendlyMeaning(contentData?.physical?.text || "");
    const astral = buildFriendlyMeaning(contentData?.astral?.text || "");
    const mental = buildFriendlyMeaning(contentData?.mental?.text || "");
    pageContentEl.innerHTML = `
      <h3 class="page-title">Страница 3 — Как вы проявляетесь</h3>
      <p class="page-note">• Физический уровень: ${physical || "Собираем данные..."}</p>
      <p class="page-note">• Эмоциональный уровень: ${astral || "Собираем данные..."}</p>
      <p class="page-note">• Ментальный уровень: ${mental || "Собираем данные..."}</p>
      <p class="page-note" style="margin-top:10px;">Это ваш текущий способ реагировать на нагрузку, отношения и решения.</p>
    `;
  } else if (currentPage === 4) {
    pageContentEl.innerHTML = `
      <h3 class="page-title">Страница 4 — Статистика Души</h3>
      <div class="section-list">
        <button class="section-btn" data-section="higher">Высшее Я</button>
        <button class="section-btn" data-section="life">Задача жизни</button>
        <button class="section-btn" data-section="program">Родовая программа</button>
        <button class="section-btn" data-section="social">Социальная задача</button>
      </div>
      <p class="page-note" style="margin-top: 10px;">Нажмите на раздел, чтобы открыть персональный смысл и рекомендации.</p>
    `;
  } else if (currentPage === 5) {
    const summary = buildPlanetSummary(profile);
    pageContentEl.innerHTML = `
      <h3 class="page-title">Страница 5 — Сводка управляющих планет</h3>
      <p class="page-note" style="white-space: pre-line;">${summary}</p>
    `;
  } else {
    pageContentEl.innerHTML = `
      <h3 class="page-title">Страница 6 — Цикл воплощения</h3>
      <p class="page-note">Текущий цикл: ${profile.cycle_number || "—"}</p>
      <p class="page-note">Энергия цикла: ${profile.cycle_energy || "—"} • ${formatPlanetName(profile.cycle_planet || "—")}</p>
      <p class="page-note">Фокус периода: что важно укрепить в ближайшие месяцы.</p>
    `;
  }

  bindDynamicButtons();
}

function renderField(label, key, hint) {
  const value = passportForm[key] || "—";
  const editable = !["fio", "birth_date"].includes(key);
  return `
    <div class="field-row">
      <div class="field-main">
        <div class="field-label">${label}</div>
        <div class="field-value">${value}</div>
        <div class="field-hint">${hint || ""}</div>
      </div>
      ${editable ? `<button class="edit-btn" data-edit="${key}">Изменить</button>` : ""}
    </div>
  `;
}

function bindDynamicButtons() {
  hideEditor();
  pageContentEl.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.edit;
      const labelMap = {
        fio: "ФИО",
        birth_date: "Дата рождения",
        birth_place: "Место рождения",
        spiritual_name: "Духовное имя",
        spiritual_level: "Духовный уровень",
      };
      const label = labelMap[key] || "Поле";
      showEditor(key, label);
    });
  });

  pageContentEl.querySelectorAll("[data-section]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sectionKey = btn.dataset.section;
      const titleMap = {
        higher: "Высшее Я",
        life: "Задача жизни",
        program: "Родовая программа",
        social: "Социальная задача",
      };
      openSection(sectionKey, titleMap[sectionKey] || "Раздел");
    });
  });
}

function showEditor(key, label) {
  editingKey = key;
  editorLabelEl.textContent = `Изменить: ${label}`;
  editorInputEl.value = passportForm[key] === "—" ? "" : (passportForm[key] || "");
  editorPanelEl.classList.remove("hidden");
  editorInputEl.focus();
}

function hideEditor() {
  editingKey = null;
  editorPanelEl.classList.add("hidden");
}

async function init() {
  if (!contentData) {
    const loaded = await loadPayloadByUid();
    if (!loaded) {
      return;
    }
  }
  renderResult(contentData);

  prevPageBtn.addEventListener("click", () => renderPage(currentPage - 1));
  nextPageBtn.addEventListener("click", () => renderPage(currentPage + 1));
  editorCancelBtn.addEventListener("click", hideEditor);
  editorSaveBtn.addEventListener("click", () => {
    if (!editingKey) return;
    const value = editorInputEl.value.trim();
    if (!value) return;
    passportForm[editingKey] = value;
    hideEditor();
    savePassportProfile();
    renderPage(1);
  });

  backBtn.addEventListener("click", () => {
    contentScreen.classList.add("hidden");
    passportScreen.classList.remove("hidden");
  });

  pdfCtaBtn.addEventListener("click", () => {
    if (tg && typeof tg.showPopup === "function") {
      tg.showPopup(
        {
          title: "Полный разбор",
          message: "Полный Паспорт Души (PDF) доступен в чате после вклада в оформление от 222 ₽. Вернуться в чат сейчас?",
          buttons: [
            { id: "stay", type: "cancel", text: "Остаться в приложении" },
            { id: "back_chat", type: "default", text: "Вернуться в чат" },
          ],
        },
        (buttonId) => {
          if (buttonId === "back_chat" && typeof tg.close === "function") {
            tg.close();
          }
        }
      );
      return;
    }
    alert("Полный Паспорт Души (PDF) доступен в чате после вклада в оформление от 222 ₽. Закройте WebApp, чтобы вернуться в чат.");
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
