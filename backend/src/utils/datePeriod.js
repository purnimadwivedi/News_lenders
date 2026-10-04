function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateParam(dateStr, isEnd = false) {
  if (!dateStr) return null;
  const parts = String(dateStr).trim().split('-').map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return isEnd
      ? new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999)
      : new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  if (isEnd) d.setHours(23, 59, 59, 999);
  else d.setHours(0, 0, 0, 0);
  return d;
}

function getPeriodStartDate(period = 'MTD', refDate = new Date()) {
  const now = refDate;
  const p = (period || 'MTD').toUpperCase();

  if (p === 'MTD') {
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }
  if (p === 'QTD') {
    const qMonth = Math.floor(now.getMonth() / 3) * 3;
    return new Date(now.getFullYear(), qMonth, 1, 0, 0, 0, 0);
  }
  if (p === 'CFY') {
    // Current Financial Year (India: April 1 - March 31)
    const fyYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return new Date(fyYear, 3, 1, 0, 0, 0, 0);
  }
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

function getDateRange(period = 'MTD', startDateStr, endDateStr, refDate = new Date()) {
  const p = (period || 'MTD').toUpperCase();
  const start = parseDateParam(startDateStr, false) || getPeriodStartDate(p, refDate);
  const end = parseDateParam(endDateStr, true) || new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 23, 59, 59, 999);

  return {
    period: p,
    startDate: formatDate(start),
    endDate: formatDate(end),
    startDateTime: start,
    endDateTime: end
  };
}

module.exports = {
  formatDate,
  parseDateParam,
  getPeriodStartDate,
  getDateRange
};
