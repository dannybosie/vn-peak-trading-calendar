import { EVENTS, type EventDef, type EventType, TYPE_LABELS, type Tier } from "./events.ts";
import { lunarToSolar } from "./lunar.ts";

export interface Occurrence {
  uid: string;
  id: string;
  name: string;
  nameVi?: string;
  type: EventType;
  tier: Tier;
  official: boolean;
  /** First day, YYYY-MM-DD. */
  start: string;
  /** Last day, inclusive, YYYY-MM-DD. */
  end: string;
  /** Day campaign preparation should start, for tentpoles and majors. */
  prepStart?: string;
  /** "15/8 lunar" for dates on the lunar calendar. */
  lunar?: string;
  note: string;
  observed?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
export const isoDate = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return isoDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

export function daysBetween(fromIso: string, toIso: string): number {
  const [a, b] = [fromIso, toIso].map((s) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  });
  return Math.round((b - a) / 86400000);
}

function lastDayOfMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** The nth given weekday (0 = Sunday) of a month, shifted by plusDays. */
function nthWeekday(y: number, m: number, weekday: number, n: number, plusDays: number): string {
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const day = 1 + ((weekday - first + 7) % 7) + (n - 1) * 7;
  return addDays(isoDate(y, m, day), plusDays);
}

function occurrence(def: EventDef, year: number, start: string, suffix = ""): Occurrence {
  let end = start;
  if (def.duration === "month-end") {
    const [y, m] = start.split("-").map(Number);
    end = isoDate(y, m, lastDayOfMonth(y, m));
  } else if (def.duration && def.duration > 1) {
    end = addDays(start, def.duration - 1);
  }
  const prep = def.preheatDays && (def.tier === "tentpole" || def.tier === "major") ? addDays(start, -def.preheatDays) : undefined;
  const lunar = def.rule.kind === "lunar" ? `${def.rule.day}/${def.rule.month} lunar` : undefined;
  return {
    uid: `${def.id}-${year}${suffix}`,
    id: def.id,
    name: def.name,
    nameVi: def.nameVi,
    type: def.type,
    tier: def.tier,
    official: Boolean(def.official),
    start,
    end,
    prepStart: prep,
    lunar,
    note: def.note,
    observed: def.observed?.[year],
  };
}

const TIER_ORDER: Record<Tier, number> = { tentpole: 0, major: 1, monthly: 2, minor: 3 };

/** Every occurrence in a Gregorian year, sorted by date then weight. */
export function eventsForYear(year: number, defs: EventDef[] = EVENTS): Occurrence[] {
  const out: Occurrence[] = [];
  for (const def of defs) {
    if (def.since && year < def.since) continue;
    const r = def.rule;
    if (r.kind === "fixed") out.push(occurrence(def, year, isoDate(year, r.month, r.day)));
    else if (r.kind === "monthly") {
      for (let m = 1; m <= 12; m++) out.push(occurrence(def, year, isoDate(year, m, r.day), `-${pad(m)}`));
    } else if (r.kind === "nth-weekday") out.push(occurrence(def, year, nthWeekday(year, r.month, r.weekday, r.n, r.plusDays ?? 0)));
    else if (r.kind === "lunar") {
      const d = lunarToSolar(r.day, r.month, year + (r.yearOffset ?? 0));
      if (d && d.y === year) out.push(occurrence(def, year, isoDate(d.y, d.m, d.d)));
    }
  }
  return out.sort((a, b) => a.start.localeCompare(b.start) || TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);
}

export function eventsForYears(from: number, to: number, defs: EventDef[] = EVENTS): Occurrence[] {
  const out: Occurrence[] = [];
  for (let y = from; y <= to; y++) out.push(...eventsForYear(y, defs));
  return out;
}

/** Events that have not ended by `today`, soonest first. */
export function upcoming(today: string, events: Occurrence[]): Occurrence[] {
  return events.filter((e) => e.end >= today).sort((a, b) => a.start.localeCompare(b.start));
}

export function title(e: Occurrence): string {
  const base = e.nameVi && e.nameVi !== e.name ? `${e.name} · ${e.nameVi}` : e.name;
  return e.official ? `Day off: ${base}` : base;
}

export function describe(e: Occurrence): string {
  const lines = [e.note];
  if (e.observed) lines.push(`Official schedule: ${e.observed}`);
  if (e.lunar) lines.push(`Lunar date: ${e.lunar}, Vietnamese calendar (UTC+7).`);
  if (e.prepStart) lines.push(`Prep window opens ${e.prepStart}.`);
  lines.push(`Type: ${TYPE_LABELS[e.type]}. Weight: ${e.tier}.`);
  return lines.join("\n");
}
