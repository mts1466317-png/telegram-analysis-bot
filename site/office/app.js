"use strict";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const TAU = Math.PI * 2;
const pad = (n, l = 2) => String(n).padStart(l, "0");
const MASTERS = new Set([11, 22, 33, 44, 55, 66, 77, 88, 99]);
const KEY = "souloffice.v1";
const PRICE = "3 333 ₽";
const BOT_URL = "https://t.me/GodStatistics_bot";

const LETTER_RU = { 1: "АИСЪ", 2: "БЙТЫ", 3: "ВКУЬ", 4: "ГЛФЭ", 5: "ДМХЮ", 6: "ЕНЦЯ", 7: "ОЧ", 8: "ЖПШ", 9: "ЗРЩ" };
const LETTER_EN = { 1: "AJS", 2: "BKT", 3: "CLU", 4: "DMV", 5: "ENW", 6: "FOX", 7: "GPY", 8: "HQZ", 9: "IR" };

function mapOf(groups) {
  const m = {};
  Object.entries(groups).forEach(([n, letters]) => {
    for (const ch of letters) m[ch] = Number(n);
  });
  return m;
}
const RU_MAP = mapOf(LETTER_RU);
const EN_MAP = mapOf(LETTER_EN);

const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

const SPHERES = [
  { id: "physical", title: "Физическое тело", about: "Качества, из которых складывается здоровье и отклик тела.", sub: "Σ всех букв ФИО + день", color: "#f0b429" },
  { id: "astral", title: "Астральное тело", about: "Качества, из которых складываются чувства и эмоции.", sub: "Σ имени + месяц", color: "#37e0f0" },
  { id: "mental", title: "Ментальное тело", about: "Как складываются мысли, картина мира и интуитивные представления.", sub: "Σ фамилии + год", color: "#8b5cf6" },
  { id: "life", title: "Жизненная задача", about: "Качества, которые предстоит приобрести в этом воплощении.", sub: "день + месяц + год", color: "#ff9f1c" },
  { id: "egregor", title: "Родовой эгрегор", about: "Настрой рода. Через него легче идти к жизненной задаче.", sub: "Σ всех букв ФИО", color: "#ffa8c9" },
  { id: "higher", title: "Высшее Я", about: "Качества, уже наработанные в прошлых воплощениях.", sub: "Σ ФИО + сумма цифр даты", color: "#4c8dff" },
  { id: "program", title: "Родовая программа", about: "Задача рода: чем воплощение возмещает затраты родового эгрегора.", sub: "ментальное + эгрегор", color: "#ff3d8b" },
  { id: "social", title: "Социальная задача", about: "Чего от человека ждут земные эгрегоры в этом воплощении.", sub: "астральное + жизненная", color: "#31d68a" },
  { id: "combo", title: "Сочетание задач", about: "Жизненная и социальная задачи, взятые вместе. Их собственные тексты от этого не меняются.", sub: "социальная + жизненная", color: "#f4e7cf" },
];
const FREE = new Set(["physical", "life", "higher", "social"]);
const CARD_PRETTY = "2202 2089 7358 7430";
const CARD_RAW = "2202208973587430";
const RECIPIENT = "Егор Малеев";

function reduceNumber(n) {
  n = Math.abs(Math.round(Number(n) || 0));
  while (n > 9 && !MASTERS.has(n)) {
    n = String(n).split("").reduce((a, d) => a + Number(d), 0);
  }
  return n;
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function scriptOf(text) {
  let ru = false;
  let en = false;
  for (const ch of String(text).toUpperCase()) {
    if (RU_MAP[ch] || ch === "Ё") ru = true;
    else if (EN_MAP[ch]) en = true;
  }
  if (ru && en) return "mixed";
  if (en) return "en";
  return "ru";
}

function lettersOf(text, mode) {
  const map = mode === "en" ? EN_MAP : RU_MAP;
  const items = [];
  for (const ch of String(text)) {
    const u = ch.toUpperCase();
    if (u === "Ё" && mode !== "en") {
      items.push({ ch: u, v: 0 });
      continue;
    }
    if (map[u]) items.push({ ch: u, v: map[u] });
  }
  return items;
}

function sumItems(items) {
  return items.reduce((a, it) => a + it.v, 0);
}

function validDate(d, m, y) {
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

function compute(inp) {
  const last = String(inp.last || "").trim();
  const first = String(inp.first || "").trim();
  const middle = String(inp.middle || "").trim();
  const mode = scriptOf(`${last} ${first} ${middle}`);
  if (mode === "mixed") return { error: "mixed" };
  const day = Number(inp.d);
  const month = Number(inp.m);
  const year = Number(inp.y);
  if (!validDate(day, month, year)) return { error: "date" };
  const parts = [
    { key: "surname", label: "Фамилия", text: last },
    { key: "name", label: "Имя", text: first },
    { key: "patronymic", label: "Отчество", text: middle },
  ].map((p) => {
    const items = lettersOf(p.text, mode);
    return { ...p, items, sum: sumItems(items) };
  });
  const fio = parts.reduce((a, p) => a + p.sum, 0);
  const dateStr = `${pad(day)}.${pad(month)}.${year}`;
  const dateDigits = dateStr.replace(/\D/g, "").split("").reduce((a, d) => a + Number(d), 0);
  const physical = reduceNumber(fio + day);
  const astral = reduceNumber(parts[1].sum + month);
  const mental = reduceNumber(parts[0].sum + year);
  const life = reduceNumber(day + month + year);
  const egregor = reduceNumber(fio);
  const higher = reduceNumber(fio + dateDigits);
  const program = reduceNumber(mental + egregor);
  const social = reduceNumber(astral + life);
  const combo = reduceNumber(social + life);
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age -= 1;
  if (age < 0) age = 0;
  const cycle = Math.floor(age / 7) + 1;
  const cycleEnergy = reduceNumber(life + cycle);
  const nums = { physical, astral, mental, life, egregor, higher, program, social, combo };
  return {
    last, first, middle,
    full: [last, first, middle].filter(Boolean).join(" "),
    day, month, year, dateStr, dateDigits, mode, parts, fio, age,
    cycle, cycleStart: (cycle - 1) * 7, cycleEnd: cycle * 7 - 1, cycleEnergy,
    nums,
  };
}

function cyclesOf(profile, count = 12) {
  const rows = [];
  for (let n = 1; n <= count; n++) {
    rows.push({
      n,
      start: (n - 1) * 7,
      end: n * 7 - 1,
      energy: reduceNumber(profile.nums.life + n),
      current: n === profile.cycle,
    });
  }
  return rows;
}

let CONTENT = null;
let state = { profile: null, paid: false, accessCode: null, sound: false, waitlist: null };
let accessTimer = null;
let V = null;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...state, ...JSON.parse(raw) };
    state.paid = false;
  } catch (e) { /* keep defaults */ }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
}

