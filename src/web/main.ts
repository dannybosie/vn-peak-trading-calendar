import { type Occurrence, daysBetween, eventsForYears, isoDate, title, upcoming } from "../core/calendar.ts";
import { type EventType, TYPE_LABELS } from "../core/events.ts";
import { FEEDS } from "../core/feeds.ts";

const BASE = "dannybosie.github.io/vn-peak-trading-calendar/feeds";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const TYPES = Object.keys(TYPE_LABELS) as EventType[];
const DEFAULT_OFF: EventType[] = ["mid-month", "payday"];
const TYPES_KEY = "vn-peak:types";

const $ = (id: string) => document.getElementById(id) as HTMLElement;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const dot = (t: EventType) => `<span class="dot" style="background: var(--t-${t})" title="${esc(TYPE_LABELS[t])}"></span>`;

// Today in Vietnam.
const nowVN = new Date(Date.now() + 7 * 3600 * 1000);
const today = isoDate(nowVN.getUTCFullYear(), nowVN.getUTCMonth() + 1, nowVN.getUTCDate());
const thisYear = nowVN.getUTCFullYear();
const all = eventsForYears(thisYear - 1, thisYear + 2);

const fmt = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
};

function renderHero(): void {
  const next = upcoming(today, all);
  const big = next.find((e) => e.tier === "tentpole" || e.tier === "major");
  if (big) {
    const days = daysBetween(today, big.start);
    const running = days <= 0;
    const prepOpen = big.prepStart && big.prepStart <= today && !running;
    $("next-big").innerHTML = `
      <div>
        <p class="eyebrow" style="margin-bottom: 10px;">Next weighted date · ${esc(TYPE_LABELS[big.type])}</p>
        <p class="next-name">${esc(title(big))}</p>
        <p class="muted" style="margin: 6px 0 0;">${fmt(big.start)}${big.lunar ? ` · ${esc(big.lunar)}` : ""}</p>
      </div>
      <div class="count">${running ? "Today" : days}${running ? "" : ` <small>day${days === 1 ? "" : "s"} to go</small>`}</div>
      <div>
        ${prepOpen ? `<span class="tag warn">Prep window open since ${fmt(big.prepStart!)}</span>` : big.prepStart && !running ? `<span class="tag info">Prep window opens ${fmt(big.prepStart)}</span>` : ""}
        <p style="margin: 10px 0 0; font-size: 14px;">${esc(big.note)}</p>
      </div>`;
  }
  $("soon").innerHTML = next
    .filter((e) => !DEFAULT_OFF.includes(e.type))
    .slice(0, 7)
    .map((e) => {
      const d = daysBetween(today, e.start);
      return `<li>${dot(e.type)}<span class="when">${d <= 0 ? "now" : `${d}d`}</span><span><b>${esc(e.name)}</b>${e.nameVi && e.nameVi !== e.name ? ` <span class="muted">${esc(e.nameVi)}</span>` : ""}<br><span class="muted">${fmt(e.start)}</span></span></li>`;
    })
    .join("");
}

function renderFeeds(): void {
  $("feeds").innerHTML = FEEDS.map((f) => {
    const webcal = `webcal://${BASE}/${f.slug}.ics`;
    const google = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`;
    return `<div class="panel feed">
      <div><h3>${esc(f.slug === "all" ? "Everything" : f.name.replace("VN Peak Trading: ", ""))}</h3>
      <p>${esc(f.description)}</p></div>
      <div class="row">
        <a class="btn primary" href="${google}" target="_blank" rel="noopener">Google Calendar</a>
        <a class="btn" href="${webcal}">Apple, Outlook</a>
        <a class="btn" href="feeds/${f.slug}.ics" download>.ics</a>
      </div>
    </div>`;
  }).join("");
}

let year = thisYear;
let active = new Set<EventType>(TYPES.filter((t) => !DEFAULT_OFF.includes(t)));
try {
  const saved = localStorage.getItem(TYPES_KEY);
  if (saved) active = new Set(JSON.parse(saved) as EventType[]);
} catch {
  // Storage unavailable. Defaults apply.
}

function renderPlanner(): void {
  $("years").innerHTML = [thisYear - 1, thisYear, thisYear + 1, thisYear + 2]
    .map((y) => `<button class="btn" type="button" data-year="${y}" aria-pressed="${y === year}">${y}</button>`)
    .join("");
  $("chips").innerHTML = TYPES.map(
    (t) => `<button class="chip" type="button" data-type="${t}" aria-pressed="${active.has(t)}">${dot(t)}${esc(TYPE_LABELS[t])}</button>`,
  ).join("");

  const events = all.filter((e) => e.start.startsWith(String(year)) && active.has(e.type));
  const byMonth: Occurrence[][] = MONTHS.map(() => []);
  for (const e of events) byMonth[Number(e.start.slice(5, 7)) - 1].push(e);
  $("months").innerHTML = byMonth
    .map((list, i) => {
      const items = list
        .map((e) => {
          const [, m, d] = e.start.split("-").map(Number);
          const span = e.end !== e.start ? `-${Number(e.end.slice(8))}` : "";
          const tip = `${e.note}${e.observed ? ` Official schedule: ${e.observed}` : ""}`;
          return `<li class="${e.tier}" title="${esc(tip)}"><span class="d">${d}/${m}${span}</span>${dot(e.type)}<span class="n">${esc(e.name)}${e.official ? '<span class="off">OFF</span>' : ""}${e.nameVi && e.nameVi !== e.name ? `<br><span class="muted" style="font-size:13px">${esc(e.nameVi)}</span>` : ""}</span></li>`;
        })
        .join("");
      return `<div class="panel month"><h3>${MONTHS[i]} ${year}</h3>${items ? `<ul>${items}</ul>` : '<p class="empty">Nothing in the selected types.</p>'}</div>`;
    })
    .join("");
}

$("years").addEventListener("click", (ev) => {
  const btn = (ev.target as HTMLElement).closest<HTMLButtonElement>("[data-year]");
  if (!btn) return;
  year = Number(btn.dataset.year);
  renderPlanner();
});
$("chips").addEventListener("click", (ev) => {
  const btn = (ev.target as HTMLElement).closest<HTMLButtonElement>("[data-type]");
  if (!btn) return;
  const t = btn.dataset.type as EventType;
  if (active.has(t)) active.delete(t);
  else active.add(t);
  try {
    localStorage.setItem(TYPES_KEY, JSON.stringify([...active]));
  } catch {
    // Storage unavailable.
  }
  renderPlanner();
});

renderHero();
renderFeeds();
renderPlanner();
