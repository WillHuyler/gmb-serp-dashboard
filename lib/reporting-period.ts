export type ReportingPresetId =
  | 'LAST_30_DAYS'
  | 'MONTH_TO_DATE'
  | 'LAST_COMPLETE_MONTH'
  | 'LAST_90_DAYS'
  | 'CUSTOM';

export interface ReportingPeriod {
  presetId: ReportingPresetId;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  presetLabel: string;
  timezone: string;
}

function getZonedDateParts(date: Date, timeZone: string): { year: number; month: number; day: number } {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(date);
    const year = Number(parts.find((p) => p.type === 'year')?.value || date.getUTCFullYear());
    const month = Number(parts.find((p) => p.type === 'month')?.value || date.getUTCMonth() + 1);
    const day = Number(parts.find((p) => p.type === 'day')?.value || date.getUTCDate());
    return { year, month, day };
  } catch {
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
    };
  }
}

function formatYmd(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatShortHuman(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return ymd;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function resolveUserTimezone(preferredTimezone?: string | null): string {
  if (preferredTimezone && preferredTimezone.trim().length > 0) {
    return preferredTimezone.trim();
  }
  if (typeof Intl !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().timeZone) {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return 'America/New_York';
}

export function buildDynamicReportingPresets(
  timeZone?: string | null,
  referenceDate: Date = new Date()
): ReportingPeriod[] {
  const tz = resolveUserTimezone(timeZone);
  const { year, month, day } = getZonedDateParts(referenceDate, tz);
  const todayUtc = new Date(Date.UTC(year, month - 1, day));

  // 1. Last 30 Days
  const thirtyDaysAgo = new Date(todayUtc.getTime() - 29 * 86400000);
  const start30 = formatYmd(
    thirtyDaysAgo.getUTCFullYear(),
    thirtyDaysAgo.getUTCMonth() + 1,
    thirtyDaysAgo.getUTCDate()
  );
  const endToday = formatYmd(year, month, day);

  // 2. Month to Date (MTD)
  const startMtd = formatYmd(year, month, 1);

  // 3. Last Complete Month
  const prevMonthEnd = new Date(Date.UTC(year, month - 1, 0));
  const prevYear = prevMonthEnd.getUTCFullYear();
  const prevMonth = prevMonthEnd.getUTCMonth() + 1;
  const prevLastDay = prevMonthEnd.getUTCDate();
  const startPrevMonth = formatYmd(prevYear, prevMonth, 1);
  const endPrevMonth = formatYmd(prevYear, prevMonth, prevLastDay);

  // 4. Last 90 Days
  const ninetyDaysAgo = new Date(todayUtc.getTime() - 89 * 86400000);
  const start90 = formatYmd(
    ninetyDaysAgo.getUTCFullYear(),
    ninetyDaysAgo.getUTCMonth() + 1,
    ninetyDaysAgo.getUTCDate()
  );

  return [
    {
      presetId: 'LAST_30_DAYS',
      startDate: start30,
      endDate: endToday,
      presetLabel: `Last 30 Days (${formatShortHuman(start30)} – ${formatShortHuman(endToday)})`,
      timezone: tz,
    },
    {
      presetId: 'MONTH_TO_DATE',
      startDate: startMtd,
      endDate: endToday,
      presetLabel: `Month to Date (${formatShortHuman(startMtd)} – ${formatShortHuman(endToday)})`,
      timezone: tz,
    },
    {
      presetId: 'LAST_COMPLETE_MONTH',
      startDate: startPrevMonth,
      endDate: endPrevMonth,
      presetLabel: `Last Complete Month (${formatShortHuman(startPrevMonth)} – ${formatShortHuman(endPrevMonth)})`,
      timezone: tz,
    },
    {
      presetId: 'LAST_90_DAYS',
      startDate: start90,
      endDate: endToday,
      presetLabel: `Last 90 Days (${formatShortHuman(start90)} – ${formatShortHuman(endToday)})`,
      timezone: tz,
    },
  ];
}

export function isValidIsoDateString(val: string | null | undefined): val is string {
  if (!val || typeof val !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
  const parsed = Date.parse(`${val}T00:00:00Z`);
  return !Number.isNaN(parsed);
}
