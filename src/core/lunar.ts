// Vietnamese lunisolar calendar (UTC+7).
//
// The calendar rules follow Hồ Ngọc Đức's well-known formulation: a month starts on
// the local day of the new moon, month 11 is the month that contains the winter
// solstice, and in a 13-month year the first month without a major solar term is
// the leap month.
//
// The astronomy is where this differs from most ports of that code. The usual
// truncated new-moon series can be off by tens of minutes, which moves a new moon
// across midnight a few times a decade. For example, it puts Vu Lan 2026 (15/7) on
// 26 August instead of 27 August. Here the new moon uses the full series from Jean
// Meeus, Astronomical Algorithms (2nd ed.), chapter 49, and the Sun uses chapter 25,
// with a Delta T correction from the Espenak and Meeus polynomials.

export const VN_TIMEZONE = 7;

const RAD = Math.PI / 180;
const sin = (deg: number) => Math.sin(deg * RAD);

/** Julian day number of a Gregorian (or, before 1582-10-15, Julian) date. */
export function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  return jd;
}

export function jdToDate(jd: number): { y: number; m: number; d: number } {
  let a: number, b: number, c: number;
  if (jd > 2299160) {
    a = jd + 32044;
    b = Math.floor((4 * a + 3) / 146097);
    c = a - Math.floor((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return {
    d: e - Math.floor((153 * m + 2) / 5) + 1,
    m: m + 3 - 12 * Math.floor(m / 10),
    y: b * 100 + d - 4800 + Math.floor(m / 10),
  };
}

/** Delta T (TT minus UT) in seconds, Espenak and Meeus polynomials, 1961 onwards. */
export function deltaT(year: number): number {
  if (year < 1986) {
    const t = year - 1975;
    return 45.45 + 1.067 * t - (t * t) / 260 - (t * t * t) / 718;
  }
  if (year < 2005) {
    const t = year - 2000;
    return 63.86 + 0.3345 * t - 0.060374 * t ** 2 + 0.0017275 * t ** 3 + 0.000651814 * t ** 4 + 0.00002373599 * t ** 5;
  }
  const t = year - 2000;
  return 62.92 + 0.32217 * t + 0.005589 * t * t;
}

/** Julian Ephemeris Day of the true new moon for lunation k (k = 0 is 2000-01-06), Meeus ch. 49. */
export function newMoonJDE(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;
  let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.00000015 * T3 + 0.00000000073 * T4;
  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const M = 2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3;
  const Mp = 201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4;
  const F = 160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4;
  const Om = 124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3;

  jde +=
    -0.4072 * sin(Mp) +
    0.17241 * E * sin(M) +
    0.01608 * sin(2 * Mp) +
    0.01039 * sin(2 * F) +
    0.00739 * E * sin(Mp - M) -
    0.00514 * E * sin(Mp + M) +
    0.00208 * E * E * sin(2 * M) -
    0.00111 * sin(Mp - 2 * F) -
    0.00057 * sin(Mp + 2 * F) +
    0.00056 * E * sin(2 * Mp + M) -
    0.00042 * sin(3 * Mp) +
    0.00042 * E * sin(M + 2 * F) +
    0.00038 * E * sin(M - 2 * F) -
    0.00024 * E * sin(2 * Mp - M) -
    0.00017 * sin(Om) -
    0.00007 * sin(Mp + 2 * M) +
    0.00004 * sin(2 * Mp - 2 * F) +
    0.00004 * sin(3 * M) +
    0.00003 * sin(Mp + M - 2 * F) +
    0.00003 * sin(2 * Mp + 2 * F) -
    0.00003 * sin(Mp + M + 2 * F) +
    0.00003 * sin(Mp - M + 2 * F) -
    0.00002 * sin(Mp - M - 2 * F) -
    0.00002 * sin(3 * Mp + M) +
    0.00002 * sin(4 * Mp);

  const A = [
    [299.77 + 0.107408 * k - 0.009173 * T2, 0.000325],
    [251.88 + 0.016321 * k, 0.000165],
    [251.83 + 26.651886 * k, 0.000164],
    [349.42 + 36.412478 * k, 0.000126],
    [84.66 + 18.206239 * k, 0.00011],
    [141.74 + 53.303771 * k, 0.000062],
    [207.14 + 2.453732 * k, 0.00006],
    [154.84 + 7.30686 * k, 0.000056],
    [34.52 + 27.261239 * k, 0.000047],
    [207.19 + 0.121824 * k, 0.000042],
    [291.34 + 1.844379 * k, 0.00004],
    [161.72 + 24.198154 * k, 0.000037],
    [239.56 + 25.513099 * k, 0.000035],
    [331.55 + 3.592518 * k, 0.000023],
  ];
  for (const [arg, coef] of A) jde += coef * sin(arg);
  return jde;
}

// Lunation numbers below count from the new moon of 1900-01-01 (Hồ Ngọc Đức's k),
// which is lunation -1237 in Meeus's numbering.
const K_OFFSET = 1237;
const EPOCH_1900 = 2415021.076998695;
const SYNODIC = 29.530588853;

/** Local day number (JDN) of the new moon of lunation k. */
export function newMoonDay(k: number, tz = VN_TIMEZONE): number {
  const jde = newMoonJDE(k - K_OFFSET);
  const year = 2000 + (k - K_OFFSET) / 12.3685;
  const jdUT = jde - deltaT(year) / 86400;
  return Math.floor(jdUT + 0.5 + tz / 24);
}

/** Apparent geocentric longitude of the Sun in degrees, Meeus ch. 25. */
export function sunLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * sin(M) + (0.019993 - 0.000101 * T) * sin(2 * M) + 0.000289 * sin(3 * M);
  const omega = 125.04 - 1934.136 * T;
  const lambda = L0 + C - 0.00569 - 0.00478 * sin(omega);
  return ((lambda % 360) + 360) % 360;
}

/** Which 30-degree sector (0 to 11) the Sun is in at local midnight starting day `jdn`. */
function sunSector(jdn: number, tz = VN_TIMEZONE): number {
  return Math.floor(sunLongitude(jdn - 0.5 - tz / 24) / 30);
}

/** Day number of the start of lunar month 11 (the month containing the winter solstice) of year yy. */
function lunarMonth11(yy: number, tz = VN_TIMEZONE): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = Math.floor(off / SYNODIC);
  let nm = newMoonDay(k, tz);
  if (sunSector(nm, tz) >= 9) nm = newMoonDay(k - 1, tz);
  return nm;
}

/** Offset (in months after month 11) of the leap month in a 13-month year starting at a11. */
function leapMonthOffset(a11: number, tz = VN_TIMEZONE): number {
  const k = Math.floor((a11 - EPOCH_1900) / SYNODIC + 0.5);
  let i = 1;
  let arc = sunSector(newMoonDay(k + i, tz), tz);
  let last: number;
  do {
    last = arc;
    i++;
    arc = sunSector(newMoonDay(k + i, tz), tz);
  } while (arc !== last && i < 14);
  return i - 1;
}

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  leap: boolean;
}

