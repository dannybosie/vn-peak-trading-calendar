import { type Occurrence, eventsForYears } from "./calendar.ts";
import type { EventType } from "./events.ts";
import { toIcs } from "./ics.ts";

export interface Feed {
  slug: string;
  name: string;
  description: string;
  types: EventType[] | "all";
  mode: "events" | "prep";
}

export const FEEDS: Feed[] = [
  { slug: "all", name: "VN Peak Trading Calendar", description: "Every Vietnam e-commerce sale day, holiday and gifting date.", types: "all", mode: "events" },
  { slug: "sales", name: "VN Peak Trading: Sales", description: "Marketplace double days, mid-month and payday sales, Black Friday.", types: ["mega-sale", "mid-month", "payday", "global-sale"], mode: "events" },
  { slug: "holidays", name: "VN Peak Trading: Holidays", description: "Statutory paid days off in Vietnam, with official schedules where announced.", types: ["holiday"], mode: "events" },
  { slug: "culture", name: "VN Peak Trading: Culture and gifting", description: "Lunar festivals and gifting peaks: Mid-Autumn, Vu Lan, 20/10, 20/11 and more.", types: ["cultural"], mode: "events" },
  { slug: "prep", name: "VN Peak Trading: Prep reminders", description: "A reminder on the day each tentpole's campaign prep should start.", types: "all", mode: "prep" },
];

export function feedEvents(feed: Feed, events: Occurrence[]): Occurrence[] {
  return feed.types === "all" ? events : events.filter((e) => (feed.types as EventType[]).includes(e.type));
}

/** All feeds for a year range, as file name to content. */
export function buildFeeds(from: number, to: number, stamp: string): Record<string, string> {
  const events = eventsForYears(from, to);
  const files: Record<string, string> = {};
  for (const feed of FEEDS) {
    files[`${feed.slug}.ics`] = toIcs(feedEvents(feed, events), { name: feed.name, description: feed.description, stamp }, feed.mode);
  }
  files["events.json"] = `${JSON.stringify({ generated: stamp, from, to, events }, null, 1)}\n`;
  return files;
}
