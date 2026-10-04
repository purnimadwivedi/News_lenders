export type DashboardPeriod = 'MTD' | 'QTD' | 'CFY';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateRange(period: DashboardPeriod, referenceDate: Date = new Date()): DateRange {
  const now = referenceDate;
  const endDate = formatDate(now);
  let start: Date;

  switch (period) {
    case 'QTD': {
      const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), qStartMonth, 1, 0, 0, 0, 0);
      break;
    }
    case 'CFY': {
      // Current Financial Year (India convention: April 1 - March 31)
      const fyYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      start = new Date(fyYear, 3, 1, 0, 0, 0, 0);
      break;
    }
    case 'MTD':
    default: {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
    }
  }

  return {
    startDate: formatDate(start),
    endDate
  };
}
