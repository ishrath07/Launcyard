export function startOfToday(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function startOfWeek(now = new Date()) {
  const day = startOfToday(now);
  const weekday = day.getDay();
  const fromMonday = weekday === 0 ? 6 : weekday - 1;
  day.setDate(day.getDate() - fromMonday);
  return day;
}

export function startOfMonth(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function periodRange(period: "today" | "week" | "month" | "all", now = new Date()) {
  if (period === "today") return { from: startOfToday(now), to: addDays(startOfToday(now), 1) };
  if (period === "week") return { from: startOfWeek(now), to: addDays(startOfToday(now), 1) };
  if (period === "month") return { from: startOfMonth(now), to: addDays(startOfToday(now), 1) };
  return { from: new Date(0), to: addDays(startOfToday(now), 1) };
}

export function periodLabel(from: Date, toExclusive: Date) {
  const end = addDays(toExclusive, -1);
  const fmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt.format(from)} to ${fmt.format(end)}`;
}
