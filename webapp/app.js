// ===============================
// 🔹 Элементы интерфейса
// ===============================
const menuScreen = document.getElementById("screen-menu");
const contentScreen = document.getElementById("screen-content");
const titleEl = document.getElementById("content-title");
const textEl = document.getElementById("content-text");
const backBtn = document.getElementById("back-btn");
const pdfCtaBtn = document.getElementById("pdf-cta-btn");

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
  if (!uid) {
    showError("Нет данных от Telegram");
    return false;
  }
  try {
    const response = await fetch(`data/${uid}`, { method: "GET" });
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
  console.log("✅ Данные готовы к отображению");
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
