const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  if (tg.themeParams?.bg_color) {
    document.documentElement.style.setProperty("--tg-bg", tg.themeParams.bg_color);
  }
}

const SCREENS = {
  loading: document.getElementById("screen-loading"),
  error: document.getElementById("screen-error"),
  cover: document.getElementById("screen-cover"),
  app: document.getElementById("screen-app"),
};

const coverName = document.getElementById("cover-name");
const coverDate = document.getElementById("cover-date");
const coverSummary = document.getElementById("cover-summary");
const errorText = document.getElementById("error-text");
const tabBar = document.getElementById("tab-bar");
const tabPanel = document.getElementById("tab-panel");
const openPassportBtn = document.getElementById("open-passport-btn");
const backCoverBtn = document.getElementById("back-cover-btn");

const TABS = [
  { id: "bodies", label: "Тела", spheres: ["physical", "astral", "mental", "higher"] },
  { id: "tasks", label: "Задачи", spheres: ["life", "social", "combo"] },
  { id: "rod", label: "Род", spheres: ["egregor", "program"] },
  { id: "cycle", label: "Цикл", special: "cycle" },
  { id: "matrix", label: "Матрица", special: "matrix" },
];

const SPHERE_LABELS = {
  physical: "Физическое тело",
  astral: "Астральное тело",
  mental: "Ментальное тело",
  higher: "Высшее Я",
  life: "Жизненная задача",
  egregor: "Родовой эгрегор",
  program: "Родовая программа",
  social: "Социальная задача",
  combo: "Сочетание задач",
};

const MARKERS = [
  { marker: "🔹 Как проявляется:\n", pill: "Проявленность", key: "manifest" },
  { marker: "🔹 Как задача реализуется в социуме:\n", pill: "Реализация", key: "social_impl" },
  { marker: "🎯 Фокус периода:\n", pill: "Фокус", key: "focus" },
  { marker: "⚠️ Риски:\n", pill: "Риски", key: "risks" },
  { marker: "✅ Рекомендации:\n", pill: "Рекомендации", key: "rec" },
  { marker: "💼 Профессии и сферы реализации:\n", pill: "Профессии", key: "professions" },
];

let contentData = null;
let activeTab = "bodies";
let effectiveUid = "";

const params = new URLSearchParams(window.location.search);
const dataParam = params.get("data");
const uidParam = params.get("uid");
const tgUserId = tg?.initDataUnsafe?.user?.id ? String(tg.initDataUnsafe.user.id) : "";

function showScreen(name) {
  Object.entries(SCREENS).forEach(([key, el]) => {
    if (!el) return;
    el.classList.toggle("hidden", key !== name);
  });
}

