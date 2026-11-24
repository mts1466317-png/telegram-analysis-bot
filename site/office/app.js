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
  { id: "physical", title: "Физическое тело", sub: "Σ всех букв ФИО + день", color: "#f0b429" },
  { id: "astral", title: "Астральное тело", sub: "Σ имени + месяц", color: "#37e0f0" },
  { id: "mental", title: "Ментальное тело", sub: "Σ фамилии + год", color: "#8b5cf6" },
  { id: "life", title: "Жизненная задача", sub: "день + месяц + год", color: "#ff9f1c" },
  { id: "egregor", title: "Родовой эгрегор", sub: "Σ всех букв ФИО", color: "#ffa8c9" },
  { id: "higher", title: "Высшее Я", sub: "Σ ФИО + сумма цифр даты", color: "#4c8dff" },
  { id: "program", title: "Родовая программа", sub: "ментальное + эгрегор", color: "#ff3d8b" },
  { id: "social", title: "Социальная задача", sub: "астральное + жизненная", color: "#31d68a" },
  { id: "combo", title: "Сочетание задач", sub: "социальная + жизненная", color: "#f4e7cf" },
];
const FREE = new Set(["life", "social"]);

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
let state = { profile: null, paid: false, sound: false, waitlist: null };
let V = null;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...state, ...JSON.parse(raw) };
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
    t.textContent = "Полный текст открыт в браузере";
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
    b.innerHTML = `<span>Базовая версия · открыты жизненная и социальная задачи</span><button class="btn sm" data-act="buy" type="button">Открыть остальные сферы</button>`;
  } else {
    b.className = "banner full";
    b.innerHTML = "<span>Полный текст в этом браузере</span><span style=\"color:var(--slate)\">Оплата на сайте не проверяется</span>";
  }
}

function coverHTML() {
  const p = V;
  const n = p.nums;
  const cards = [
    ["Жизненная", n.life],
    ["Социальная", n.social],
    ["Сочетание", n.combo],
  ].map(([k, v]) => `<div class="bn"><span>${k}</span><b>${v}</b><span>${esc(planetName(v))}</span></div>`).join("");
  const rows = SPHERES.map((s) => {
    const v = n[s.id];
    return `<div class="meta"><span>${esc(s.title)}</span><b>${v} · ${esc(planetName(v))}</b></div>`;
  }).join("");
  return `<div class="spread">
    <div class="page left">
      <svg class="pass-seal" viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="86" fill="none" stroke="#f0b429" stroke-width="1.2" opacity=".8"/>
        <circle cx="100" cy="100" r="64" fill="none" stroke="#37e0f0" stroke-width=".6" opacity=".55"/>
        <path d="M100 42 L138 122 L62 122 Z" fill="none" stroke="#f0b429" stroke-width="1"/>
        <circle cx="100" cy="100" r="16" fill="#f0b429"/>
        <text x="100" y="106" text-anchor="middle" font-family="Cormorant Garamond, serif" font-size="18" fill="#1a1204">${n.life}</text>
      </svg>
      <div class="meta-list">
        <div class="meta"><span>Владелец</span><b>${esc(p.full)}</b></div>
        <div class="meta"><span>Дата рождения</span><b>${esc(p.dateStr)}</b></div>
        <div class="meta"><span>Алфавит</span><b>${p.mode === "en" ? "латиница" : "кириллица"}</b></div>
        <div class="meta"><span>Σ ФИО</span><b>${p.fio}</b></div>
        <div class="meta"><span>Возраст / цикл</span><b>${p.age} лет · ${p.cycle}-й, ${p.cycleStart}–${p.cycleEnd}</b></div>
      </div>
    </div>
    <div class="page right">
      <div class="holder"><small>Паспорт Души</small>${esc(p.full)}</div>
      <p class="essay" style="margin-top:12px">Числа ниже посчитаны формулами Паспорта Души. Тексты сфер — авторские описания этих чисел. Печать-рисунок к расчёту не относится.</p>
      <div class="big-nums">${cards}</div>
      <div class="meta-list">${rows}</div>
    </div>
  </div>`;
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
  const data = entryFor(CONTENT && CONTENT.bodies[s.id], num);
  const body = data
    ? `<div class="lenses">${lens("m", "Проявленность", data.manifestation)}${lens("r", "Риски", data.risks)}${lens("p", "Рекомендации", data.recommendations)}</div>`
    : `<div class="lenses"><p class="essay">Текст сферы не загрузился.</p></div>`;
  const veil = open ? "" : `<div class="veil"><div class="veil-in"><p>Полный текст этой сферы</p><button class="btn sm" type="button" data-act="buy">Открыть полный доступ</button></div></div>`;
  return `<article class="sphere${open ? " open" : " locked"}" style="--sc:${s.color}" data-sph="${index}">
    <button class="sph-top" type="button" data-act="toggle" aria-expanded="${open ? "true" : "false"}">
      <span class="sph-n">${pad(index + 1)}</span>
      <span class="sph-t"><b>${esc(s.title)}</b><span>${esc(s.sub)} · ${num} ${esc(planetName(num))}</span></span>
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
        <p class="lead" style="margin-top:8px">Радиус на карте — сама вибрация от 1 до 9. Мастер-числа 11, 22 и 33 на карте стоят на внешнем кольце и подписаны своим числом в карточке. В базовой версии открыты жизненная и социальная задачи.</p>
      </div>
      ${radarSVG()}
    </div>
    <div class="sph-list">${SPHERES.map(sphereCard).join("")}</div>`;
}

