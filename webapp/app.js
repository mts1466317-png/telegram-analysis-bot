// ===============================
// 🔹 Элементы интерфейса
// ===============================
const menuScreen = document.getElementById("screen-menu");
const contentScreen = document.getElementById("screen-content");
const titleEl = document.getElementById("content-title");
const textEl = document.getElementById("content-text");
const backBtn = document.getElementById("back-btn");
const pdfCtaBtn = document.getElementById("pdf-cta-btn");
const heroCycleEl = document.getElementById("hero-cycle");
const heroTitleEl = document.getElementById("hero-title");
const heroSubtitleEl = document.getElementById("hero-subtitle");
const heroHighlightsEl = document.getElementById("hero-highlights");

// ===============================
// 🔹 Состояние приложения
// ===============================
let contentData = null;

// ===============================
// 🔹 Инициализация Telegram WebApp
// ===============================
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
}

// ===============================
// 🔹 Показ ошибки
// ===============================
function showError(text) {
  titleEl.textContent = "Разбор недоступен";
  textEl.textContent = text || "Ошибка загрузки данных";
  menuScreen.classList.add("hidden");
  contentScreen.classList.remove("hidden");
}

// ===============================
// 🔹 Получение данных из URL
// ===============================
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

// ===============================
// 🔹 Отрисовка результата
// ===============================
function renderResult(result) {
  if (!result || typeof result !== "object") {
    showError("Данные разбора пусты");
    return;
  }

  contentData = result;
  renderInfographicHero(result);
  console.log("✅ Данные готовы к отображению");
}

function extractSignal(text) {
  if (!text) return "";
  const marker = "Как проявляется:";
  const idx = text.indexOf(marker);
  if (idx === -1) return text.slice(0, 120).trim();
  const chunk = text.slice(idx + marker.length).trim();
  const dot = chunk.indexOf(".");
  return (dot === -1 ? chunk : chunk.slice(0, dot + 1)).trim();
}

function renderInfographicHero(result) {
  const profile = result.profile || {};
  const cycle = profile.cycle_number || "—";
  const energy = profile.cycle_energy || "—";
  const planet = profile.cycle_planet || "—";
  heroCycleEl.textContent = `Цикл ${cycle} • Энергия ${energy} (${planet})`;
  heroTitleEl.textContent = "Твоя базовая карта уже раскрылась";
  heroSubtitleEl.textContent = "Это верхний слой статистики: ключевые векторы, фокусы и точки роста для текущего периода.";

  const items = [
    { label: "Физический уровень", text: extractSignal(result.physical?.text || "") },
    { label: "Ментальное поле", text: extractSignal(result.mental?.text || "") },
    { label: "Жизненная задача", text: extractSignal(result.life?.text || "") },
    { label: "Высшее Я", text: extractSignal(result.higher?.text || "") },
  ];
  heroHighlightsEl.innerHTML = "";
  items.forEach((item) => {
    const node = document.createElement("article");
    node.className = "highlight-item";
    node.innerHTML = `<strong>${item.label}:</strong> ${item.text || "Исследуй эту сферу в карточках ниже."}`;
    heroHighlightsEl.appendChild(node);
  });
}

// ===============================
// 🔹 Обработка клика по сфере
// ===============================
function handleSphereClick(card) {
  if (!contentData) {
    showError("Данные для разбора не найдены.");
    return;
  }

  const sphereKey = card.dataset.sphere;
  if (!sphereKey) {
    showError("Не указана сфера для отображения.");
    return;
  }

  if (!contentData[sphereKey]) {
    showError("Разбор по этой сфере не найден.");
    return;
  }

  const sphereData = contentData[sphereKey];
  titleEl.textContent = sphereData.title || "";
  textEl.textContent = sphereData.text || "";

  menuScreen.classList.add("hidden");
  contentScreen.classList.remove("hidden");
}

// ===============================
// 🔹 Инициализация приложения
// ===============================
async function init() {
  if (!contentData) {
    const loaded = await loadPayloadByUid();
    if (!loaded) {
      return;
    }
  }
  renderResult(contentData);

  // Навешиваем обработчики на карточки сфер
  document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => handleSphereClick(card));
  });

  // Обработчик кнопки «Назад»
  backBtn.addEventListener("click", () => {
    contentScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
  });

  // CTA на существующий PDF-слой в чате
  pdfCtaBtn.addEventListener("click", () => {
    if (tg && typeof tg.showAlert === "function") {
      tg.showAlert("Полный PDF-разбор доступен в чате через кнопку «Хочу полный разбор (от 111 ₽)».");
      return;
    }
    alert("Полный PDF-разбор доступен в чате через кнопку «Хочу полный разбор (от 111 ₽)».");
  });
}

// ===============================
// 🚀 Запуск приложения
// ===============================
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    init();
  });
} else {
  init();
}
