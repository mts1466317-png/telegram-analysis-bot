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
let currentUserId = null;
let isLoading = false;
let dataLoaded = false;

// ===============================
// 🔹 Получение Telegram user ID
// ===============================
function getTelegramUserId() {
  // Приоритет 1: Telegram WebApp
  if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
    return String(window.Telegram.WebApp.initDataUnsafe.user.id).trim();
  }

  // Приоритет 2: Fallback из URL параметра ?user=
  const params = new URLSearchParams(window.location.search);
  const urlUser = params.get("user");
  if (urlUser) {
    return String(urlUser).trim();
  }

  return null;
}

// ===============================
// 🔹 Инициализация Telegram WebApp
// ===============================
function initTelegramWebApp() {
  if (window.Telegram?.WebApp) {
    try {
      window.Telegram.WebApp.ready();
      if (window.Telegram.WebApp.expand) {
        window.Telegram.WebApp.expand();
      }
      console.log("✅ Telegram WebApp initialized");
    } catch (e) {
      console.warn("⚠️ Telegram WebApp init error:", e);
    }
  }
}

// ===============================
// 🔹 Показ ошибки («Разбор недоступен»)
// ===============================
function showError(text) {
  titleEl.textContent = "Разбор недоступен";
  textEl.textContent = text || "Ошибка загрузки данных";
  menuScreen.classList.add("hidden");
  contentScreen.classList.remove("hidden");
}

// ===============================
// 🔹 Информационное сообщение (без «Разбор недоступен»)
// ===============================
function showInfo(title, text) {
  titleEl.textContent = title || "";
  textEl.textContent = text || "";
  menuScreen.classList.add("hidden");
  contentScreen.classList.remove("hidden");
}

// ===============================
// 🔹 Загрузка данных пользователя
//    fetch('/result?user=<telegram_id>')
// ===============================
async function loadUserData() {
  if (!currentUserId) {
    showError("Не удалось определить ID пользователя. Открой приложение из Telegram.");
    return;
  }

  isLoading = true;
  dataLoaded = false;

  try {
    const url = `/result?user=${encodeURIComponent(currentUserId)}`;
    console.log("🔹 WEBAPP FETCH:", url);
    const response = await fetch(url);
    console.log("🔹 WEBAPP RESPONSE:", response.status, response.statusText);

    // 404 = данных реально нет в базе
    if (response.status === 404) {
      console.log("❌ WEBAPP: 404 - данные не найдены для ID:", currentUserId);
      showError("Для этого пользователя пока нет сохранённого разбора.");
      return;
    }

    // Любая другая ошибка HTTP
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Парсим JSON
    const data = await response.json();

    // Проверяем что данные есть и это объект
    if (!data || typeof data !== "object") {
      showError("Ответ сервера пустой или в неверном формате.");
      return;
    }

    // Успешно загружено
    contentData = data;
    dataLoaded = true;
    console.log("✅ Данные пользователя загружены:", data);

  } catch (error) {
    console.error("❌ Ошибка при загрузке данных:", error);
    showError("Не удалось загрузить данные. Попробуй позже.");
  } finally {
    isLoading = false;
  }
}

// ===============================
// 🔹 Обработка клика по сфере
// ===============================
function handleSphereClick(card) {
  // Если данные ещё загружаются — показываем мягкое сообщение БЕЗ «Разбор недоступен»
  if (isLoading && !dataLoaded) {
    showInfo(
      "Данные ещё загружаются…",
      "Подожди пару секунд и попробуй выбрать сферу ещё раз."
    );
    return;
  }

  // Если данные не загружены — ошибка
  if (!dataLoaded) {
    showError("Данные для разбора не найдены.");
    return;
  }

  // Получаем ключ сферы из data-sphere
  const sphereKey = card.dataset.sphere;
  if (!sphereKey) {
    showError("Не указана сфера для отображения.");
    return;
  }

  // Проверяем что данные для этой сферы есть
  if (!contentData || !contentData[sphereKey]) {
    showError("Разбор по этой сфере не найден.");
    return;
  }

  // Подставляем title и text из ответа сервера
  const sphereData = contentData[sphereKey];
  titleEl.textContent = sphereData.title || "";
  textEl.textContent = sphereData.text || "";

  // Переключаем экраны
  menuScreen.classList.add("hidden");
  contentScreen.classList.remove("hidden");
}

// ===============================
// 🔹 Инициализация приложения
// ===============================
function init() {
  // Инициализируем Telegram WebApp
  initTelegramWebApp();

  // Получаем user ID
  currentUserId = getTelegramUserId();
  console.log("🔹 WEBAPP ID:", currentUserId, "type:", typeof currentUserId);

  if (!currentUserId) {
    showError("Открой приложение из Telegram.");
    return;
  }

  // Загружаем данные пользователя
  loadUserData();

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
