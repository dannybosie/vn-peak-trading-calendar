#!/usr/bin/env node

// src/cli.ts
import { parseArgs } from "node:util";

// src/core/events.ts
var MEGA = [
  [1, "monthly", "New Year double-day sale. Smaller than the Q4 peaks, and budgets are often still resetting."],
  [2, "monthly", "Falls close to T\u1EBFt in most years, so delivery cut-offs matter more than the discount."],
  [3, "monthly", "Opens the Women's Day week (8/3). Lazada runs its birthday sale in late March."],
  [4, "monthly", "Quiet month between Gi\u1ED7 T\u1ED5 and the 30/4 to 1/5 long weekend."],
  [5, "monthly", "Lands right after the 30/4 to 1/5 break."],
  [6, "major", "Opens the mid-year sale season on the marketplaces."],
  [7, "major", "Mid-year sale peak."],
  [8, "monthly", "Runs into the Vu Lan and back-to-school period."],
  [9, "major", "Start of the Q4 run. Shopee brands it Super Shopping Day."],
  [10, "major", "The Q4 build continues, ten days before Vietnamese Women's Day (20/10)."],
  [11, "tentpole", "Singles' Day. The largest sale day of the year on Shopee, Lazada and TikTok Shop."],
  [12, "tentpole", "The year-end peak. Shopee runs it as its birthday sale."]
];
var EVENTS = [
  ...MEGA.map(([m, tier, note]) => ({
    id: `mega-${m}-${m}`,
    name: `${m}.${m} Mega Sale`,
    type: "mega-sale",
    tier,
    rule: { kind: "fixed", month: m, day: m },
    preheatDays: tier === "tentpole" ? 21 : tier === "major" ? 14 : 5,
    note
  })),
  {
    id: "mid-month",
    name: "Mid-month sale",
    nameVi: "Sale gi\u1EEFa th\xE1ng",
    type: "mid-month",
    tier: "minor",
    rule: { kind: "monthly", day: 15 },
    duration: 1,
    note: "Monthly mid-month campaign on the marketplaces. Exact windows vary by platform, around the 13th to the 17th."
  },
  {
    id: "payday",
    name: "Payday sale window",
    nameVi: "Sale ng\xE0y l\u01B0\u01A1ng",
    type: "payday",
    tier: "minor",
    rule: { kind: "monthly", day: 25 },
    duration: "month-end",
    note: "Payday campaigns from around the 25th to the end of the month, when salaries land. Exact windows vary by platform."
  },
  {
    id: "black-friday",
    name: "Black Friday",
    type: "global-sale",
    tier: "major",
    rule: { kind: "nth-weekday", month: 11, weekday: 4, n: 4, plusDays: 1 },
    preheatDays: 14,
    note: "Imported sale moment, strongest for cross-border, electronics and international brands. Two weeks after 11.11, so plan the stock for both."
  },
  {
    id: "cyber-monday",
    name: "Cyber Monday",
    type: "global-sale",
    tier: "minor",
    rule: { kind: "nth-weekday", month: 11, weekday: 4, n: 4, plusDays: 4 },
    note: "Tail of the Black Friday weekend."
  },
  // Statutory holidays (Labor Code 2019, Article 112, and Resolution 28/2026/QH16 for 24/11).
  {
    id: "new-year",
    name: "New Year's Day",
    nameVi: "T\u1EBFt D\u01B0\u01A1ng l\u1ECBch",
    type: "holiday",
    tier: "minor",
    rule: { kind: "fixed", month: 1, day: 1 },
    official: true,
    note: "Paid day off."
  },
  {
    id: "tet",
    name: "Lunar New Year (T\u1EBFt)",
    nameVi: "T\u1EBFt Nguy\xEAn \u0110\xE1n",
    type: "holiday",
    tier: "tentpole",
    rule: { kind: "lunar", month: 1, day: 1 },
    duration: 3,
    official: true,
    preheatDays: 60,
    note: "Five paid days off, placed around T\u1EBFt by the Prime Minister each year. Couriers slow down and stop in the last days of the old year, and many sellers pause. Demand peaks in the three weeks before.",
    observed: {
      2026: "Public sector off 14 to 22 February 2026 (B\u1ED9 N\u1ED9i v\u1EE5 notice 9441/TB-BNV). Private employers give five days around T\u1EBFt."
    }
  },
  {
    id: "gio-to",
    name: "Hung Kings Commemoration Day",
    nameVi: "Gi\u1ED7 T\u1ED5 H\xF9ng V\u01B0\u01A1ng",
    type: "holiday",
    tier: "minor",
    rule: { kind: "lunar", month: 3, day: 10 },
    official: true,
    note: "Paid day off. When it falls on a weekend, the next working day is off.",
    observed: { 2026: "Falls on Sunday 26 April 2026, so Monday 27 April is off." }
  },
  {
    id: "reunification",
    name: "Reunification Day",
    nameVi: "Ng\xE0y Gi\u1EA3i ph\xF3ng mi\u1EC1n Nam, th\u1ED1ng nh\u1EA5t \u0111\u1EA5t n\u01B0\u1EDBc",
    type: "holiday",
    tier: "major",
    rule: { kind: "fixed", month: 4, day: 30 },
    official: true,
    preheatDays: 14,
    note: "Paid day off, and with 1/5 it makes the first long weekend of the year. Travel and outdoor demand peaks; urban delivery slows.",
    observed: { 2026: "Off Thursday 30 April to Sunday 3 May 2026." }
  },
  {
    id: "labour-day",
    name: "International Labour Day",
    nameVi: "Ng\xE0y Qu\u1ED1c t\u1EBF Lao \u0111\u1ED9ng",
    type: "holiday",
    tier: "minor",
    rule: { kind: "fixed", month: 5, day: 1 },
    official: true,
    note: "Paid day off, joined to 30/4."
  },
  {
    id: "national-day",
    name: "National Day",
    nameVi: "Qu\u1ED1c kh\xE1nh",
    type: "holiday",
    tier: "major",
    rule: { kind: "fixed", month: 9, day: 2 },
    official: true,
    preheatDays: 14,
    note: "Two paid days off: 2/9 and one day before or after, set by the Prime Minister each year.",
    observed: { 2026: "Public sector off Saturday 29 August to Wednesday 2 September 2026. Private employers give 2/9 plus 1/9 or 3/9." }
  },
  {
    id: "culture-day",
    name: "Vietnamese Culture Day",
    nameVi: "Ng\xE0y V\u0103n h\xF3a Vi\u1EC7t Nam",
    type: "holiday",
    tier: "minor",
    rule: { kind: "fixed", month: 11, day: 24 },
    official: true,
    since: 2026,
    note: "New paid day off from 2026 under Resolution 28/2026/QH16. It falls between 11.11 and 12.12, so it is a fresh long-weekend slot in the Q4 plan."
  },
  // Cultural and gifting dates.
  {
    id: "ong-tao",
    name: "Kitchen Gods' Day",
    nameVi: "\xD4ng C\xF4ng \xD4ng T\xE1o",
    type: "cultural",
    tier: "major",
    rule: { kind: "lunar", month: 12, day: 23, yearOffset: -1 },
    note: "23rd of the last lunar month, one week before T\u1EBFt. Traditionally the last big shopping push before the holiday."
  },
  {
    id: "valentine",
    name: "Valentine's Day",
    type: "cultural",
    tier: "major",
    rule: { kind: "fixed", month: 2, day: 14 },
    preheatDays: 14,
    note: "Gifting peak for flowers, chocolate, jewellery and fashion. Sometimes collides with T\u1EBFt, which moves the demand earlier."
  },
  {
    id: "than-tai",
    name: "God of Wealth Day",
    nameVi: "V\xEDa Th\u1EA7n T\xE0i",
    type: "cultural",
    tier: "major",
    rule: { kind: "lunar", month: 1, day: 10 },
    preheatDays: 7,
    note: "Tenth day of the first lunar month. The biggest day of the year for gold, and a lift for jewellery and anything sold as lucky."
  },
  {
    id: "ram-thang-gieng",
    name: "First Full Moon",
    nameVi: "R\u1EB1m th\xE1ng Gi\xEAng",
    type: "cultural",
    tier: "minor",
    rule: { kind: "lunar", month: 1, day: 15 },
    note: "First full moon of the lunar year. Offerings and flowers; the traditional end of the T\u1EBFt season."
  },
  {
    id: "womens-day",
    name: "International Women's Day",
    nameVi: "Qu\u1ED1c t\u1EBF Ph\u1EE5 n\u1EEF",
    type: "cultural",
    tier: "major",
    rule: { kind: "fixed", month: 3, day: 8 },
    preheatDays: 14,
    note: "One of the three gifting peaks for women in Vietnam, with 20/10 and Vu Lan. Beauty, flowers, fashion."
  },
  {
    id: "childrens-day",
    name: "Children's Day",
    nameVi: "Qu\u1ED1c t\u1EBF Thi\u1EBFu nhi",
    type: "cultural",
    tier: "major",
    rule: { kind: "fixed", month: 6, day: 1 },
    preheatDays: 14,
    note: "Toys, kids' fashion and family outings. Also the start of the summer holidays."
  },
  {
    id: "doan-ngo",
    name: "Double Fifth Festival",
    nameVi: "T\u1EBFt \u0110oan Ng\u1ECD",
    type: "cultural",
    tier: "minor",
    rule: { kind: "lunar", month: 5, day: 5 },
    note: "Fifth day of the fifth lunar month. Seasonal food and offerings."
  },
  {
    id: "vu-lan",
    name: "Vu Lan (Parents' Day)",
    nameVi: "L\u1EC5 Vu Lan",
    type: "cultural",
    tier: "major",
    rule: { kind: "lunar", month: 7, day: 15 },
    preheatDays: 14,
    note: "Full moon of the seventh lunar month, a day for honouring parents. Gifting for mothers; vegetarian food demand rises across the month."
  },
  {
    id: "mid-autumn",
    name: "Mid-Autumn Festival",
    nameVi: "T\u1EBFt Trung Thu",
    type: "cultural",
    tier: "tentpole",
    rule: { kind: "lunar", month: 8, day: 15 },
    preheatDays: 30,
    note: "Mooncake and corporate gifting season runs for about a month before the full moon; B2B orders close earliest. Toys and lanterns for children."
  },
  {
    id: "vn-womens-day",
    name: "Vietnamese Women's Day",
    nameVi: "Ng\xE0y Ph\u1EE5 n\u1EEF Vi\u1EC7t Nam",
    type: "cultural",
    tier: "major",
    rule: { kind: "fixed", month: 10, day: 20 },
    preheatDays: 14,
    note: "Gifting peak for women. Ten days after 10.10, so one campaign can carry both."
  },
  {
    id: "teachers-day",
    name: "Teachers' Day",
    nameVi: "Ng\xE0y Nh\xE0 gi\xE1o Vi\u1EC7t Nam",
    type: "cultural",
    tier: "major",
    rule: { kind: "fixed", month: 11, day: 20 },
    preheatDays: 10,
    note: "Gifts for teachers from students and parents. Flowers, stationery, beauty and gift sets."
  },
  {
    id: "christmas",
    name: "Christmas",
    nameVi: "Gi\xE1ng sinh",
    type: "cultural",
    tier: "major",
    rule: { kind: "fixed", month: 12, day: 25 },
    preheatDays: 21,
    note: "Decorations, gifting and year-end parties in the cities. Lands two weeks after 12.12."
  }
];
var TYPE_LABELS = {
  "mega-sale": "Mega sale",
  "mid-month": "Mid-month sale",
  payday: "Payday",
  "global-sale": "Global sale",
  holiday: "Holiday",
  cultural: "Culture and gifting"
};

