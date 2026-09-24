import { type Occurrence, addDays, daysBetween, describe, title } from "./calendar.ts";
import { TYPE_LABELS } from "./events.ts";

export const SITE = "https://dannybosie.github.io/vn-peak-trading-calendar/";

const escapeText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Folds a content line at 75 octets without splitting a UTF-8 character (RFC 5545, 3.1). */
export function fold(line: string): string {
  const enc = new TextEncoder();
  const parts: string[] = [];
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

const compact = (iso: string) => iso.replace(/-/g, "");

export interface FeedOptions {
  name: string;
  description: string;
  /** DTSTAMP, e.g. the build date. */
  stamp: string;
}

function vevent(e: Occurrence, stamp: string, prep = false): string[] {
  if (prep && e.prepStart) {
    const days = daysBetween(e.prepStart, e.start);
    return [
      "BEGIN:VEVENT",
      `UID:prep-${e.uid}@vn-peak-trading-calendar`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(e.prepStart)}`,
      `DTEND;VALUE=DATE:${compact(addDays(e.prepStart, 1))}`,
      `SUMMARY:${escapeText(`Prep: ${e.name} in ${days} days (${e.start})`)}`,
      `DESCRIPTION:${escapeText(`Campaign prep window opens for ${e.name} (${e.start}).\n\n${describe(e)}`)}`,
      "CATEGORIES:Prep",
      "TRANSP:TRANSPARENT",
      `URL:${SITE}`,
      "END:VEVENT",
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
    "END:VEVENT",
  ];
}

export function toIcs(events: Occurrence[], opts: FeedOptions, mode: "events" | "prep" = "events"): string {
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
    "X-PUBLISHED-TTL:P1D",
  ];
  for (const e of events) {
    if (mode === "prep" && !e.prepStart) continue;
    lines.push(...vevent(e, opts.stamp, mode === "prep"));
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(fold).join("\r\n")}\r\n`;
}
