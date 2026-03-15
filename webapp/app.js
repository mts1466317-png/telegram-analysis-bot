// ===============================
// 🔹 Элементы интерфейса
// ===============================
const menuScreen = document.getElementById("screen-menu");
const contentScreen = document.getElementById("screen-content");
const titleEl = document.getElementById("content-title");
const textEl = document.getElementById("content-text");
const backBtn = document.getElementById("back-btn");

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

if (!data) {
  showError("Нет данных от Telegram");
} else {
  try {
    contentData = JSON.parse(decodeURIComponent(data));
    console.log("✅ Данные получены из URL:", contentData);
  } catch (error) {
    console.error("❌ Ошибка парсинга данных:", error);
    showError("Ошибка формата данных");
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
function init() {
  if (contentData) {
    renderResult(contentData);
  }

  // Навешиваем обработчики на карточки сфер
  document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => handleSphereClick(card));
  });

  // Обработчик кнопки «Назад»
  backBtn.addEventListener("click", () => {
    contentScreen.classList.add("hidden");
    menuScreen.classList.remove("hidden");
  });
}

// ===============================
// 🚀 Запуск приложения
// ===============================
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