// src/core/lunar.ts
var VN_TIMEZONE = 7;
var RAD = Math.PI / 180;
var sin = (deg) => Math.sin(deg * RAD);
function jdFromDate(dd, mm, yy) {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  return jd;
}
function jdToDate(jd) {
  let a, b, c;
  if (jd > 2299160) {
    a = jd + 32044;
    b = Math.floor((4 * a + 3) / 146097);
    c = a - Math.floor(b * 146097 / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor(1461 * d / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return {
    d: e - Math.floor((153 * m + 2) / 5) + 1,
    m: m + 3 - 12 * Math.floor(m / 10),
    y: b * 100 + d - 4800 + Math.floor(m / 10)
  };
}
function deltaT(year) {
  if (year < 1986) {
    const t2 = year - 1975;
    return 45.45 + 1.067 * t2 - t2 * t2 / 260 - t2 * t2 * t2 / 718;
  }
  if (year < 2005) {
    const t2 = year - 2e3;
    return 63.86 + 0.3345 * t2 - 0.060374 * t2 ** 2 + 17275e-7 * t2 ** 3 + 651814e-9 * t2 ** 4 + 2373599e-11 * t2 ** 5;
  }
  const t = year - 2e3;
  return 62.92 + 0.32217 * t + 5589e-6 * t * t;
}
function newMoonJDE(k) {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;
  let jde = 245155009766e-5 + 29.530588861 * k + 15437e-8 * T2 - 15e-8 * T3 + 73e-11 * T4;
  const E = 1 - 2516e-6 * T - 74e-7 * T2;
  const M = 2.5534 + 29.1053567 * k - 14e-7 * T2 - 11e-8 * T3;
  const Mp = 201.5643 + 385.81693528 * k + 0.0107582 * T2 + 1238e-8 * T3 - 58e-9 * T4;
  const F = 160.7108 + 390.67050284 * k - 16118e-7 * T2 - 227e-8 * T3 + 11e-9 * T4;
  const Om = 124.7746 - 1.56375588 * k + 20672e-7 * T2 + 215e-8 * T3;
  jde += -0.4072 * sin(Mp) + 0.17241 * E * sin(M) + 0.01608 * sin(2 * Mp) + 0.01039 * sin(2 * F) + 739e-5 * E * sin(Mp - M) - 514e-5 * E * sin(Mp + M) + 208e-5 * E * E * sin(2 * M) - 111e-5 * sin(Mp - 2 * F) - 57e-5 * sin(Mp + 2 * F) + 56e-5 * E * sin(2 * Mp + M) - 42e-5 * sin(3 * Mp) + 42e-5 * E * sin(M + 2 * F) + 38e-5 * E * sin(M - 2 * F) - 24e-5 * E * sin(2 * Mp - M) - 17e-5 * sin(Om) - 7e-5 * sin(Mp + 2 * M) + 4e-5 * sin(2 * Mp - 2 * F) + 4e-5 * sin(3 * M) + 3e-5 * sin(Mp + M - 2 * F) + 3e-5 * sin(2 * Mp + 2 * F) - 3e-5 * sin(Mp + M + 2 * F) + 3e-5 * sin(Mp - M + 2 * F) - 2e-5 * sin(Mp - M - 2 * F) - 2e-5 * sin(3 * Mp + M) + 2e-5 * sin(4 * Mp);
  const A = [
    [299.77 + 0.107408 * k - 9173e-6 * T2, 325e-6],
    [251.88 + 0.016321 * k, 165e-6],
    [251.83 + 26.651886 * k, 164e-6],
    [349.42 + 36.412478 * k, 126e-6],
    [84.66 + 18.206239 * k, 11e-5],
    [141.74 + 53.303771 * k, 62e-6],
    [207.14 + 2.453732 * k, 6e-5],
    [154.84 + 7.30686 * k, 56e-6],
    [34.52 + 27.261239 * k, 47e-6],
    [207.19 + 0.121824 * k, 42e-6],
    [291.34 + 1.844379 * k, 4e-5],
    [161.72 + 24.198154 * k, 37e-6],
    [239.56 + 25.513099 * k, 35e-6],
    [331.55 + 3.592518 * k, 23e-6]
  ];
  for (const [arg, coef] of A) jde += coef * sin(arg);
  return jde;
}
var K_OFFSET = 1237;
var EPOCH_1900 = 2415021076998695e-9;
var SYNODIC = 29.530588853;
function newMoonDay(k, tz = VN_TIMEZONE) {
  const jde = newMoonJDE(k - K_OFFSET);
  const year = 2e3 + (k - K_OFFSET) / 12.3685;
  const jdUT = jde - deltaT(year) / 86400;
  return Math.floor(jdUT + 0.5 + tz / 24);
}
function sunLongitude(jd) {
  const T = (jd - 2451545) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 3032e-7 * T * T;
  const M = 357.52911 + 35999.05029 * T - 1537e-7 * T * T;
  const C = (1.914602 - 4817e-6 * T - 14e-6 * T * T) * sin(M) + (0.019993 - 101e-6 * T) * sin(2 * M) + 289e-6 * sin(3 * M);
  const omega = 125.04 - 1934.136 * T;
  const lambda = L0 + C - 569e-5 - 478e-5 * sin(omega);
  return (lambda % 360 + 360) % 360;
}
function sunSector(jdn, tz = VN_TIMEZONE) {
  return Math.floor(sunLongitude(jdn - 0.5 - tz / 24) / 30);
}
function lunarMonth11(yy, tz = VN_TIMEZONE) {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = Math.floor(off / SYNODIC);
  let nm = newMoonDay(k, tz);
  if (sunSector(nm, tz) >= 9) nm = newMoonDay(k - 1, tz);
  return nm;
}
function leapMonthOffset(a11, tz = VN_TIMEZONE) {
  const k = Math.floor((a11 - EPOCH_1900) / SYNODIC + 0.5);
  let i = 1;
  let arc = sunSector(newMoonDay(k + i, tz), tz);
  let last;
  do {
    last = arc;
    i++;
    arc = sunSector(newMoonDay(k + i, tz), tz);
  } while (arc !== last && i < 14);
  return i - 1;
}
function solarToLunar(yy, mm, dd, tz = VN_TIMEZONE) {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = Math.floor((dayNumber - EPOCH_1900) / SYNODIC);
  let monthStart = newMoonDay(k + 1, tz);
  if (monthStart > dayNumber) monthStart = newMoonDay(k, tz);
  let a11 = lunarMonth11(yy, tz);
  let b11 = a11;
  let lunarYear;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = lunarMonth11(yy - 1, tz);
  } else {
    lunarYear = yy + 1;
    b11 = lunarMonth11(yy + 1, tz);
  }
  const day = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - a11) / 29);
  let leap = false;
  let month = diff + 11;
  if (b11 - a11 > 365) {
    const leapDiff = leapMonthOffset(a11, tz);
    if (diff >= leapDiff) {
      month = diff + 10;
      if (diff === leapDiff) leap = true;
    }
  }
  if (month > 12) month -= 12;
  if (month >= 11 && diff < 4) lunarYear -= 1;
  return { day, month, year: lunarYear, leap };
}
function lunarToSolar(day, month, year, leap = false, tz = VN_TIMEZONE) {
  let a11, b11;
  if (month < 11) {
    a11 = lunarMonth11(year - 1, tz);
    b11 = lunarMonth11(year, tz);
  } else {
    a11 = lunarMonth11(year, tz);
    b11 = lunarMonth11(year + 1, tz);
  }
  const k = Math.floor(0.5 + (a11 - EPOCH_1900) / SYNODIC);
  let off = month - 11;
  if (off < 0) off += 12;
  if (b11 - a11 > 365) {
    const leapOff = leapMonthOffset(a11, tz);
    let leapMonth = leapOff - 2;
    if (leapMonth < 0) leapMonth += 12;
    if (leap && month !== leapMonth) return null;
    if (leap || off >= leapOff) off += 1;
  } else if (leap) {
    return null;
  }
  const monthStart = newMoonDay(k + off, tz);
  return jdToDate(monthStart + day - 1);
}

