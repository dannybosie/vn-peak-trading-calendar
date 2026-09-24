// The Vietnam e-commerce calendar: marketplace sale days, statutory holidays and the
// cultural dates that move gifting demand. Lunar dates are computed; nothing here is
// typed in per year except the officially announced day-off schedules.

export type EventType = "mega-sale" | "mid-month" | "payday" | "global-sale" | "holiday" | "cultural";

/** Commercial weight. Tentpoles and majors get a prep reminder. */
export type Tier = "tentpole" | "major" | "monthly" | "minor";

export type Rule =
  | { kind: "fixed"; month: number; day: number }
  | { kind: "monthly"; day: number }
  | { kind: "lunar"; month: number; day: number; /** Lunar year relative to the calendar year. */ yearOffset?: number }
  /** The nth weekday of a month, shifted by plusDays (Black Friday: 4th Thursday of November plus 1). */
  | { kind: "nth-weekday"; month: number; weekday: number; n: number; plusDays?: number };

export interface EventDef {
  id: string;
  name: string;
  nameVi?: string;
  type: EventType;
  tier: Tier;
  rule: Rule;
  /** Length in days, or "month-end" to run to the last day of the month. */
  duration?: number | "month-end";
  /** Days of campaign preparation before the event. */
  preheatDays?: number;
  /** A statutory paid day off. */
  official?: boolean;
  /** First year the event exists. */
  since?: number;
  note: string;
  /** Officially announced day-off schedules, by year. */
  observed?: Record<number, string>;
}

const MEGA: [number, Tier, string][] = [
  [1, "monthly", "New Year double-day sale. Smaller than the Q4 peaks, and budgets are often still resetting."],
  [2, "monthly", "Falls close to Tết in most years, so delivery cut-offs matter more than the discount."],
  [3, "monthly", "Opens the Women's Day week (8/3). Lazada runs its birthday sale in late March."],
  [4, "monthly", "Quiet month between Giỗ Tổ and the 30/4 to 1/5 long weekend."],
  [5, "monthly", "Lands right after the 30/4 to 1/5 break."],
  [6, "major", "Opens the mid-year sale season on the marketplaces."],
  [7, "major", "Mid-year sale peak."],
  [8, "monthly", "Runs into the Vu Lan and back-to-school period."],
  [9, "major", "Start of the Q4 run. Shopee brands it Super Shopping Day."],
  [10, "major", "The Q4 build continues, ten days before Vietnamese Women's Day (20/10)."],
  [11, "tentpole", "Singles' Day. The largest sale day of the year on Shopee, Lazada and TikTok Shop."],
  [12, "tentpole", "The year-end peak. Shopee runs it as its birthday sale."],
];

