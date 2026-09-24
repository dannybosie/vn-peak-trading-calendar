import assert from "node:assert/strict";
import { test } from "node:test";
import { leapMonthOf, lunarToSolar, solarToLunar } from "../src/core/lunar.ts";

// Gregorian dates of Vietnamese lunar days, checked one by one against published
// Vietnamese calendars (xemlicham.com, VOV) for 2025 to 2028.
const FIXTURES: Record<number, Record<string, [number, number, string]>> = {
  2025: { tet: [1, 1, "2025-01-29"], thanTai: [10, 1, "2025-02-07"], ramGieng: [15, 1, "2025-02-12"], gioTo: [10, 3, "2025-04-07"], doanNgo: [5, 5, "2025-05-31"], vuLan: [15, 7, "2025-09-06"], trungThu: [15, 8, "2025-10-06"], ongTao: [23, 12, "2026-02-10"] },
  2026: { tet: [1, 1, "2026-02-17"], thanTai: [10, 1, "2026-02-26"], ramGieng: [15, 1, "2026-03-03"], gioTo: [10, 3, "2026-04-26"], doanNgo: [5, 5, "2026-06-19"], vuLan: [15, 7, "2026-08-27"], trungThu: [15, 8, "2026-09-25"], ongTao: [23, 12, "2027-01-30"] },
  2027: { tet: [1, 1, "2027-02-06"], thanTai: [10, 1, "2027-02-15"], ramGieng: [15, 1, "2027-02-20"], gioTo: [10, 3, "2027-04-16"], doanNgo: [5, 5, "2027-06-09"], vuLan: [15, 7, "2027-08-16"], trungThu: [15, 8, "2027-09-15"], ongTao: [23, 12, "2028-01-19"] },
  2028: { tet: [1, 1, "2028-01-26"], thanTai: [10, 1, "2028-02-04"], ramGieng: [15, 1, "2028-02-09"], gioTo: [10, 3, "2028-04-04"], doanNgo: [5, 5, "2028-05-28"], vuLan: [15, 7, "2028-09-03"], trungThu: [15, 8, "2028-10-03"], ongTao: [23, 12, "2029-02-06"] },
};

const iso = (d: { y: number; m: number; d: number } | null) =>
  d ? `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}` : "none";

for (const [year, days] of Object.entries(FIXTURES)) {
  test(`lunar festivals of ${year}`, () => {
    for (const [name, [day, month, expected]] of Object.entries(days)) {
      assert.equal(iso(lunarToSolar(day, month, Number(year))), expected, `${name} ${day}/${month}/${year}`);
      const [y, m, d] = expected.split("-").map(Number);
      const back = solarToLunar(y, m, d);
      assert.deepEqual([back.day, back.month, back.year, back.leap], [day, month, Number(year), false], `${name} round trip`);
    }
  });
}

test("Vu Lan 2026 is 27 August: the new moon falls 36 minutes after midnight", () => {
  assert.equal(iso(lunarToSolar(1, 7, 2026)), "2026-08-13");
  assert.equal(iso(lunarToSolar(15, 7, 2026)), "2026-08-27");
});

test("near-midnight new moons", () => {
  assert.equal(iso(lunarToSolar(1, 1, 2027)), "2027-02-06"); // new moon 22:56
  assert.equal(iso(lunarToSolar(1, 8, 2027)), "2027-09-01"); // new moon 00:41
});

test("leap months", () => {
  assert.equal(leapMonthOf(2025), 6);
  assert.equal(iso(lunarToSolar(1, 6, 2025, true)), "2025-07-25");
  assert.equal(leapMonthOf(2026), null);
  assert.equal(leapMonthOf(2027), null);
  assert.equal(leapMonthOf(2028), 5);
  assert.equal(iso(lunarToSolar(1, 5, 2028, true)), "2028-06-23");
  assert.equal(lunarToSolar(1, 5, 2026, true), null);
});

test("Vietnam, not China: Tết 2007 and Tết 1985", () => {
  assert.equal(iso(lunarToSolar(1, 1, 2007)), "2007-02-17");
  assert.equal(iso(lunarToSolar(1, 1, 1985)), "1985-01-21");
  // The same algorithm at UTC+8 gives the Chinese dates.
  assert.equal(iso(lunarToSolar(1, 1, 2007, false, 8)), "2007-02-18");
  assert.equal(iso(lunarToSolar(1, 1, 1985, false, 8)), "1985-02-20");
});

test("Tết 2029 and the Ông Táo day before Tết 2025", () => {
  assert.equal(iso(lunarToSolar(1, 1, 2029)), "2029-02-13");
  assert.equal(iso(lunarToSolar(23, 12, 2024)), "2025-01-22");
});
