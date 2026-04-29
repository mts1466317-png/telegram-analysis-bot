const passportScreen = document.getElementById("screen-passport");
const contentScreen = document.getElementById("screen-content");
const pageContentEl = document.getElementById("page-content");
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
const TOTAL_PAGES = 4;
let editingKey = null;
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
  passportForm = {
    fio: profile.fio || "—",
    birth_date: profile.birth_date || "—",
    birth_place: "—",
    spiritual_name: "—",
    spiritual_level: "—",
  };
  if (profile.cycle_number || profile.cycle_energy) {
    passportForm.spiritual_level = formatCycleLine(profile);
  }
  if (!profile.fio || profile.fio === "—") {
    const userName = tg?.initDataUnsafe?.user?.first_name || "";
    passportForm.fio = userName || "—";
  }
}

async function loadPayloadByUid() {
  const effectiveUid = uid || tgUserId;
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
  heroSubtitleEl.textContent = "Короткий паспорт текущего этапа. Выберите страницу ниже.";
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
  textEl.textContent = `${main || "Раздел будет заполнен в следующем этапе."}\n\nЧто делать дальше:\n1) Сверь с текущей неделей\n2) Выбери одно действие\n3) Вернись и открой следующий раздел`;
  passportScreen.classList.add("hidden");
  contentScreen.classList.remove("hidden");
}

function renderPage(page) {
  currentPage = Math.max(1, Math.min(TOTAL_PAGES, page));
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === TOTAL_PAGES;

  if (currentPage === 1) {
    pageContentEl.innerHTML = `
      <h3 class="page-title">Страница 1 — Данные воплощения</h3>
      <div class="field-list">
        ${renderField("ФИО", "fio")}
        ${renderField("Дата рождения", "birth_date")}
        ${renderField("Место рождения", "birth_place")}
        ${renderField("Духовное имя", "spiritual_name")}
        ${renderField("Духовный уровень", "spiritual_level")}
      </div>
    `;
  } else if (currentPage === 2) {
    const physical = buildFriendlyMeaning(contentData?.physical?.text || "");
    const astral = buildFriendlyMeaning(contentData?.astral?.text || "");
    const mental = buildFriendlyMeaning(contentData?.mental?.text || "");
    pageContentEl.innerHTML = `
      <h3 class="page-title">Страница 2 — Как вы проявляетесь</h3>
      <p class="page-note">• Физический уровень: ${physical || "Собираем данные..."}</p>
      <p class="page-note">• Эмоциональный уровень: ${astral || "Собираем данные..."}</p>
      <p class="page-note">• Ментальный уровень: ${mental || "Собираем данные..."}</p>
    `;
  } else if (currentPage === 3) {
    pageContentEl.innerHTML = `
      <h3 class="page-title">Страница 3 — Статистика Души</h3>
      <div class="section-list">
        <button class="section-btn" data-section="higher">Высшее Я</button>
        <button class="section-btn" data-section="life">Задача жизни</button>
        <button class="section-btn" data-section="program">Родовая программа</button>
        <button class="section-btn" data-section="social">Социальная задача</button>
      </div>
      <p class="page-note" style="margin-top: 10px;">Нажми на раздел, чтобы открыть его текущий слой.</p>
    `;
  } else {
    const profile = contentData?.profile || {};
    pageContentEl.innerHTML = `
      <h3 class="page-title">Страница 4 — Цикл воплощения</h3>
      <p class="page-note">Текущий цикл: ${profile.cycle_number || "—"}</p>
      <p class="page-note">Энергия цикла: ${profile.cycle_energy || "—"} • ${formatPlanetName(profile.cycle_planet || "—")}</p>
      <p class="page-note">Раздел расширится в следующем этапе.</p>
    `;
  }

  bindDynamicButtons();
}

function renderField(label, key) {
  const value = passportForm[key] || "—";
  return `
    <div class="field-row">
      <div>
        <div class="field-label">${label}</div>
        <div class="field-value">${value}</div>
      </div>
      <button class="edit-btn" data-edit="${key}">Изменить</button>
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
          message: "Полный PDF доступен в чате через кнопку «Хочу полный разбор (от 222 ₽)». Вернуться в чат сейчас?",
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
    alert("Полный PDF доступен в чате через кнопку «Хочу полный разбор (от 222 ₽)». Закройте WebApp, чтобы вернуться в чат.");
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