// src/core/calendar.ts
var pad = (n) => String(n).padStart(2, "0");
var isoDate = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
function addDays(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return isoDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}
function daysBetween(fromIso, toIso) {
  const [a, b] = [fromIso, toIso].map((s) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  });
  return Math.round((b - a) / 864e5);
}
function lastDayOfMonth(y, m) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
function nthWeekday(y, m, weekday, n, plusDays) {
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const day = 1 + (weekday - first + 7) % 7 + (n - 1) * 7;
  return addDays(isoDate(y, m, day), plusDays);
}
function occurrence(def, year, start, suffix = "") {
  let end = start;
  if (def.duration === "month-end") {
    const [y, m] = start.split("-").map(Number);
    end = isoDate(y, m, lastDayOfMonth(y, m));
  } else if (def.duration && def.duration > 1) {
    end = addDays(start, def.duration - 1);
  }
  const prep = def.preheatDays && (def.tier === "tentpole" || def.tier === "major") ? addDays(start, -def.preheatDays) : void 0;
  const lunar = def.rule.kind === "lunar" ? `${def.rule.day}/${def.rule.month} lunar` : void 0;
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
    observed: def.observed?.[year]
  };
}
var TIER_ORDER = { tentpole: 0, major: 1, monthly: 2, minor: 3 };
function eventsForYear(year, defs = EVENTS) {
  const out = [];
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
function eventsForYears(from, to, defs = EVENTS) {
  const out = [];
  for (let y = from; y <= to; y++) out.push(...eventsForYear(y, defs));
  return out;
}
function upcoming(today2, events) {
  return events.filter((e) => e.end >= today2).sort((a, b) => a.start.localeCompare(b.start));
}
function title(e) {
  const base = e.nameVi && e.nameVi !== e.name ? `${e.name} \xB7 ${e.nameVi}` : e.name;
  return e.official ? `Day off: ${base}` : base;
}
function describe(e) {
  const lines = [e.note];
  if (e.observed) lines.push(`Official schedule: ${e.observed}`);
  if (e.lunar) lines.push(`Lunar date: ${e.lunar}, Vietnamese calendar (UTC+7).`);
  if (e.prepStart) lines.push(`Prep window opens ${e.prepStart}.`);
  lines.push(`Type: ${TYPE_LABELS[e.type]}. Weight: ${e.tier}.`);
  return lines.join("\n");
}

// src/core/ics.ts
var SITE = "https://dannybosie.github.io/vn-peak-trading-calendar/";
var escapeText = (s) => s.replace(/\\/g, "\\\\").replace(/;/g, ";").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
function fold(line) {
  const enc = new TextEncoder();
  const parts = [];
  let current = "";
  let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    const limit = parts.length === 0 ? 75 : 74;
    if (bytes + n > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
    }
    current += ch;
    bytes += n;
  }
  parts.push(current);
  return parts.join("\r\n ");
}
var compact = (iso) => iso.replace(/-/g, "");
function vevent(e, stamp, prep = false) {
  if (prep && e.prepStart) {
    const days = daysBetween(e.prepStart, e.start);
    return [
      "BEGIN:VEVENT",
      `UID:prep-${e.uid}@vn-peak-trading-calendar`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(e.prepStart)}`,
      `DTEND;VALUE=DATE:${compact(addDays(e.prepStart, 1))}`,
      `SUMMARY:${escapeText(`Prep: ${e.name} in ${days} days (${e.start})`)}`,
      `DESCRIPTION:${escapeText(`Campaign prep window opens for ${e.name} (${e.start}).

${describe(e)}`)}`,
      "CATEGORIES:Prep",
      "TRANSP:TRANSPARENT",
      `URL:${SITE}`,
      "END:VEVENT"
    ];
  }
  return [
    "BEGIN:VEVENT",
    `UID:${e.uid}@vn-peak-trading-calendar`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compact(e.start)}`,
    `DTEND;VALUE=DATE:${compact(addDays(e.end, 1))}`,
    `SUMMARY:${escapeText(title(e))}`,
    `DESCRIPTION:${escapeText(describe(e))}`,
    `CATEGORIES:${escapeText(TYPE_LABELS[e.type])}`,
    "TRANSP:TRANSPARENT",
    `URL:${SITE}`,
    "END:VEVENT"
  ];
}
function toIcs(events, opts, mode = "events") {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//dannybosie//vn-peak-trading-calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(opts.name)}`,
    `X-WR-CALDESC:${escapeText(opts.description)}`,
    "X-WR-TIMEZONE:Asia/Ho_Chi_Minh",
    "REFRESH-INTERVAL;VALUE=DURATION:P1D",
    "X-PUBLISHED-TTL:P1D"
  ];
  for (const e of events) {
    if (mode === "prep" && !e.prepStart) continue;
    lines.push(...vevent(e, opts.stamp, mode === "prep"));
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(fold).join("\r\n")}\r
`;
}

// src/core/feeds.ts
var FEEDS = [
  { slug: "all", name: "VN Peak Trading Calendar", description: "Every Vietnam e-commerce sale day, holiday and gifting date.", types: "all", mode: "events" },
  { slug: "sales", name: "VN Peak Trading: Sales", description: "Marketplace double days, mid-month and payday sales, Black Friday.", types: ["mega-sale", "mid-month", "payday", "global-sale"], mode: "events" },
  { slug: "holidays", name: "VN Peak Trading: Holidays", description: "Statutory paid days off in Vietnam, with official schedules where announced.", types: ["holiday"], mode: "events" },
  { slug: "culture", name: "VN Peak Trading: Culture and gifting", description: "Lunar festivals and gifting peaks: Mid-Autumn, Vu Lan, 20/10, 20/11 and more.", types: ["cultural"], mode: "events" },
  { slug: "prep", name: "VN Peak Trading: Prep reminders", description: "A reminder on the day each tentpole's campaign prep should start.", types: "all", mode: "prep" }
];
function feedEvents(feed, events) {
  return feed.types === "all" ? events : events.filter((e) => feed.types.includes(e.type));
}

// src/cli.ts
var VERSION = "1.0.0";
var HELP = `vn-peak ${VERSION}
A campaign planning calendar for Vietnam e-commerce: sale days, holidays and
gifting dates, with lunar dates computed for the Vietnamese calendar.

