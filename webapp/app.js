const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

const navButtons = document.querySelectorAll("[data-nav]");
const screens = document.querySelectorAll("[data-screen]");

const state = {
  payload: null,
  selectedSphereId: null,
  level: 12,
  levelSavedAt: null,
};

const ARCHETYPE_GROUPS = {
  archons: "Архонты",
  middle: "Средние духи",
  angels: "Ангелы",
};

function parsePayload() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("data");
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch (_error) {
    return null;
  }
}

function getDefaultPayload() {
  return {
    user: { fullName: "Путник" },
    periodCore: {
      cycleNumber: "—",
      cyclePlanet: "—",
      periodEnergy: "—",
      focusPrompt: "Сфокусируйтесь на одном маленьком шаге сегодня.",
    },
    soulSnapshot: [
      { id: "physical", title: "Физическое тело", icon: "🧍", shortText: "Опора через тело и ритм.", cta: "Один заботливый шаг для тела сегодня." },
      { id: "astral", title: "Астральное тело", icon: "🌙", shortText: "Наблюдение эмоций без давления.", cta: "Назовите текущее чувство и его потребность." },
      { id: "mental", title: "Ментальное тело", icon: "🧠", shortText: "Ясность мыслей и фокус внимания.", cta: "Запишите одну главную мысль дня." },
      { id: "life", title: "Жизненная задача", icon: "🎯", shortText: "Вектор воплощения в действии.", cta: "Сделайте одно действие в сторону вектора." },
      { id: "egregor", title: "Родовой эгрегор", icon: "🌳", shortText: "Связь с линией рода и опорой.", cta: "Вспомните ресурс рода, который помогает сейчас." },
      { id: "program", title: "Родовая программа", icon: "🧬", shortText: "Повторяющиеся паттерны и задачи.", cta: "Отметьте один сценарий, который пора обновить." },
      { id: "higher", title: "Высшее Я", icon: "✨", shortText: "Внутренний компас и смысл пути.", cta: "Спросите себя: какой шаг в резонансе с Высшим Я?" },
      { id: "social", title: "Социальная задача", icon: "🌍", shortText: "Вклад в пространство и людей.", cta: "Определите вклад дня для других." },
      { id: "combo", title: "Сочетание задач", icon: "♾", shortText: "Синхронизация внутреннего и внешнего.", cta: "Объедините личный и социальный вектор одним действием." },
      { id: "cycle", title: "Текущий цикл", icon: "🔄", shortText: "Энергия периода и возрастной фокус.", cta: "Сверьте выборы с фокусом текущего цикла." },
    ],
    fieldFeed: {
      weekTheme: "Исследование внутренней опоры",
      dayInsight: "Маленький осознанный шаг раскрывает путь лучше, чем идеальный план.",
      channelHighlights: [
        { title: "Тема недели", summary: "Как соединять сигналы Высшего Я с земными действиями." },
      ],
    },
    roadmap: [
      { id: "wa1", title: "WA-1 Foundation", status: "active", summary: "Рабочая IA, карты сфер и 24 уровней." },
      { id: "wa2", title: "WA-2 Soul Map Wheel", status: "next", summary: "Круговая карта и детали сферы в bottom sheet." },
      { id: "wa3", title: "WA-3 Ecosystem", status: "next", summary: "Глубокая интеграция контента канала и continuity." },
    ],
    practices: [
      "3 минуты дыхания с фокусом на центр груди.",
      "Один честный вопрос к себе перед важным решением.",
      "Фиксация шага дня в заметке.",
    ],
    deepLinks: {
      openPdf: "",
      openChannel: "https://t.me/higherself_connection",
      openCircle: "https://t.me/DISCUSSION_GROUP_LINK",
      openPractice: "",
    },
  };
}

function openScreen(screenId) {
  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.dataset.screen === screenId);
  });
  navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.nav === screenId);
  });
}

function levelGroup(level) {
  if (level <= 6) return ARCHETYPE_GROUPS.archons;
  if (level <= 16) return ARCHETYPE_GROUPS.middle;
  return ARCHETYPE_GROUPS.angels;
}

function archetypeProfile(level) {
  const group = levelGroup(level);
  return {
    title: `Уровень ${level}: ${group}`,
    focus: `Фокус воплощения: осознанно проживать задачи уровня ${level}.`,
    resource: "Ресурс: внутренняя честность, устойчивость и контакт с реальностью.",
    shadow: "Тень: сравнение себя с другими и давление ожиданий.",
    practice: "Практика 1 шага: каждый день завершать один значимый шаг по пути.",
  };
}

function renderField(payload) {
  document.getElementById("week-theme-title").textContent = payload.fieldFeed.weekTheme || "Тема недели";
  document.getElementById("week-theme-text").textContent = payload.periodCore.focusPrompt || "";
  document.getElementById("day-insight").textContent = payload.fieldFeed.dayInsight || "";

  const feed = document.getElementById("channel-feed");
  feed.innerHTML = "";
  (payload.fieldFeed.channelHighlights || []).forEach((item) => {
    const block = document.createElement("article");
    block.className = "feed-item";
    block.innerHTML = `<strong>${item.title || "Рубрика"}</strong><p>${item.summary || ""}</p>`;
    feed.appendChild(block);
  });

  const roadmap = document.getElementById("wa-roadmap");
  roadmap.innerHTML = "";
  (payload.roadmap || []).forEach((item) => {
    const block = document.createElement("article");
    block.className = "feed-item";
    block.innerHTML = `<strong>${item.title}</strong><p>${item.summary}</p><p class="meta">Статус: ${item.status}</p>`;
    roadmap.appendChild(block);
  });
}

