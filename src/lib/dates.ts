// Date helpers. All calendar maths runs on ISO "YYYY-MM-DD" strings in the
// college's timezone so "today" never drifts with the viewer's device clock.

export const COLLEGE_TZ = "Asia/Kolkata";

export function todayISO(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: COLLEGE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function isoDateInCollegeTz(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return todayISO(d);
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

export function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toISO(d);
}

export function weekday(iso: string): number {
  return parseISO(iso).getUTCDay();
}

export function diffDays(fromISO: string, toISOStr: string): number {
  return Math.round((parseISO(toISOStr).getTime() - parseISO(fromISO).getTime()) / 86_400_000);
}

export function isValidISO(iso: unknown): iso is string {
  if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  return toISO(parseISO(iso)) === iso;
}

const fmtCache = new Map<string, Intl.DateTimeFormat>();
export function formatISO(iso: string, opts: Intl.DateTimeFormatOptions): string {
  const key = JSON.stringify(opts);
  let f = fmtCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: "UTC" });
    fmtCache.set(key, f);
  }
  return f.format(parseISO(iso));
}

/** "Today", "Tomorrow", "Yesterday" or "Fri, 20 Nov" */
export function relativeDayLabel(iso: string, today: string): string {
  const d = diffDays(today, iso);
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  if (d === -1) return "Yesterday";
  return formatISO(iso, { weekday: "short", day: "numeric", month: "short" });
}

export function shortDate(iso: string): string {
  return formatISO(iso, { weekday: "short", day: "numeric", month: "short" });
}

export function longDate(iso: string): string {
  return formatISO(iso, { weekday: "long", day: "numeric", month: "long" });
}