function planetName(num) {
  if (!CONTENT) return String(num);
  return CONTENT.planets[String(num)] || String(num);
}

function entryFor(block, num) {
  if (!block) return null;
  const name = planetName(num);
  if (MASTERS.has(num) && block[name]) return block[name];
  const base = String(name).replace(" (мастер)", "");
  return block[base] || null;
}

function toast(msg, kind = "") {
  const box = $("#toasts");
  if (!box) return;
  const el = document.createElement("div");
  el.className = "toast " + kind;
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 400); }, 4200);
}

function updateStatus() {
  const t = $("#statusTxt");
  const d = $("#statusDot");
  const cta = $("#navCta");
  if (!t) return;
  if (!state.profile) {
    t.textContent = "Прошение не подано";
    d.style.background = "#69719b";
    d.style.boxShadow = "none";
    cta.textContent = "Подать прошение";
  } else if (!state.paid) {
    t.textContent = "Базовая версия выдана";
    d.style.background = "#ff9f1c";
    d.style.boxShadow = "0 0 10px #ff9f1c";
    cta.textContent = "Открыть полный доступ";
  } else {
    t.textContent = "Полный паспорт открыт";
    d.style.background = "#31d68a";
    d.style.boxShadow = "0 0 10px #31d68a";
    cta.textContent = "Мой паспорт";
  }
}

function lens(kind, label, text) {
  if (!text) return "";
  return `<div class="lens ${kind}"><span>${label}</span><p>${esc(text)}</p></div>`;
}

function renderBanner() {
  const b = $("#docBanner");
  if (!b) return;
  if (!V) {
    b.className = "banner spec";
    b.innerHTML = "<span>Документ появится после прошения</span>";
    return;
  }
  if (!state.paid) {
    b.className = "banner basic";
    b.innerHTML = `<span>Базовая версия · момент проявленности</span><button class="btn sm" data-act="buy" type="button">Полный паспорт в боте</button>`;
  } else {
    b.className = "banner full";
    b.innerHTML = "<span>Полный паспорт</span>";
  }
}

function radarSVG() {
  const S = SPHERES.length;
  const cx = 150;
  const cy = 150;
  const R = 104;
  let axes = "";
  let labels = "";
  const poly = [];
  SPHERES.forEach((s, i) => {
    const open = state.paid || FREE.has(s.id);
    const a = (i / S) * TAU - Math.PI / 2;
    const x = cx + Math.cos(a) * R;
    const y = cy + Math.sin(a) * R;
    axes += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(154,163,199,.2)" stroke-width=".6"/>`;
    const lx = cx + Math.cos(a) * (R + 24);
    const ly = cy + Math.sin(a) * (R + 24);
    const raw = V.nums[s.id];
    const shown = raw > 9 ? 9 : raw;
    labels += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" fill="${open ? s.color : "#69719b"}" font-family="JetBrains Mono, monospace" font-size="7" letter-spacing=".4" text-anchor="middle" dominant-baseline="middle">${esc(s.title.split(" ")[0].toUpperCase())}</text>`;
    if (open) {
      const rr = R * (shown / 9);
      poly.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
    }
  });
  let rings = "";
  [0.33, 0.66, 1].forEach((k) => {
    rings += `<circle cx="${cx}" cy="${cy}" r="${R * k}" fill="none" stroke="rgba(154,163,199,.14)" stroke-width=".6"/>`;
  });
  return `<svg class="radar" viewBox="0 0 300 300" role="img" aria-label="Вибрации девяти сфер">${rings}${axes}${poly.length > 2 ? `<polygon points="${poly.join(" ")}" fill="rgba(240,180,41,.16)" stroke="#f0b429" stroke-width="1.2"/>` : ""}${labels}</svg>`;
}