function renderSnapshot(payload) {
  document.getElementById("map-user-name").textContent = `${payload.user.fullName || "Пользователь"}: Soul Snapshot`;
  document.getElementById("map-cycle-meta").textContent = `Цикл ${payload.periodCore.cycleNumber || "—"}`;
  document.getElementById("period-energy").textContent = `Энергия периода: ${payload.periodCore.periodEnergy || "—"}`;
  document.getElementById("period-planet").textContent = `Планета цикла: ${payload.periodCore.cyclePlanet || "—"}`;

  const grid = document.getElementById("snapshot-grid");
  grid.innerHTML = "";
  (payload.soulSnapshot || []).forEach((sphere) => {
    const button = document.createElement("button");
    button.className = "sphere-card";
    button.type = "button";
    button.innerHTML = `
      <p class="sphere-title">${sphere.icon || "•"} ${sphere.title || "Сфера"}</p>
      <p class="sphere-meta">${sphere.shortText || ""}</p>
    `;
    button.addEventListener("click", () => showSphereDetail(sphere));
    grid.appendChild(button);
  });
}

function showSphereDetail(sphere) {
  state.selectedSphereId = sphere.id;
  document.getElementById("sphere-title").textContent = sphere.title || "";
  document.getElementById("sphere-summary").textContent = sphere.shortText || "";
  document.getElementById("sphere-cta").textContent = sphere.cta || "";
  document.getElementById("sphere-detail").classList.remove("hidden");
}

function renderLevels() {
  const slider = document.getElementById("level-slider");
  const value = Number(slider.value);
  state.level = value;
  document.getElementById("level-value").textContent = String(value);
  document.getElementById("level-group").textContent = levelGroup(value);

  const profile = archetypeProfile(value);
  document.getElementById("archetype-title").textContent = profile.title;
  document.getElementById("archetype-focus").textContent = profile.focus;
  document.getElementById("archetype-resource").textContent = profile.resource;
  document.getElementById("archetype-shadow").textContent = profile.shadow;
  document.getElementById("archetype-practice").textContent = profile.practice;
}

function renderCircle(payload) {
  const list = document.getElementById("circle-topics");
  list.innerHTML = "";
  (payload.fieldFeed.channelHighlights || []).forEach((item) => {
    const block = document.createElement("article");
    block.className = "feed-item";
    block.innerHTML = `<strong>${item.title || "Тема"}</strong><p>${item.summary || ""}</p>`;
    list.appendChild(block);
  });
}

function renderPractices(payload) {
  const holder = document.getElementById("practice-list");
  holder.innerHTML = "";
  (payload.practices || []).forEach((practice) => {
    const row = document.createElement("article");
    row.className = "feed-item";
    row.textContent = practice;
    holder.appendChild(row);
  });
}

function bindActions(payload) {
  navButtons.forEach((button) => {
    button.addEventListener("click", () => openScreen(button.dataset.nav));
  });

  document.getElementById("action-open-map").addEventListener("click", () => openScreen("map"));
  document.getElementById("action-open-channel").addEventListener("click", () => window.open(payload.deepLinks.openChannel, "_blank"));
  document.getElementById("action-open-circle").addEventListener("click", () => window.open(payload.deepLinks.openCircle, "_blank"));
  document.getElementById("circle-open-channel").addEventListener("click", () => window.open(payload.deepLinks.openChannel, "_blank"));
  document.getElementById("circle-open-discussion").addEventListener("click", () => window.open(payload.deepLinks.openCircle, "_blank"));

  document.getElementById("open-pdf").addEventListener("click", () => {
    if (payload.deepLinks.openPdf) {
      window.open(payload.deepLinks.openPdf, "_blank");
      return;
    }
    if (tg) {
      tg.showAlert("Полный PDF отправляется в чат ботом после расчёта.");
    }
  });

  const slider = document.getElementById("level-slider");
  slider.addEventListener("input", renderLevels);
  document.getElementById("save-level").addEventListener("click", () => {
    state.levelSavedAt = new Date().toLocaleString("ru-RU");
    const note = document.getElementById("level-note").value.trim();
    document.getElementById("level-saved-meta").textContent = note
      ? `Сохранено: ${state.levelSavedAt}. Заметка: ${note}`
      : `Сохранено: ${state.levelSavedAt}`;
    if (tg) {
      tg.HapticFeedback?.notificationOccurred("success");
    }
  });
}

function init() {
  state.payload = parsePayload() || getDefaultPayload();
  renderField(state.payload);
  renderSnapshot(state.payload);
  renderLevels();
  renderCircle(state.payload);
  renderPractices(state.payload);
  bindActions(state.payload);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