function cyclesHTML() {
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

function keysHTML() {
  return `<div class="pad">
    <h3>Ключ совместимости</h3>
    <p class="lead" style="margin:8px 0 16px">Два паспорта сопоставляются теми же формулами. Общий вектор жизненных задач — свёртка двух жизненных чисел. Общий социальный вектор — свёртка двух социальных чисел. Отдельной «парной планеты» в методике нет.</p>
    <div class="reso">
      <form class="reso-form" id="keyForm">
        <div class="field"><label for="kLast">Фамилия</label><input id="kLast" type="text" autocomplete="off"></div>
        <div class="field"><label for="kFirst">Имя</label><input id="kFirst" type="text" autocomplete="off"></div>
        <div class="field"><label for="kMiddle">Отчество, если есть</label><input id="kMiddle" type="text" autocomplete="off"></div>
        <div class="dob">
          <select id="kDay" aria-label="День"></select>
          <select id="kMonth" aria-label="Месяц"></select>
          <select id="kYear" aria-label="Год"></select>
        </div>
        <button class="btn sm" type="submit">Сопоставить</button>
      </form>
      <div class="reso-out" id="keyOut"><p>Здесь появятся два числа и их сумма.</p></div>
    </div>
  </div>`;
}

function renderPassport() {
  if (state.profile) V = compute(state.profile);
  else V = null;
  if (V && V.error) V = null;
  renderBanner();
  const cover = $("#p-cover");
  const spheres = $("#p-spheres");
  const cycles = $("#p-cycles");
  const matrix = $("#p-matrix");
  const keys = $("#p-keys");
  if (!V) {
    const empty = `<div class="pad"><p class="lead">Подайте прошение — документ соберётся из фамилии, имени, отчества и даты.</p></div>`;
    cover.innerHTML = empty;
    spheres.innerHTML = "";
    cycles.innerHTML = "";
    matrix.innerHTML = "";
    keys.innerHTML = "";
    return;
  }
  cover.innerHTML = coverHTML();
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
    ["Σ фамилии", p.parts[0].sum],
    ["Σ имени", p.parts[1].sum],
    ["Σ отчества", p.parts[2].sum],
    ["Жизненная", `${n.life} · ${planetName(n.life)}`],
    ["Астральное", `${n.astral} · ${planetName(n.astral)}`],
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
  return `<p class="lead">Полный документ в боте открывается после перевода ${PRICE}. На этой странице перевод не проверяется: кнопка ниже только показывает остальные тексты в вашем браузере.</p>
  <div class="meta-list" style="margin:14px 0">
    <div class="meta"><span>Сумма</span><b>${PRICE}</b></div>
    <div class="meta"><span>Т-Банк</span><b>2200 7008 8290 3809</b></div>
    <div class="meta"><span>СБП</span><b>89990238238</b></div>
    <div class="meta"><span>Получатель</span><b>Кристина Г.</b></div>
  </div>
  <div class="form-actions">
    <a class="btn solid sm" href="${BOT_URL}" target="_blank" rel="noopener">Открыть бота</a>
    <button class="btn sm" type="button" id="unlockBtn">Показать полный текст здесь</button>
  </div>`;
}

function showBuy() {
  $("#coBody").innerHTML = checkoutHTML();
  openModal("checkout");
  $("#unlockBtn").addEventListener("click", () => {
    state.paid = true;
    save();
    closeModal("checkout");
    renderPassport();
    updateStatus();
    setTab("spheres");
    toast("Полный текст открыт в этом браузере", "ok");
  });
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
      setTab("cover");
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
  function resize() {
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    w = window.innerWidth;
    h = window.innerHeight;
    c.width = Math.floor(w * dpr);
    c.height = Math.floor(h * dpr);
    c.style.width = w + "px";
    c.style.height = h + "px";
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(260, Math.max(80, (w * h) / 9000)));
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.3 + 0.3,
      p: Math.random() * TAU,
    }));
  }
  resize();
  window.addEventListener("resize", resize, { passive: true });
  function frame(t) {
    x.clearRect(0, 0, w, h);
    stars.forEach((s) => {
      const a = 0.25 + Math.abs(Math.sin(s.p + t / 900)) * 0.6;
      x.globalAlpha = a;
      x.fillStyle = "#c9d4f5";
      x.beginPath();
      x.arc(s.x, s.y, s.r, 0, TAU);
      x.fill();
    });
    x.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
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
    const act = e.target.closest("[data-act]");
    if (!act) return;
    if (act.dataset.act === "buy") showBuy();
    if (act.dataset.act === "toggle") {
      const card = act.closest(".sphere");
      if (!card || card.classList.contains("locked")) return;
      const opened = card.classList.toggle("open");
      act.setAttribute("aria-expanded", opened ? "true" : "false");
    }
    const tab = e.target.closest(".tab");
    if (tab) setTab(tab.dataset.tab);
    const qa = e.target.closest(".qa > button");
    if (qa) qa.parentElement.classList.toggle("open");
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
    const life = reduceNumber(V.nums.life + other.nums.life);
    const social = reduceNumber(V.nums.social + other.nums.social);
    out.innerHTML = `<p><b>${esc(V.full)}</b><br>жизненная ${V.nums.life} · ${esc(planetName(V.nums.life))}<br>социальная ${V.nums.social} · ${esc(planetName(V.nums.social))}</p>
      <p style="margin-top:10px"><b>${esc(other.full)}</b><br>жизненная ${other.nums.life} · ${esc(planetName(other.nums.life))}<br>социальная ${other.nums.social} · ${esc(planetName(other.nums.social))}</p>
      <p style="margin-top:10px">Общий вектор жизненных задач: <b>${life} · ${esc(planetName(life))}</b><br>Общий социальный вектор: <b>${social} · ${esc(planetName(social))}</b></p>`;
  });
  $("#newBtn").addEventListener("click", () => openModal("confirm"));
  $("#cfYes").addEventListener("click", () => {
    state.profile = null;
    state.paid = false;
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
    window.open(BOT_URL, "_blank", "noopener");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeModal("checkout"); closeModal("confirm"); }
  });
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
  try {
    const res = await fetch("content.json");
    CONTENT = await res.json();
  } catch (e) {
    toast("Тексты сфер не загрузились. Числа всё равно считаются.", "err");
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
  sky();
  clock();
  solstice();
  setInterval(solstice, 1000);
  renderWaitlist();
  liveReadout();
  renderPassport();
  updateStatus();
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