function sphereCard(s, index) {
  const num = V.nums[s.id];
  const open = state.paid || FREE.has(s.id);
  const expanded = false;
  const data = open ? entryFor(CONTENT && CONTENT.bodies[s.id], num) : null;
  const lenses = data && data.manifestation ? lens("m", "Проявленность", data.manifestation) : "";
  const paidLenses = state.paid && data
    ? `${lens("r", "Риски", data.risks)}${lens("p", "Рекомендации", data.recommendations)}`
    : "";
  const body = open
    ? `<div class="lenses">${lenses || `<p class="essay">Текст проявленности не загрузился.</p>`}${paidLenses}</div>`
    : "";
  const veil = open ? "" : `<div class="veil"><div class="veil-in"><p>Полный паспорт</p><button class="btn sm" type="button" data-act="buy">Реквизиты</button></div></div>`;
  const detail = open ? `${num} · ${esc(planetName(num))}` : "после оплаты в боте";
  return `<article class="sphere${expanded ? " open" : ""}${open ? "" : " locked"}" style="--sc:${s.color}" data-sph="${index}">
    <button class="sph-top" type="button" data-act="toggle" aria-expanded="${expanded ? "true" : "false"}">
      <span class="sph-n">${pad(index + 1)}</span>
      <span class="sph-t"><b>${esc(s.title)}</b><em class="about">${esc(s.about)}</em><span>${detail}</span></span>
      <svg class="sph-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 9l6 6 6-6"/></svg>
    </button>
    <div class="sph-body"><div class="sph-inner">${body}</div></div>
    ${veil}
  </article>`;
}

function spheresHTML() {
  return `<div class="sph-head">
      <div>
        <h3>Девять сфер</h3>
        <p class="lead" style="margin-top:8px">Под названием каждой сферы — что она описывает. Число ниже показывает, как это собрано у вас. ${state.paid ? "Полный паспорт открыт: к тексту добавлены риски и рекомендации." : "В базовой версии открыт момент проявленности четырёх сфер. Остальные тексты, риски, рекомендации и формулы приходят после оплаты."}</p>
      </div>
      ${radarSVG()}
    </div>
    <div class="sph-list">${SPHERES.map(sphereCard).join("")}</div>`;
}

function paywallBlock(text) {
  return `<div class="pad"><p class="lead">${text}</p><button class="btn sm" type="button" data-act="buy">Реквизиты для оплаты</button></div>`;
}

function cyclesHTML() {
  if (!state.paid) {
    return paywallBlock("Тексты семилетних циклов входят в полный паспорт. Он приходит в бот после того, как оплата подтверждена в Telegram.");
  }
  const rows = cyclesOf(V);
  const cards = rows.map((c) => {
    const showText = state.paid || c.current;
    const data = showText ? entryFor(CONTENT && CONTENT.cycle, c.energy) : null;
    const text = data
      ? `${lens("m", "Проявленность", data.manifestation)}${lens("p", "Фокус", data.focus)}${lens("r", "Риски", data.risks)}${lens("p", "Рекомендации", data.recommendations)}`
      : `<p class="formula">Текст цикла открывается вместе с полным документом.</p>`;
    return `<article class="cyc${c.current ? " now" : ""}">
      <div class="cyc-y">${c.current ? "Сейчас" : "Цикл"} · ${c.start}–${c.end} лет</div>
      <div class="cyc-n">${c.n}</div>
      <div class="cyc-t">${c.energy} · ${esc(planetName(c.energy))}</div>
      ${text}
    </article>`;
  }).join("");
  return `<div class="pad">
    <h3>Семилетние циклы</h3>
    <p class="lead" style="margin:8px 0 16px">Номер цикла — это возраст, делённый на 7, плюс один. Энергия цикла — свёртка жизненной задачи и этого номера. Сейчас ${V.cycle}-й цикл, ${V.cycleStart}–${V.cycleEnd} лет, энергия ${V.cycleEnergy} · ${esc(planetName(V.cycleEnergy))}.</p>
    <div class="cyc-grid">${cards}</div>
  </div>`;
}

function matrixHTML() {
  if (!state.paid) {
    return paywallBlock("Буквы, суммы и сложения до свёртки входят в полный паспорт. В базовой версии их нет.");
  }
  const words = V.parts.map((p) => {
    const chips = p.items.length
      ? p.items.map((it) => `<span class="lt${it.v === 0 ? " v" : ""}"><b>${esc(it.ch)}</b><span>${it.v}</span></span>`).join("")
      : `<span class="formula">нет букв</span>`;
    return `<div class="mtx-word"><h4>${esc(p.label)} · сумма ${p.sum}</h4><div class="lts">${chips}</div></div>`;
  }).join("");
  const n = V.nums;
  const lines = [
    ["Физическое тело", `${V.fio} + ${V.day}`, n.physical],
    ["Астральное тело", `${V.parts[1].sum} + ${V.month}`, n.astral],
    ["Ментальное тело", `${V.parts[0].sum} + ${V.year}`, n.mental],
    ["Жизненная задача", `${V.day} + ${V.month} + ${V.year}`, n.life],
    ["Родовой эгрегор", `${V.fio}`, n.egregor],
    ["Высшее Я", `${V.fio} + ${V.dateDigits}`, n.higher],
    ["Родовая программа", `${n.mental} + ${n.egregor}`, n.program],
    ["Социальная задача", `${n.astral} + ${n.life}`, n.social],
    ["Сочетание задач", `${n.social} + ${n.life}`, n.combo],
    ["Энергия цикла", `${n.life} + ${V.cycle}`, V.cycleEnergy],
  ];
  const table = lines.map(([name, expr, val]) => `<tr><td>${esc(name)}</td><td class="formula">${esc(expr)}</td><td>${val}</td><td>${esc(planetName(val))}</td></tr>`).join("");
  return `<div class="pad">
    <h3>Матрица расчёта</h3>
    <p class="lead" style="margin:8px 0 16px">Буква «ё» в сумму не входит. Год в ментальном теле берётся целиком, не как сумма цифр. Мастер-числа 11, 22, 33, 44, 55, 66, 77, 88 и 99 не сворачиваются.</p>
    ${words}
    <div class="cmp" style="margin-top:18px"><table class="mx">
      <thead><tr><th>Сфера</th><th>До свёртки</th><th>Число</th><th>Планета</th></tr></thead>
      <tbody>${table}</tbody>
    </table></div>
  </div>`;
}

