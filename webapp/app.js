const passportScreen = document.getElementById("screen-passport");
const contentScreen = document.getElementById("screen-content");
const pageContentEl = document.getElementById("page-content");
const prevPageBtn = document.getElementById("passport-prev-btn");
const nextPageBtn = document.getElementById("passport-next-btn");
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
  const userName = tg?.initDataUnsafe?.user?.first_name || "";
  passportForm = {
    fio: userName || "—",
    birth_date: "—",
    birth_place: "—",
    spiritual_name: "—",
    spiritual_level: "—",
  };

  const profile = result?.profile || {};
  if (profile.cycle_number || profile.cycle_energy) {
    passportForm.spiritual_level = `Цикл ${profile.cycle_number || "—"} • Энергия ${profile.cycle_energy || "—"}`;
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
  const cycle = profile.cycle_number || "—";
  const energy = profile.cycle_energy || "—";
  const planet = profile.cycle_planet || "—";
  heroCycleEl.textContent = `Цикл ${cycle} • Энергия ${energy} (${planet})`;
  heroSubtitleEl.textContent = result.summary || "Структурированный маршрут по ключевым уровням вашего воплощения.";
}

function openSection(sectionKey, fallbackTitle) {
  if (!contentData) {
    showError("Данные для разбора не найдены.");
    return;
  }
  const section = contentData[sectionKey];
  titleEl.textContent = section?.title || fallbackTitle;
  textEl.textContent = section?.text || "Раздел будет заполнен в следующем этапе.";
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
    pageContentEl.innerHTML = `
      <h3 class="page-title">Страница 2 — Личность воплощения</h3>
      <p class="page-note">• Физическая ось: [будет рассчитано]</p>
      <p class="page-note">• Эмоциональная ось: [будет рассчитано]</p>
      <p class="page-note">• Ментальная ось: [будет рассчитано]</p>
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
      <p class="page-note">Энергия цикла: ${profile.cycle_energy || "—"} (${profile.cycle_planet || "—"})</p>
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
      const nextValue = window.prompt(`Введите ${label}:`, passportForm[key] === "—" ? "" : (passportForm[key] || ""));
      if (nextValue === null) return;
      const clean = nextValue.trim();
      if (!clean) return;
      passportForm[key] = clean;
      renderPage(1);
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

  backBtn.addEventListener("click", () => {
    contentScreen.classList.add("hidden");
    passportScreen.classList.remove("hidden");
  });

  pdfCtaBtn.addEventListener("click", () => {
    if (tg && typeof tg.showAlert === "function") {
      tg.showAlert("Полный PDF-разбор доступен в чате через кнопку «Хочу полный разбор (от 555 ₽)».");
      return;
    }
    alert("Полный PDF-разбор доступен в чате через кнопку «Хочу полный разбор (от 555 ₽)».");
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