export function solarToLunar(yy: number, mm: number, dd: number, tz = VN_TIMEZONE): LunarDate {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = Math.floor((dayNumber - EPOCH_1900) / SYNODIC);
  let monthStart = newMoonDay(k + 1, tz);
  if (monthStart > dayNumber) monthStart = newMoonDay(k, tz);
  let a11 = lunarMonth11(yy, tz);
  let b11 = a11;
  let lunarYear: number;
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

/** Gregorian date of a lunar date, or null if that leap month does not exist that year. */
export function lunarToSolar(day: number, month: number, year: number, leap = false, tz = VN_TIMEZONE): { y: number; m: number; d: number } | null {
  let a11: number, b11: number;
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

/** The leap month of a lunar year (1 to 12), or null if the year has none. */
export function leapMonthOf(lunarYear: number, tz = VN_TIMEZONE): number | null {
  for (let m = 1; m <= 12; m++) if (lunarToSolar(1, m, lunarYear, true, tz)) return m;
  return null;
}

/** Number of days in a lunar month. */
export function lunarMonthLength(month: number, year: number, leap = false, tz = VN_TIMEZONE): number {
  const start = lunarToSolar(1, month, year, leap, tz);
  if (!start) throw new Error(`No ${leap ? "leap " : ""}month ${month} in lunar year ${year}`);
  const jd = jdFromDate(start.d, start.m, start.y);
  const next = solarToLunar(jdToDate(jd + 29).y, jdToDate(jd + 29).m, jdToDate(jd + 29).d, tz);
  return next.day === 1 ? 29 : 30;
}