function manifestation(blockId, num) {
  const data = entryFor(CONTENT && CONTENT.bodies && CONTENT.bodies[blockId], num);
  return (data && data.manifestation) || "";
}

function pairReport(other) {
  const life = reduceNumber(V.nums.life + other.nums.life);
  const social = reduceNumber(V.nums.social + other.nums.social);
  const shared = SPHERES.filter((s) => V.nums[s.id] === other.nums[s.id]);
  const sharedLine = shared.length
    ? "Одно и то же число в сферах: " + shared.map((s) => `${s.title.toLowerCase()} · ${V.nums[s.id]} ${planetName(V.nums[s.id])}`).join("; ") + "."
    : "Одинаковых чисел нет: сферы собраны из разных планет.";
  const rows = SPHERES.map((s) => {
    const a = V.nums[s.id];
    const b = other.nums[s.id];
    return `<tr><td>${esc(s.title)}</td><td>${a} · ${esc(planetName(a))}</td><td>${b} · ${esc(planetName(b))}</td><td>${a === b ? "совпадает" : ""}</td></tr>`;
  }).join("");
  const person = (p) => `<article class="pair-col">
      <h4>${esc(p.full)}</h4>
      <p class="formula">${esc(p.dateStr)} · ${p.age} лет</p>
      ${lens("m", `Жизненная задача · ${p.nums.life} · ${planetName(p.nums.life)}`, manifestation("life", p.nums.life))}
      ${lens("m", `Социальная задача · ${p.nums.social} · ${planetName(p.nums.social)}`, manifestation("social", p.nums.social))}
    </article>`;
  return `<div class="pair-report">
    <p class="pair-same">${esc(sharedLine)}</p>
    <div class="pair-board">${person(V)}${person(other)}</div>
    <div class="pair-vector">
      <h4>Общий вектор</h4>
      <p class="lead">Свёртка двух чисел. Это не третий человек и не отдельная формула пары: ниже тот же текст сферы, который уже есть у этого числа.</p>
      ${lens("m", `Жизненные задачи вместе · ${life} · ${planetName(life)}`, manifestation("life", life))}
      ${lens("m", `Социальные задачи вместе · ${social} · ${planetName(social)}`, manifestation("social", social))}
    </div>
    <div class="cmp" style="margin-top:16px"><table>
      <thead><tr><th>Сфера</th><th>${esc(V.full)}</th><th>${esc(other.full)}</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
  </div>`;
}

function keysHTML() {
  if (!state.paid) {
    return paywallBlock("Созвучие двух паспортов входит в полный документ и открывается после подтверждения оплаты.");
  }
  return `<div class="pad">
    <h3>Созвучие</h3>
    <p class="lead" style="margin:8px 0 16px">Два паспорта считаются теми же формулами. Рядом встают жизненная и социальная задачи каждого, затем их свёртка. Общий вектор читается текстом уже известной сферы, а не новым гороскопом пары.</p>
    <form class="reso-form pair-form" id="keyForm">
      <div class="field"><label for="kLast">Фамилия</label><input id="kLast" type="text" autocomplete="off"></div>
      <div class="field"><label for="kFirst">Имя</label><input id="kFirst" type="text" autocomplete="off"></div>
      <div class="field"><label for="kMiddle">Отчество, если есть</label><input id="kMiddle" type="text" autocomplete="off"></div>
      <div class="dob">
        <select id="kDay" aria-label="День"></select>
        <select id="kMonth" aria-label="Месяц"></select>
        <select id="kYear" aria-label="Год"></select>
      </div>
      <button class="btn sm" type="submit">Сложить паспорта</button>
    </form>
    <div id="keyOut"><p class="lead" style="margin-top:16px">Введите второй паспорт — имя и дату, как в документе.</p></div>
  </div>`;
}

function renderPassport() {
  if (state.profile) V = compute(state.profile);
  else V = null;
  if (V && V.error) V = null;
  renderBanner();
  const spheres = $("#p-spheres");
  const cycles = $("#p-cycles");
  const matrix = $("#p-matrix");
  const keys = $("#p-keys");
  if (!V) {
    const empty = `<div class="pad"><p class="lead">Подайте прошение — документ соберётся из фамилии, имени, отчества и даты.</p></div>`;
    spheres.innerHTML = empty;
    cycles.innerHTML = "";
    matrix.innerHTML = "";
    keys.innerHTML = "";
    return;
  }
  spheres.innerHTML = spheresHTML();
  cycles.innerHTML = cyclesHTML();
  matrix.innerHTML = matrixHTML();
  keys.innerHTML = keysHTML();
  fillDateSelects($("#kDay"), $("#kMonth"), $("#kYear"));
}

function setTab(id) {
  $$(".tab").forEach((t) => {
    const on = t.dataset.tab === id;
    t.classList.toggle("on", on);
    t.setAttribute("aria-selected", on ? "true" : "false");
  });
  $$(".panel").forEach((p) => p.classList.toggle("on", p.id === "p-" + id));
}

