const weekday = ["일", "월", "화", "수", "목", "금", "토"];

export const toISO = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? new Date(date) : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

export const parseISO = (str) => {
  if (!str) return null;
  const d = new Date(`${str}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const compareISO = (a, b) => {
  if (!a || !b) return 0;
  if (a === b) return 0;
  return a < b ? -1 : 1;
};

export const addDaysISO = (iso, days) => {
  const d = parseISO(iso);
  if (!d) return iso;
  d.setDate(d.getDate() + days);
  return toISO(d);
};

export const diffDays = (startISO, endISO) => {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  if (!start || !end) return 0;
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
};

export const formatDateLabel = (iso) => {
  const d = parseISO(iso);
  if (!d) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const w = weekday[d.getDay()];
  return `${mm}.${dd}(${w})`;
};