function showError(text) {
  if (errorText) errorText.textContent = text || "Ошибка загрузки данных";
  showScreen("error");
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cleanSectionText(raw) {
  let text = String(raw || "").trim();
  if (!text) return "";
  text = text.replace(/^Планета:\s*[^\n]+\n+/gm, "");
  text = text.replace(/✨ Мастер-вибрация усиливает влияние\./g, "");
  text = text.replace(/✨ Мастер-цикл — судьбоносный период\./g, "");
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

function extractMarker(text, marker) {
  const idx = text.indexOf(marker);
  if (idx === -1) return "";
  const start = idx + marker.length;
  const markers = MARKERS.map((m) => m.marker).sort((a, b) => b.length - a.length);
  let end = text.length;
  for (const m of markers) {
    if (m === marker) continue;
    const pos = text.indexOf(m, start);
    if (pos !== -1 && pos < end) end = pos;
  }
  return text.slice(start, end).trim();
}

function parseSectionPills(rawText) {
  const text = cleanSectionText(rawText);
  const pills = {};
  for (const { marker, key } of MARKERS) {
    const chunk = extractMarker(text, marker);
    if (chunk) pills[key] = chunk;
  }
  if (!Object.keys(pills).length && text) {
    pills.manifest = text;
  }
  return pills;
}

function firstSentence(text, fallback = "") {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  const dot = clean.indexOf(".");
  return dot === -1 ? clean : clean.slice(0, dot + 1);
}

function sphereSubtitle(sectionKey, pills) {
  if (pills.manifest) return firstSentence(pills.manifest);
  const staticHints = {
    physical: "Ресурсы тела, границы и точки силы.",
    astral: "Эмоции, чувствительность и отклик на среду.",
    mental: "Мышление, убеждения и способ принимать решения.",
    higher: "Внутренний компас и опыт души.",
    life: "Главный смысл и задача воплощения.",
    egregor: "Родовые вибрации и поддержка рода.",
    program: "Задача рода и наследуемые сценарии.",
    social: "Ожидания социума и реализация в мире.",
    combo: "Сочетание жизненной и социальной линии.",
  };
  return staticHints[sectionKey] || "";
}

function formatPlanet(planetRaw) {
  const raw = String(planetRaw || "—");
  if (raw.includes("(мастер)")) {
    return `Мастер ${raw.replace(" (мастер)", "")}`;
  }
  return raw;
}

function getSection(key) {
  if (key === "cycle") return contentData?.cycle;
  return contentData?.[key];
}

function buildMatrixRows() {
  if (Array.isArray(contentData?.matrix) && contentData.matrix.length) {
    return contentData.matrix;
  }
  const profile = contentData?.profile || {};
  const keys = [
    ["physical", "Физическое тело"],
    ["astral", "Астральное тело"],
    ["mental", "Ментальное тело"],
    ["life", "Жизненная задача"],
    ["egregor", "Родовой эгрегор"],
    ["higher", "Высшее Я"],
    ["program", "Родовая программа"],
    ["social", "Социальная задача"],
    ["combo", "Сочетание задач"],
    ["cycle", "Текущий цикл"],
  ];
  return keys.map(([key, label]) => {
    const section = getSection(key);
    const raw = section?.text || "";
    const vibMatch = raw.match(/вибраци[яи]\s*(\d+)/i);
    const planetMatch = raw.match(/^Планета:\s*([^\n]+)/m);
    let vibration = vibMatch ? vibMatch[1] : "—";
    let planet = planetMatch ? planetMatch[1].trim() : "—";
    if (key === "cycle") {
      vibration = profile.cycle_energy ?? "—";
      planet = profile.cycle_planet ?? "—";
    }
    if (key === "higher") {
      vibration = profile.higher_self ?? vibration;
      planet = profile.higher_planet ?? planet;
    }
    return { key, label, vibration, planet };
  });
}

function renderSphereCard(sectionKey, openByDefault = false) {
  const section = getSection(sectionKey);
  if (!section) return "";
  const pills = parseSectionPills(section.text || "");
  const pillKeys = MARKERS.map((m) => m.key).filter((k) => pills[k]);
  if (!pillKeys.length) return "";

  const title = SPHERE_LABELS[sectionKey] || section.title || sectionKey;
  const subtitle = sphereSubtitle(sectionKey, pills);
  const firstPill = pillKeys[0];
  const pillButtons = pillKeys
    .map((key) => {
      const meta = MARKERS.find((m) => m.key === key);
      return `<button type="button" class="pill-tab${key === firstPill ? " active" : ""}" data-pill="${key}">${meta?.pill || key}</button>`;
    })
    .join("");

  const pillPanels = pillKeys
    .map((key) => {
      const hidden = key !== firstPill ? ' style="display:none"' : "";
      return `<div class="pill-content" data-pill-panel="${key}"${hidden}>${escapeHtml(pills[key])}</div>`;
    })
    .join("");

  return `
    <article class="sphere-card${openByDefault ? " open" : ""}" data-sphere="${sectionKey}">
      <button type="button" class="sphere-head" aria-expanded="${openByDefault}">
        <div>
          <div class="sphere-title">${escapeHtml(title)}</div>
          <p class="sphere-subtitle">${escapeHtml(subtitle)}</p>
        </div>
        <span class="sphere-chevron">▼</span>
      </button>
      <div class="sphere-body">
        <div class="pill-tabs">${pillButtons}</div>
        ${pillPanels}
      </div>
    </article>
  `;
}

function renderCycleTab() {
  const profile = contentData?.profile || {};
  const cycleNum = Number(profile.cycle_number) || 1;
  const startAge = profile.cycle_start_age ?? (cycleNum - 1) * 7;
  const endAge = profile.cycle_end_age ?? cycleNum * 7 - 1;
  const section = contentData?.cycle;
  const pills = parseSectionPills(section?.text || "");
  const focus = pills.focus || pills.manifest || "";
  const maxCycles = Math.max(cycleNum + 2, 12);

  const timeline = Array.from({ length: maxCycles }, (_, i) => {
    const n = i + 1;
    const from = (n - 1) * 7;
    const to = n * 7 - 1;
    const current = n === cycleNum;
    return `
      <div class="timeline-item${current ? " current" : ""}">
        <div class="timeline-dot"></div>
        <div>
          <div class="timeline-label">${n}-й цикл${current ? " · сейчас" : ""}</div>
          <div class="timeline-age">${from}–${to} лет</div>
        </div>
      </div>
    `;
  }).join("");

  const cycleCard = section
    ? renderSphereCard("cycle", true)
    : `<p class="empty-tab">Данные цикла пока недоступны.</p>`;

  return `
    <div class="cycle-hero">
      <h3>${escapeHtml(section?.title || `Цикл ${cycleNum}`)}</h3>
      <p class="cycle-meta">Возраст ${profile.age ?? "—"} · полоса ${startAge}–${endAge} лет</p>
      ${focus ? `<p class="cycle-meta">${escapeHtml(firstSentence(focus))}</p>` : ""}
      <div class="timeline">${timeline}</div>
    </div>
    ${cycleCard}
  `;
}

function renderMatrixTab() {
  const rows = buildMatrixRows();
  const cycleKey = "cycle";
  const body = rows
    .map((row) => {
      const highlight = row.key === cycleKey ? " highlight" : "";
      return `<tr class="${highlight.trim()}">
        <td>${escapeHtml(row.label)}</td>
        <td>${escapeHtml(String(row.vibration))}</td>
        <td>${escapeHtml(formatPlanet(row.planet))}</td>
      </tr>`;
    })
    .join("");

  return `
    <div class="matrix-wrap">
      <p class="matrix-note">Персональная матрица — вибрации и планеты по всем сферам паспорта.</p>
      <table class="matrix-table">
        <thead>
          <tr><th>Сфера</th><th>Вибрация</th><th>Планета</th></tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
}

function renderTabContent(tabId) {
  const tab = TABS.find((t) => t.id === tabId) || TABS[0];
  if (tab.special === "cycle") return renderCycleTab();
  if (tab.special === "matrix") return renderMatrixTab();

  const cards = (tab.spheres || [])
    .map((key, idx) => renderSphereCard(key, idx === 0))
    .filter(Boolean)
    .join("");
  return cards || `<p class="empty-tab">Раздел пока пуст.</p>`;
}

function bindTabPanelEvents() {
  tabPanel.querySelectorAll(".sphere-head").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".sphere-card");
      if (!card) return;
      const open = card.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  tabPanel.querySelectorAll(".sphere-card").forEach((card) => {
    card.querySelectorAll(".pill-tab").forEach((pillBtn) => {
      pillBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const key = pillBtn.dataset.pill;
        const cardEl = pillBtn.closest(".sphere-card");
        if (!cardEl || !key) return;
        cardEl.querySelectorAll(".pill-tab").forEach((b) => b.classList.toggle("active", b === pillBtn));
        cardEl.querySelectorAll("[data-pill-panel]").forEach((panel) => {
          panel.style.display = panel.dataset.pillPanel === key ? "block" : "none";
        });
      });
    });
  });
}

function renderTabs() {
  tabBar.innerHTML = TABS.map(
    (t) => `<button type="button" class="tab-btn${t.id === activeTab ? " active" : ""}" data-tab="${t.id}" role="tab">${t.label}</button>`
  ).join("");

  tabBar.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeTab = btn.dataset.tab || "bodies";
      renderTabs();
    });
  });

  tabPanel.innerHTML = renderTabContent(activeTab);
  bindTabPanelEvents();
}

function renderCover() {
  const profile = contentData?.profile || {};
  const fio = profile.fio && profile.fio !== "—" ? profile.fio : tg?.initDataUnsafe?.user?.first_name || "Ваш паспорт";
  coverName.textContent = fio;
  coverDate.textContent = profile.birth_date && profile.birth_date !== "—" ? profile.birth_date : "";
  coverSummary.textContent = contentData?.summary || "Персональный разбор по сферам воплощения.";
}

function renderApp() {
  renderTabs();
  showScreen("app");
}

async function loadPayloadByUid() {
  effectiveUid = uidParam || tgUserId;
  if (!effectiveUid) {
    showError("Откройте мини-приложение из чата с ботом после расчёта.");
    return false;
  }
  try {
    const response = await fetch(`data/${effectiveUid}`, { method: "GET" });
    if (!response.ok) {
      showError("Данные пока недоступны. Сначала пройдите расчёт в боте.");
      return false;
    }
    contentData = await response.json();
    return true;
  } catch (err) {
    console.error(err);
    showError("Ошибка загрузки данных.");
    return false;
  }
}

async function init() {
  if (dataParam) {
    try {
      contentData = JSON.parse(decodeURIComponent(dataParam));
    } catch {
      showError("Ошибка формата данных в ссылке.");
      return;
    }
  } else {
    const ok = await loadPayloadByUid();
    if (!ok) return;
  }

  renderCover();
  showScreen("cover");

  openPassportBtn?.addEventListener("click", renderApp);
  backCoverBtn?.addEventListener("click", () => showScreen("cover"));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