function liveReadout() {
  const inp = readForm();
  const box = $("#liveBox");
  if (!box) return;
  if (!inp.last && !inp.first) {
    box.innerHTML = `<p class="formula">Числа появятся, когда в полях будут имя и дата.</p>`;
    return;
  }
  const p = compute(inp);
  if (p.error === "mixed") {
    box.innerHTML = `<p class="formula">Фамилия, имя и отчество должны быть в одном алфавите.</p>`;
    return;
  }
  if (p.error) {
    box.innerHTML = `<p class="formula">Дата пока не собрана.</p>`;
    return;
  }
  const n = p.nums;
  const cells = [
    ["Физическое", `${n.physical} · ${planetName(n.physical)}`],
    ["Жизненная", `${n.life} · ${planetName(n.life)}`],
    ["Высшее Я", `${n.higher} · ${planetName(n.higher)}`],
    ["Социальная", `${n.social} · ${planetName(n.social)}`],
  ];
  box.innerHTML = `<div class="ro-grid">${cells.map(([k, v]) => `<div class="ro"><span>${esc(k)}</span><b style="font-size:22px">${esc(v)}</b></div>`).join("")}</div>`;
}

function readForm() {
  return {
    last: $("#iLast").value,
    first: $("#iFirst").value,
    middle: $("#iMiddle").value,
    d: Number($("#iDay").value),
    m: Number($("#iMonth").value),
    y: Number($("#iYear").value),
  };
}

function fillDateSelects(dayEl, monthEl, yearEl, selected) {
  if (!dayEl || dayEl.options.length) return;
  dayEl.innerHTML = Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join("");
  monthEl.innerHTML = MONTHS.map((name, i) => `<option value="${i + 1}">${name}</option>`).join("");
  const now = new Date().getFullYear();
  const years = [];
  for (let y = now; y >= 1920; y--) years.push(`<option value="${y}">${y}</option>`);
  yearEl.innerHTML = years.join("");
  if (selected) {
    dayEl.value = String(selected.d);
    monthEl.value = String(selected.m);
    yearEl.value = String(selected.y);
  } else {
    dayEl.value = "1";
    monthEl.value = "1";
    yearEl.value = "1990";
  }
}

function markField(id, bad) {
  const el = $("#" + id);
  if (el) el.classList.toggle("bad", bad);
}

function validate(inp, consent) {
  let ok = true;
  const letterRe = /^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё'\-\s]{1,}$/;
  const lastOk = letterRe.test(inp.last.trim());
  const firstOk = letterRe.test(inp.first.trim());
  const middle = inp.middle.trim();
  const middleOk = !middle || letterRe.test(middle);
  markField("fLast", !lastOk);
  markField("fFirst", !firstOk);
  markField("fMiddle", !middleOk);
  const dateOk = validDate(inp.d, inp.m, inp.y) && inp.y <= new Date().getFullYear();
  markField("fDob", !dateOk);
  const consentEl = $("#fConsent");
  if (consentEl) consentEl.classList.toggle("bad", !consent);
  ok = lastOk && firstOk && middleOk && dateOk && consent;
  if (ok && scriptOf(`${inp.last} ${inp.first} ${inp.middle}`) === "mixed") {
    toast("Нужен один алфавит: только кириллица или только латиница", "err");
    ok = false;
  }
  return ok;
}

function openModal(id) { const m = $("#" + id); if (m) m.classList.add("on"); }
function closeModal(id) { const m = $("#" + id); if (m) m.classList.remove("on"); }

function checkoutHTML() {
  return `<p class="lead">Кнопка откроет бота с уже введёнными именем и датой. Там останется перевести ${PRICE} и нажать «Я оплатил». Когда оплату подтвердят, эта страница откроет полный паспорт сама. В боте также придёт прямая ссылка.</p>
  <div class="meta-list" style="margin:14px 0">
    <div class="meta"><span>Сумма</span><b>${PRICE}</b></div>
    <div class="meta"><span>Карта</span><b>${CARD_PRETTY}</b></div>
    <div class="meta"><span>Получатель</span><b>${RECIPIENT}</b></div>
  </div>
  <div class="form-actions">
    <button class="btn sm" type="button" data-copy="${CARD_RAW}" data-copy-msg="Номер карты скопирован">Скопировать карту</button>
    <button class="btn ghost sm" type="button" data-copy="${RECIPIENT}" data-copy-msg="Имя получателя скопировано">Скопировать получателя</button>
    <button class="btn solid sm" type="button" id="payBotBtn">Открыть оплату в боте</button>
  </div>`;
}

async function openBotPayment() {
  if (!state.profile) {
    toast("Сначала подайте прошение", "err");
    return;
  }
  try {
    const res = await fetch("/mysoulpassport/handoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        last: state.profile.last,
        first: state.profile.first,
        middle: state.profile.middle || "",
        d: state.profile.d,
        m: state.profile.m,
        y: state.profile.y,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.url || !data.code) throw new Error("handoff");
    state.accessCode = data.code;
    state.paid = false;
    save();
    watchAccess();
    window.open(data.url, "_blank", "noopener");
  } catch (e) {
    toast("Не удалось открыть бота с этими данными", "err");
  }
}

function showBuy() {
  $("#coBody").innerHTML = checkoutHTML();
  openModal("checkout");
  $("#payBotBtn").addEventListener("click", openBotPayment);
}

let accessCheck = null;

async function refreshAccess() {
  if (!state.accessCode || state.paid) return;
  if (accessCheck) return accessCheck;
  accessCheck = loadPaidPassport().finally(() => { accessCheck = null; });
  return accessCheck;
}