export const EVENTS: EventDef[] = [
  ...MEGA.map(([m, tier, note]): EventDef => ({
    id: `mega-${m}-${m}`,
    name: `${m}.${m} Mega Sale`,
    type: "mega-sale",
    tier,
    rule: { kind: "fixed", month: m, day: m },
    preheatDays: tier === "tentpole" ? 21 : tier === "major" ? 14 : 5,
    note,
  })),
  {
    id: "mid-month",
    name: "Mid-month sale",
    nameVi: "Sale giữa tháng",
    type: "mid-month",
    tier: "minor",
    rule: { kind: "monthly", day: 15 },
    duration: 1,
    note: "Monthly mid-month campaign on the marketplaces. Exact windows vary by platform, around the 13th to the 17th.",
  },
  {
    id: "payday",
    name: "Payday sale window",
    nameVi: "Sale ngày lương",
    type: "payday",
    tier: "minor",
    rule: { kind: "monthly", day: 25 },
    duration: "month-end",
    note: "Payday campaigns from around the 25th to the end of the month, when salaries land. Exact windows vary by platform.",
  },
  {
    id: "black-friday",
    name: "Black Friday",
    type: "global-sale",
    tier: "major",
    rule: { kind: "nth-weekday", month: 11, weekday: 4, n: 4, plusDays: 1 },
    preheatDays: 14,
    note: "Imported sale moment, strongest for cross-border, electronics and international brands. Two weeks after 11.11, so plan the stock for both.",
  },
  {
    id: "cyber-monday",
    name: "Cyber Monday",
    type: "global-sale",
    tier: "minor",
    rule: { kind: "nth-weekday", month: 11, weekday: 4, n: 4, plusDays: 4 },
    note: "Tail of the Black Friday weekend.",
  },

  // Statutory holidays (Labor Code 2019, Article 112, and Resolution 28/2026/QH16 for 24/11).
  {
    id: "new-year",
    name: "New Year's Day",
    nameVi: "Tết Dương lịch",
    type: "holiday",
    tier: "minor",
    rule: { kind: "fixed", month: 1, day: 1 },
    official: true,
    note: "Paid day off.",
  },
  {
    id: "tet",
    name: "Lunar New Year (Tết)",
    nameVi: "Tết Nguyên Đán",
    type: "holiday",
    tier: "tentpole",
    rule: { kind: "lunar", month: 1, day: 1 },
    duration: 3,
    official: true,
    preheatDays: 60,
    note: "Five paid days off, placed around Tết by the Prime Minister each year. Couriers slow down and stop in the last days of the old year, and many sellers pause. Demand peaks in the three weeks before.",
    observed: {
      2026: "Public sector off 14 to 22 February 2026 (Bộ Nội vụ notice 9441/TB-BNV). Private employers give five days around Tết.",
    },
  },
  {
    id: "gio-to",
    name: "Hung Kings Commemoration Day",
    nameVi: "Giỗ Tổ Hùng Vương",
    type: "holiday",
    tier: "minor",
    rule: { kind: "lunar", month: 3, day: 10 },
    official: true,
    note: "Paid day off. When it falls on a weekend, the next working day is off.",
    observed: { 2026: "Falls on Sunday 26 April 2026, so Monday 27 April is off." },
  },
  {
    id: "reunification",
    name: "Reunification Day",
    nameVi: "Ngày Giải phóng miền Nam, thống nhất đất nước",
    type: "holiday",
    tier: "major",
    rule: { kind: "fixed", month: 4, day: 30 },
    official: true,
    preheatDays: 14,
    note: "Paid day off, and with 1/5 it makes the first long weekend of the year. Travel and outdoor demand peaks; urban delivery slows.",
    observed: { 2026: "Off Thursday 30 April to Sunday 3 May 2026." },
  },
  {
    id: "labour-day",
    name: "International Labour Day",
    nameVi: "Ngày Quốc tế Lao động",
    type: "holiday",
    tier: "minor",
    rule: { kind: "fixed", month: 5, day: 1 },
    official: true,
    note: "Paid day off, joined to 30/4.",
  },
  {
    id: "national-day",
    name: "National Day",
    nameVi: "Quốc khánh",
    type: "holiday",
    tier: "major",
    rule: { kind: "fixed", month: 9, day: 2 },
    official: true,
    preheatDays: 14,
    note: "Two paid days off: 2/9 and one day before or after, set by the Prime Minister each year.",
    observed: { 2026: "Public sector off Saturday 29 August to Wednesday 2 September 2026. Private employers give 2/9 plus 1/9 or 3/9." },
  },
  {
    id: "culture-day",
    name: "Vietnamese Culture Day",
    nameVi: "Ngày Văn hóa Việt Nam",
    type: "holiday",
    tier: "minor",
    rule: { kind: "fixed", month: 11, day: 24 },
    official: true,
    since: 2026,
    note: "New paid day off from 2026 under Resolution 28/2026/QH16. It falls between 11.11 and 12.12, so it is a fresh long-weekend slot in the Q4 plan.",
  },

  // Cultural and gifting dates.
  {
    id: "ong-tao",
    name: "Kitchen Gods' Day",
    nameVi: "Ông Công Ông Táo",
    type: "cultural",
    tier: "major",
    rule: { kind: "lunar", month: 12, day: 23, yearOffset: -1 },
    note: "23rd of the last lunar month, one week before Tết. Traditionally the last big shopping push before the holiday.",
  },
  {
    id: "valentine",
    name: "Valentine's Day",
    type: "cultural",
    tier: "major",
    rule: { kind: "fixed", month: 2, day: 14 },
    preheatDays: 14,
    note: "Gifting peak for flowers, chocolate, jewellery and fashion. Sometimes collides with Tết, which moves the demand earlier.",
  },
  {
    id: "than-tai",
    name: "God of Wealth Day",
    nameVi: "Vía Thần Tài",
    type: "cultural",
    tier: "major",
    rule: { kind: "lunar", month: 1, day: 10 },
    preheatDays: 7,
    note: "Tenth day of the first lunar month. The biggest day of the year for gold, and a lift for jewellery and anything sold as lucky.",
  },
  {
    id: "ram-thang-gieng",
    name: "First Full Moon",
    nameVi: "Rằm tháng Giêng",
    type: "cultural",
    tier: "minor",
    rule: { kind: "lunar", month: 1, day: 15 },
    note: "First full moon of the lunar year. Offerings and flowers; the traditional end of the Tết season.",
  },
  {
    id: "womens-day",
    name: "International Women's Day",
    nameVi: "Quốc tế Phụ nữ",
    type: "cultural",
    tier: "major",
    rule: { kind: "fixed", month: 3, day: 8 },
    preheatDays: 14,
    note: "One of the three gifting peaks for women in Vietnam, with 20/10 and Vu Lan. Beauty, flowers, fashion.",
  },
  {
    id: "childrens-day",
    name: "Children's Day",
    nameVi: "Quốc tế Thiếu nhi",
    type: "cultural",
    tier: "major",
    rule: { kind: "fixed", month: 6, day: 1 },
    preheatDays: 14,
    note: "Toys, kids' fashion and family outings. Also the start of the summer holidays.",
  },
  {
    id: "doan-ngo",
    name: "Double Fifth Festival",
    nameVi: "Tết Đoan Ngọ",
    type: "cultural",
    tier: "minor",
    rule: { kind: "lunar", month: 5, day: 5 },
    note: "Fifth day of the fifth lunar month. Seasonal food and offerings.",
  },
  {
    id: "vu-lan",
    name: "Vu Lan (Parents' Day)",
    nameVi: "Lễ Vu Lan",
    type: "cultural",
    tier: "major",
    rule: { kind: "lunar", month: 7, day: 15 },
    preheatDays: 14,
    note: "Full moon of the seventh lunar month, a day for honouring parents. Gifting for mothers; vegetarian food demand rises across the month.",
  },
  {
    id: "mid-autumn",
    name: "Mid-Autumn Festival",
    nameVi: "Tết Trung Thu",
    type: "cultural",
    tier: "tentpole",
    rule: { kind: "lunar", month: 8, day: 15 },
    preheatDays: 30,
    note: "Mooncake and corporate gifting season runs for about a month before the full moon; B2B orders close earliest. Toys and lanterns for children.",
  },
  {
    id: "vn-womens-day",
    name: "Vietnamese Women's Day",
    nameVi: "Ngày Phụ nữ Việt Nam",
    type: "cultural",
    tier: "major",
    rule: { kind: "fixed", month: 10, day: 20 },
    preheatDays: 14,
    note: "Gifting peak for women. Ten days after 10.10, so one campaign can carry both.",
  },
  {
    id: "teachers-day",
    name: "Teachers' Day",
    nameVi: "Ngày Nhà giáo Việt Nam",
    type: "cultural",
    tier: "major",
    rule: { kind: "fixed", month: 11, day: 20 },
    preheatDays: 10,
    note: "Gifts for teachers from students and parents. Flowers, stationery, beauty and gift sets.",
  },
  {
    id: "christmas",
    name: "Christmas",
    nameVi: "Giáng sinh",
    type: "cultural",
    tier: "major",
    rule: { kind: "fixed", month: 12, day: 25 },
    preheatDays: 21,
    note: "Decorations, gifting and year-end parties in the cities. Lands two weeks after 12.12.",
  },
];

export const TYPE_LABELS: Record<EventType, string> = {
  "mega-sale": "Mega sale",
  "mid-month": "Mid-month sale",
  payday: "Payday",
  "global-sale": "Global sale",
  holiday: "Holiday",
  cultural: "Culture and gifting",
};