Usage
  vn-peak next [--count 10] [--type mega-sale,holiday]    What is coming up
  vn-peak list [--year 2027] [--type cultural]            A whole year
  vn-peak ics [--from 2026 --to 2028] [--feed all]        Print an .ics feed
  vn-peak lunar 2026-08-27                                Solar to lunar
  vn-peak solar 15/7/2026 [--leap]                        Lunar to solar

Types: ${Object.keys(TYPE_LABELS).join(", ")}
Feeds: ${FEEDS.map((f) => f.slug).join(", ")}`;
var today = () => {
  const t = new Date(Date.now() + 7 * 3600 * 1e3);
  return isoDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
};
function row(e, from) {
  const when = e.start === e.end ? e.start : `${e.start} to ${e.end.slice(5)}`;
  const inDays = from ? daysBetween(from, e.start) : null;
  const rel = inDays === null ? "" : inDays <= 0 ? "now" : `in ${inDays}d`;
  const prep = e.prepStart && from && e.prepStart <= from && e.start > from ? "  [prep window open]" : "";
  return `${when.padEnd(22)} ${rel.padEnd(8)} ${TYPE_LABELS[e.type].padEnd(20)} ${title(e)}${prep}`;
}
function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      count: { type: "string", default: "10" },
      type: { type: "string" },
      year: { type: "string" },
      from: { type: "string" },
      to: { type: "string" },
      feed: { type: "string", default: "all" },
      leap: { type: "boolean", default: false },
      json: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
      version: { type: "boolean", short: "v", default: false }
    }
  });
  const [command, arg] = positionals;
  if (values.version) return console.log(VERSION), 0;
  if (values.help || !command) return console.log(HELP), values.help ? 0 : 2;
  const types = values.type?.split(",").map((s) => s.trim());
  const filter = (list) => types ? list.filter((e) => types.includes(e.type)) : list;
  const now = today();
  const year = Number(now.slice(0, 4));
  if (command === "next") {
    const list = filter(upcoming(now, eventsForYears(year, year + 1))).slice(0, Number(values.count));
    if (values.json) return console.log(JSON.stringify(list, null, 2)), 0;
    for (const e of list) console.log(row(e, now));
    return 0;
  }
  if (command === "list") {
    const y = Number(values.year ?? year);
    const list = filter(eventsForYears(y, y));
    if (values.json) return console.log(JSON.stringify(list, null, 2)), 0;
    for (const e of list) console.log(row(e));
    return 0;
  }
  if (command === "ics") {
    const feed = FEEDS.find((f) => f.slug === values.feed);
    if (!feed) throw new Error(`Unknown feed ${values.feed}. One of: ${FEEDS.map((f) => f.slug).join(", ")}`);
    const from = Number(values.from ?? year - 1);
    const to = Number(values.to ?? year + 2);
    const stamp = `${now.replace(/-/g, "")}T000000Z`;
    process.stdout.write(toIcs(filter(feedEvents(feed, eventsForYears(from, to))), { name: feed.name, description: feed.description, stamp }, feed.mode));
    return 0;
  }
  if (command === "lunar") {
    const m = arg?.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!m) throw new Error("usage: vn-peak lunar YYYY-MM-DD");
    const l = solarToLunar(Number(m[1]), Number(m[2]), Number(m[3]));
    console.log(`${l.day}/${l.month}${l.leap ? " (leap month)" : ""}, lunar year ${l.year}`);
    return 0;
  }
  if (command === "solar") {
    const m = arg?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) throw new Error("usage: vn-peak solar D/M/YYYY [--leap]");
    const d = lunarToSolar(Number(m[1]), Number(m[2]), Number(m[3]), values.leap);
    if (!d) throw new Error(`Lunar year ${m[3]} has no leap month ${m[2]}.`);
    console.log(isoDate(d.y, d.m, d.d));
    return 0;
  }
  throw new Error(`Unknown command: ${command}. Run vn-peak --help.`);
}
try {
  process.exit(main());
} catch (err) {
  console.error(`vn-peak: ${err.message}`);
  process.exit(2);
}