async function loadPaidPassport() {
  if (!state.accessCode || state.paid) return;
  let data;
  try {
    const res = await fetch("/mysoulpassport/access/" + state.accessCode, { cache: "no-store" });
    data = await res.json();
  } catch (e) {
    return;
  }
  if (!data.paid) return;
  let fullBody = null;
  try {
    const full = await fetch("/mysoulpassport/full/" + state.accessCode, { cache: "no-store" });
    if (full.ok) fullBody = await full.json();
  } catch (e) { /* keep polling */ }
  if (!fullBody || !fullBody.bodies) return;
  CONTENT = fullBody;
  state.paid = true;
  if (data.profile) state.profile = data.profile;
  save();
  renderPassport();
  updateStatus();
  closeModal("checkout");
  toast("Оплата подтверждена. Полный паспорт открыт.", "ok");
  if (location.hash !== "#passport") location.hash = "#passport";
  if (accessTimer) {
    clearInterval(accessTimer);
    accessTimer = null;
  }
}

function watchAccess() {
  if (accessTimer || !state.accessCode || state.paid) return;
  accessTimer = setInterval(refreshAccess, 8000);
}

function copyText(value, okMsg) {
  const done = () => toast(okMsg || "Скопировано", "ok");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(value).then(done).catch(() => toast(value, "info"));
    return;
  }
  toast(value, "info");
}

function issue() {
  const overlay = $("#issuing");
  overlay.classList.add("on");
  const bar = $("#issBar");
  let step = 0;
  const steps = $$("#issSteps .iss-step");
  const timer = setInterval(() => {
    steps.forEach((el, i) => {
      el.classList.toggle("done", i < step);
      el.classList.toggle("act", i === step);
    });
    step += 1;
    if (bar) bar.style.width = Math.min(100, step * 25) + "%";
    if (step > steps.length) {
      clearInterval(timer);
      overlay.classList.remove("on");
      renderPassport();
      updateStatus();
      location.hash = "#passport";
      setTab("spheres");
    }
  }, 450);
  $("#issSkip").onclick = () => {
    clearInterval(timer);
    overlay.classList.remove("on");
    renderPassport();
    updateStatus();
    location.hash = "#passport";
  };
}

function bindNav() {
  const links = $$("#navlinks a");
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + en.target.id));
    });
  }, { rootMargin: "-40% 0px -50% 0px" });
  $$("main section").forEach((s) => obs.observe(s));
}

