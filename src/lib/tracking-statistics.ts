/** Calendar totals use recorded completion dates, never catalog release years. */
export function completedInCurrentYear(
  rows: readonly { watchedDate: Date | null }[],
  now = new Date()
) {
  const activityYear = now.getUTCFullYear();
  const start = Date.UTC(activityYear, 0, 1);
  return {
    activityYear,
    completedThisYear: rows.filter(
      ({ watchedDate }) =>
        watchedDate !== null &&
        watchedDate.getTime() >= start &&
        watchedDate.getTime() <= now.getTime()
    ).length,
  };
}
