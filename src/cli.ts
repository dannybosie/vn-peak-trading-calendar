import { parseArgs } from "node:util";
import { type Occurrence, daysBetween, eventsForYears, isoDate, title, upcoming } from "./core/calendar.ts";
import { TYPE_LABELS } from "./core/events.ts";
import { FEEDS, feedEvents } from "./core/feeds.ts";
import { toIcs } from "./core/ics.ts";
import { lunarToSolar, solarToLunar } from "./core/lunar.ts";

const VERSION = "1.0.0";
const HELP = `vn-peak ${VERSION}
Campaign Seasonality Intelligence for Vietnam e-commerce: sale days, holidays and
gifting dates, with lunar dates computed for the Vietnamese calendar.

Usage
  vn-peak next [--count 10] [--type mega-sale,holiday]    What is coming up
  vn-peak list [--year 2027] [--type cultural]            A whole year
  vn-peak ics [--from 2026 --to 2028] [--feed all]        Print an .ics feed
  vn-peak lunar 2026-08-27                                Solar to lunar
  vn-peak solar 15/7/2026 [--leap]                        Lunar to solar

Types: ${Object.keys(TYPE_LABELS).join(", ")}
Feeds: ${FEEDS.map((f) => f.slug).join(", ")}`;

const today = () => {
  // Today in Vietnam, whatever the machine's time zone.
  const t = new Date(Date.now() + 7 * 3600 * 1000);
  return isoDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
};

function row(e: Occurrence, from?: string): string {
  const when = e.start === e.end ? e.start : `${e.start} to ${e.end.slice(5)}`;
  const inDays = from ? daysBetween(from, e.start) : null;
  const rel = inDays === null ? "" : inDays <= 0 ? "now" : `in ${inDays}d`;
  const prep = e.prepStart && from && e.prepStart <= from && e.start > from ? "  [prep window open]" : "";
  return `${when.padEnd(22)} ${rel.padEnd(8)} ${TYPE_LABELS[e.type].padEnd(20)} ${title(e)}${prep}`;
}

function main(): number {
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
      version: { type: "boolean", short: "v", default: false },
    },
  });
  const [command, arg] = positionals;
  if (values.version) return console.log(VERSION), 0;
  if (values.help || !command) return console.log(HELP), values.help ? 0 : 2;

  const types = values.type?.split(",").map((s) => s.trim());
  const filter = (list: Occurrence[]) => (types ? list.filter((e) => types.includes(e.type)) : list);
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
  console.error(`vn-peak: ${(err as Error).message}`);
  process.exit(2);
}