function sky() {
  const c = $("#sky");
  if (!c) return;
  const x = c.getContext("2d");
  let w = 0;
  let h = 0;
  let stars = [];
  let shoot = null;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function resize() {
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    w = window.innerWidth;
    h = window.innerHeight;
    c.width = Math.floor(w * dpr);
    c.height = Math.floor(h * dpr);
    c.style.width = w + "px";
    c.style.height = h + "px";
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(340, Math.max(110, (w * h) / 7000)));
    stars = Array.from({ length: n }, (_, i) => {
      const layer = i % 3;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: (layer === 0 ? 0.5 : layer === 1 ? 0.9 : 1.5) * (0.6 + Math.random() * 0.8),
        s: (layer + 1) * 0.006,
        p: Math.random() * TAU,
        tw: 0.4 + Math.random() * 1.4,
        c: layer === 2 ? "#f0b429" : layer === 1 ? "#cfe0ff" : "#8fa3d8",
      };
    });
  }
  resize();
  window.addEventListener("resize", resize, { passive: true });
  let last = performance.now();
  function frame(t) {
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    x.clearRect(0, 0, w, h);
    const sy = window.scrollY || 0;
    stars.forEach((s) => {
      s.p += dt * s.tw;
      const a = 0.28 + Math.abs(Math.sin(s.p)) * 0.62;
      let yy = (s.y - sy * s.s * 0.35) % h;
      if (yy < 0) yy += h;
      x.globalAlpha = a;
      x.fillStyle = s.c;
      x.beginPath();
      x.arc(s.x, yy, s.r, 0, TAU);
      x.fill();
    });
    x.globalAlpha = 1;
    if (!reduced) {
      if (!shoot && Math.random() < dt * 0.09) {
        shoot = { x: Math.random() * w * 0.8, y: Math.random() * h * 0.4, vx: 260 + Math.random() * 220, vy: 90 + Math.random() * 70, life: 0, max: 1.1 };
      }
      if (shoot) {
        shoot.life += dt;
        shoot.x += shoot.vx * dt;
        shoot.y += shoot.vy * dt;
        const k = 1 - shoot.life / shoot.max;
        if (k <= 0) shoot = null;
        else {
          const g = x.createLinearGradient(shoot.x, shoot.y, shoot.x - shoot.vx * 0.16, shoot.y - shoot.vy * 0.16);
          g.addColorStop(0, "rgba(255,240,200," + (k * 0.9) + ")");
          g.addColorStop(1, "rgba(255,240,200,0)");
          x.strokeStyle = g;
          x.lineWidth = 1.5;
          x.beginPath();
          x.moveTo(shoot.x, shoot.y);
          x.lineTo(shoot.x - shoot.vx * 0.16, shoot.y - shoot.vy * 0.16);
          x.stroke();
        }
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function guilloche() {
  const svg = $("#guilloche");
  if (!svg) return;
  const W = 1200;
  const H = 800;
  svg.setAttribute("viewBox", "0 0 " + W + " " + H);
  let paths = "";
  for (let k = 0; k < 7; k++) {
    let d = "";
    const R = 180 + k * 26;
    const r = 52 + k * 9;
    const dd = 90 + k * 17;
    for (let i = 0; i <= 720; i++) {
      const t = (i / 720) * TAU * 6;
      const px = W / 2 + (R - r) * Math.cos(t) + dd * Math.cos(((R - r) / r) * t);
      const py = H / 2 + (R - r) * Math.sin(t) - dd * Math.sin(((R - r) / r) * t);
      d += (i ? "L" : "M") + px.toFixed(1) + " " + py.toFixed(1);
    }
    paths += '<path d="' + d + '" fill="none" stroke="' + (k % 2 ? "#f0b429" : "#37e0f0") + '" stroke-width=".5" opacity="' + (0.5 - k * 0.05) + '"/>';
  }
  svg.innerHTML = paths;
}

function bindSound() {
  const b = $("#sndBtn");
  if (!b) return;
  let ctx = null;
  let master = null;
  function set(on) {
    state.sound = on;
    save();
    b.dataset.on = on ? "1" : "0";
    b.setAttribute("aria-pressed", String(on));
    b.setAttribute("aria-label", "Звук канцелярии: " + (on ? "включён" : "выключен"));
    if (on && !ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.0001;
      master.connect(ctx.destination);
      const g = ctx.createGain();
      g.gain.value = 0.05;
      g.connect(master);
      [55, 82.5, 110].forEach((f, i) => {
        const o = ctx.createOscillator();
        o.type = i === 2 ? "triangle" : "sine";
        o.frequency.value = f;
        const og = ctx.createGain();
        og.gain.value = 0.25;
        o.connect(og);
        og.connect(g);
        o.start();
      });
    }
    if (ctx && master) {
      if (ctx.state === "suspended") ctx.resume();
      master.gain.setTargetAtTime(on ? 0.45 : 0, ctx.currentTime, 0.4);
    }
  }
  b.addEventListener("click", () => set(b.dataset.on !== "1"));
}

function bindPhysical() {
  const obj = $("#physObj");
  if (!obj) return;
  obj.addEventListener("pointermove", (e) => {
    const r = obj.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    obj.style.transform = "rotateY(" + (x * 16).toFixed(2) + "deg) rotateX(" + (-y * 12).toFixed(2) + "deg)";
  });
  obj.addEventListener("pointerleave", () => { obj.style.transform = ""; });
}

function clock() {
  const el = $("#clockTxt");
  if (!el) return;
  const tick = () => {
    el.textContent = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };
  tick();
  setInterval(tick, 30000);
}

function solstice() {
  const now = new Date();
  let target = new Date(now.getFullYear(), 11, 21, 12, 0, 0);
  if (target < now) target = new Date(now.getFullYear() + 1, 11, 21, 12, 0, 0);
  const diff = target - now;
  const day = Math.floor(diff / 86400000);
  const hour = Math.floor((diff / 3600000) % 24);
  const min = Math.floor((diff / 60000) % 60);
  const sec = Math.floor((diff / 1000) % 60);
  const set = (id, v) => { const n = $("#" + id); if (n) n.textContent = String(v); };
  set("cdD", day);
  set("cdH", pad(hour));
  set("cdM", pad(min));
  set("cdS", pad(sec));
}

function renderWaitlist() {
  const box = $("#wlBox");
  if (!box) return;
  if (state.waitlist) {
    box.innerHTML = `<div class="wl-done"><div class="wl-num">${esc(state.waitlist.no)}</div><div><b>Вы в листе ожидания</b><p class="formula">${esc(state.waitlist.email)}</p></div></div>`;
    return;
  }
  box.innerHTML = `<p class="formula" style="margin-bottom:10px">Номер в очереди сохранится только в этом браузере.</p>
    <form class="wl-form" id="wlForm"><input id="wlEmail" type="email" placeholder="почта для очереди" required><button class="btn sm" type="submit">Встать в лист</button></form>`;
  $("#wlForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("#wlEmail").value.trim();
    if (!email.includes("@")) return;
    const no = String(100 + (Math.abs(hash(email)) % 200)).padStart(3, "0");
    state.waitlist = { email, no };
    save();
    renderWaitlist();
    toast("Номер в очереди сохранён в браузере", "ok");
  });
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function faq() {
  const items = [
    ["Это гороскоп?", "Нет. Число собирается из букв имени по фиксированной таблице и из даты рождения, затем сворачивается. Планета — имя этого числа в методике, а не положение на небе."],
    ["Почему социальная задача не совпала с текстом сочетания?", "Сочетание — отдельное число: социальная плюс жизненная. Текст сочетания описывает эту сумму. Он не переписывает жизненную и социальную задачи, у них свои числа и свои тексты."],
    ["Куда делась печать имени?", "Рисунок из букв убран, чтобы не спорить с расчётом. В документе остаются числа, планеты и тексты сфер."],
    ["Где хранятся данные?", "В этом браузере. На сервер уходит только сам файл страницы и тексты сфер, без вашего имени."],
  ];
  const root = $("#faq");
  if (!root) return;
  root.innerHTML = items.map(([q, a]) => `<div class="qa"><button type="button">${esc(q)}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg></button><div class="a"><div><p>${esc(a)}</p></div></div></div>`).join("");
}

function bind() {
  $("#regForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const inp = readForm();
    if (!validate(inp, $("#iConsent").checked)) return;
    state.profile = inp;
    state.paid = false;
    state.accessCode = null;
    save();
    issue();
  });
  ["iLast", "iFirst", "iMiddle", "iDay", "iMonth", "iYear"].forEach((id) => {
    $("#" + id).addEventListener("input", liveReadout);
    $("#" + id).addEventListener("change", liveReadout);
  });
  $("#fillSample").addEventListener("click", () => {
    $("#iLast").value = "Малеев";
    $("#iFirst").value = "Егор";
    $("#iMiddle").value = "Олегович";
    $("#iDay").value = "18";
    $("#iMonth").value = "5";
    $("#iYear").value = "1997";
    liveReadout();
  });
  $("#navCta").addEventListener("click", () => {
    if (!state.profile) location.hash = "#registry";
    else if (!state.paid) showBuy();
    else location.hash = "#passport";
  });
  $("#buyBtn").addEventListener("click", showBuy);
  document.body.addEventListener("click", (e) => {
    const copyBtn = e.target.closest("[data-copy]");
    if (copyBtn) copyText(copyBtn.dataset.copy, copyBtn.dataset.copyMsg);
    const tab = e.target.closest(".tab");
    if (tab) setTab(tab.dataset.tab);
    const qa = e.target.closest(".qa > button");
    if (qa) qa.parentElement.classList.toggle("open");
    const act = e.target.closest("[data-act]");
    if (!act) return;
    if (act.dataset.act === "buy") showBuy();
    if (act.dataset.act === "toggle") {
      const card = act.closest(".sphere");
      if (!card || card.classList.contains("locked")) return;
      const opened = card.classList.toggle("open");
      act.setAttribute("aria-expanded", opened ? "true" : "false");
    }
  });
  document.body.addEventListener("submit", (e) => {
    if (e.target.id !== "keyForm") return;
    e.preventDefault();
    const other = compute({
      last: $("#kLast").value,
      first: $("#kFirst").value,
      middle: $("#kMiddle").value,
      d: Number($("#kDay").value),
      m: Number($("#kMonth").value),
      y: Number($("#kYear").value),
    });
    const out = $("#keyOut");
    if (other.error) {
      out.innerHTML = `<p>${other.error === "mixed" ? "В втором имени смешаны алфавиты." : "Проверьте дату второго человека."}</p>`;
      return;
    }
    out.innerHTML = pairReport(other);
  });
  $("#newBtn").addEventListener("click", () => openModal("confirm"));
  $("#cfYes").addEventListener("click", () => {
    state.profile = null;
    state.paid = false;
    state.accessCode = null;
    save();
    closeModal("confirm");
    renderPassport();
    updateStatus();
    location.hash = "#registry";
  });
  $("#cfNo").addEventListener("click", () => closeModal("confirm"));
  $("#cfClose").addEventListener("click", () => closeModal("confirm"));
  $("#coClose").addEventListener("click", () => closeModal("checkout"));
  $("#shareBtn").addEventListener("click", async () => {
    if (!state.profile) { toast("Сначала подайте прошение", "err"); return; }
    const q = new URLSearchParams({
      last: state.profile.last,
      first: state.profile.first,
      middle: state.profile.middle || "",
      d: state.profile.d,
      m: state.profile.m,
      y: state.profile.y,
    });
    const url = `${location.origin}${location.pathname}?${q.toString()}#passport`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Ссылка скопирована", "ok");
    } catch (e) {
      toast(url, "info", 7000);
    }
  });
  $("#pdfBtn").addEventListener("click", () => {
    toast("Полный PDF выдаёт бот после оплаты", "info");
    openBotPayment();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeModal("checkout"); closeModal("confirm"); }
  });
}

