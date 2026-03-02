const STORAGE_KEY = "pineapple-miniapp-v01";
const PINEAPPLES_PER_RUBLE = 30;
const AD_REWARD = 3;
const AD_COOLDOWN_MS = 15000;

const state = {
  pineapples: 0,
  history: [],
  nextAdAt: 0,
};

const refs = {
  pineappleCount: document.getElementById("pineappleCount"),
  rubAmount: document.getElementById("rubAmount"),
  watchAdBtn: document.getElementById("watchAdBtn"),
  adStatus: document.getElementById("adStatus"),
  activityList: document.getElementById("activityList"),
};

function initTelegram() {
  if (!window.Telegram?.WebApp) return;

  const tg = window.Telegram.WebApp;
  tg.ready();
  tg.expand();
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    state.pineapples = Number(parsed.pineapples) || 0;
    state.history = Array.isArray(parsed.history) ? parsed.history.slice(0, 20) : [];
    state.nextAdAt = Number(parsed.nextAdAt) || 0;
  } catch {
    console.warn("Не удалось прочитать состояние");
  }
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      pineapples: state.pineapples,
      history: state.history,
      nextAdAt: state.nextAdAt,
    }),
  );
}

function toRub(pineapples) {
  return (pineapples / PINEAPPLES_PER_RUBLE).toFixed(2);
}

function addActivity(message) {
  state.history.unshift(`${new Date().toLocaleTimeString()} — ${message}`);
  state.history = state.history.slice(0, 8);
}

function renderActivity() {
  refs.activityList.innerHTML = "";

  if (!state.history.length) {
    const li = document.createElement("li");
    li.textContent = "Пока пусто — посмотри первую рекламу";
    refs.activityList.append(li);
    return;
  }

  state.history.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    refs.activityList.append(li);
  });
}

function renderBalance() {
  refs.pineappleCount.textContent = String(state.pineapples);
  refs.rubAmount.textContent = toRub(state.pineapples);
}

function renderAdState() {
  const now = Date.now();
  const msLeft = state.nextAdAt - now;

  if (msLeft <= 0) {
    refs.watchAdBtn.disabled = false;
    refs.adStatus.textContent = "Реклама доступна";
    return;
  }

  refs.watchAdBtn.disabled = true;
  refs.adStatus.textContent = `Следующая реклама через ${Math.ceil(msLeft / 1000)} сек.`;
}

function rewardFromAd() {
  state.pineapples += AD_REWARD;
  state.nextAdAt = Date.now() + AD_COOLDOWN_MS;
  addActivity(`Реклама просмотрена: +${AD_REWARD} 🍍`);
  saveState();
  render();
}

function setupEvents() {
  refs.watchAdBtn.addEventListener("click", () => {
    if (Date.now() < state.nextAdAt) return;

    refs.adStatus.textContent = "Смотрим рекламу...";
    refs.watchAdBtn.disabled = true;

    setTimeout(() => {
      rewardFromAd();
    }, 1800);
  });
}

function render() {
  renderBalance();
  renderActivity();
  renderAdState();
}

function startTicker() {
  setInterval(renderAdState, 500);
}

function init() {
  initTelegram();
  loadState();
  setupEvents();
  render();
  startTicker();
}

init();
