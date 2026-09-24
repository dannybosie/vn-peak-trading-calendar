import assert from "node:assert/strict";
import { test } from "node:test";
import { eventsForYear, eventsForYears, title, upcoming } from "../src/core/calendar.ts";
import { fold, toIcs } from "../src/core/ics.ts";

const on = (year: number, id: string) => eventsForYear(year).filter((e) => e.id === id);

test("marketplace days and their prep windows", () => {
  const [d1111] = on(2026, "mega-11-11");
  assert.equal(d1111.start, "2026-11-11");
  assert.equal(d1111.tier, "tentpole");
  assert.equal(d1111.prepStart, "2026-10-21");
  assert.equal(on(2026, "mid-month").length, 12);
  const payday = on(2026, "payday");
  assert.equal(payday.length, 12);
  assert.deepEqual([payday[1].start, payday[1].end], ["2026-02-25", "2026-02-28"]);
  assert.deepEqual([payday[11].start, payday[11].end], ["2026-12-25", "2026-12-31"]);
});

test("Black Friday is the day after the fourth Thursday of November", () => {
  assert.equal(on(2026, "black-friday")[0].start, "2026-11-27");
  assert.equal(on(2027, "black-friday")[0].start, "2027-11-26");
  assert.equal(on(2028, "black-friday")[0].start, "2028-11-24");
  assert.equal(on(2026, "cyber-monday")[0].start, "2026-11-30");
});

test("lunar events land on the verified dates", () => {
  const [tet] = on(2026, "tet");
  assert.deepEqual([tet.start, tet.end], ["2026-02-17", "2026-02-19"]);
  assert.match(tet.observed ?? "", /14 to 22 February 2026/);
  assert.equal(on(2026, "ong-tao")[0].start, "2026-02-10");
  assert.equal(on(2027, "ong-tao")[0].start, "2027-01-30");
  assert.equal(on(2026, "vu-lan")[0].start, "2026-08-27");
  const [mid] = on(2026, "mid-autumn");
  assert.equal(mid.start, "2026-09-25");
  assert.equal(mid.prepStart, "2026-08-26");
  assert.equal(mid.lunar, "15/8 lunar");
});

test("Vietnamese Culture Day starts in 2026", () => {
  assert.equal(on(2025, "culture-day").length, 0);
  assert.equal(on(2026, "culture-day")[0].start, "2026-11-24");
});

test("every year is sorted and uids are unique", () => {
  const all = eventsForYears(2025, 2028);
  const uids = new Set(all.map((e) => e.uid));
  assert.equal(uids.size, all.length);
  for (const year of [2025, 2026, 2027, 2028]) {
    const ev = eventsForYear(year);
    assert.ok(ev.every((e, i) => i === 0 || ev[i - 1].start <= e.start));
    assert.ok(ev.every((e) => e.start.startsWith(String(year))));
  }
});

test("titles are bilingual and mark days off", () => {
  assert.equal(title(on(2026, "mid-autumn")[0]), "Mid-Autumn Festival · Tết Trung Thu");
  assert.equal(title(on(2026, "reunification")[0]), "Day off: Reunification Day · Ngày Giải phóng miền Nam, thống nhất đất nước");
  assert.equal(title(on(2026, "black-friday")[0]), "Black Friday");
});

test("upcoming skips what has ended", () => {
  const next = upcoming("2026-09-24", eventsForYear(2026));
  assert.ok(next.every((e) => e.end >= "2026-09-24"));
  assert.ok(next.some((e) => e.id === "mid-autumn"));
});

test("ICS output follows RFC 5545 basics", () => {
  const ics = toIcs(eventsForYear(2026), { name: "Test", description: "A, B; C", stamp: "20260924T000000Z" });
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n"));
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  assert.ok(ics.includes("X-WR-CALDESC:A\\, B\; C"));
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20261111\r\nDTEND;VALUE=DATE:20261112"));
  const enc = new TextEncoder();
  for (const line of ics.split("\r\n")) assert.ok(enc.encode(line).length <= 75, line);
  const events = ics.match(/BEGIN:VEVENT/g)?.length ?? 0;
  assert.equal(events, eventsForYear(2026).length);
});

test("prep feed has one reminder per weighted event", () => {
  const ev = eventsForYear(2026);
  const ics = toIcs(ev, { name: "Prep", description: "", stamp: "20260924T000000Z" }, "prep");
  assert.equal(ics.match(/BEGIN:VEVENT/g)?.length, ev.filter((e) => e.prepStart).length);
  assert.ok(ics.includes("SUMMARY:Prep: 11.11 Mega Sale in 21 days (2026-11-11)"));
});

test("folding never splits a Vietnamese character", () => {
  const line = `SUMMARY:${"Tết Trung Thu ".repeat(10)}`;
  const folded = fold(line);
  const rejoined = folded.split("\r\n ").join("");
  assert.equal(rejoined, line);
  for (const part of folded.split("\r\n")) assert.ok(new TextEncoder().encode(part).length <= 75);
});