function accessFromQuery() {
  const code = new URLSearchParams(location.search).get("access") || "";
  if (!/^[0-9a-f]{12}$/.test(code)) return;
  state.accessCode = code;
  state.paid = false;
  save();
}

function fromQuery() {
  const q = new URLSearchParams(location.search);
  if (!q.get("last") || !q.get("first")) return;
  const inp = {
    last: q.get("last"),
    first: q.get("first"),
    middle: q.get("middle") || "",
    d: Number(q.get("d")),
    m: Number(q.get("m")),
    y: Number(q.get("y")),
  };
  if (compute(inp).error) return;
  state.profile = inp;
  save();
}

async function main() {
  load();
  fromQuery();
  accessFromQuery();
  state.paid = false;
  await refreshAccess();
  if (!state.paid) {
    try {
      const res = await fetch("content.json");
      CONTENT = await res.json();
    } catch (e) {
      toast("Тексты сфер не загрузились. Числа всё равно считаются.", "err");
    }
  }
  fillDateSelects($("#iDay"), $("#iMonth"), $("#iYear"), state.profile || null);
  if (state.profile) {
    $("#iLast").value = state.profile.last || "";
    $("#iFirst").value = state.profile.first || "";
    $("#iMiddle").value = state.profile.middle || "";
    $("#iConsent").checked = true;
  }
  $("#formDate").textContent = new Date().toLocaleDateString("ru-RU");
  $("#priceVal").textContent = PRICE;
  faq();
  bind();
  bindNav();
  bindSound();
  bindPhysical();
  guilloche();
  sky();
  clock();
  solstice();
  setInterval(solstice, 1000);
  renderWaitlist();
  liveReadout();
  renderPassport();
  updateStatus();
  watchAccess();
  window.addEventListener("focus", refreshAccess);
  window.addEventListener("pageshow", refreshAccess);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refreshAccess();
  });
  const reveals = $$("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) en.target.classList.add("in"); });
    }, { threshold: 0.15 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }
}

const api = { compute, reduceNumber, planetName };
if (typeof module !== "undefined" && module.exports) module.exports = api;
if (typeof document !== "undefined") main();
