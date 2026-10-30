/**
 * Native JavaScript Month-End Date Calculator (Zero external dependencies).
 * Uses standard ECMAScript Date arithmetic.
 */
export class MonthDateUtil {
  /**
   * Calculates the exact start date and end date for any given year and month.
   * Handles 28, 29 (leap year), 30, and 31 days dynamically!
   * 
   * @param year e.g. 2026
   * @param month 1 to 12 (e.g. 6 for June, 10 for October)
   */
  static getMonthBoundaries(year: number, month: number): {
    startSuffix: string;
    endSuffix: string;
    totalDays: number;
    startDateFormatted: string;
    endDateFormatted: string;
  } {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

    // Day 0 of (month) in JS Date means the last day of the previous index (i.e., this target month).
    // Note: JS Date month argument is 0-indexed (0 = Jan, 11 = Dec).
    // So passing (year, month, 0) gives the exact last day of `month`!
    const lastDayObj = new Date(year, month, 0);
    const totalDays = lastDayObj.getDate(); // 28, 29, 30, or 31

    const mm = pad(month);
    const dd = pad(totalDays);

    return {
      startSuffix: `${year}${mm}01`,
      endSuffix: `${year}${mm}${dd}`,
      totalDays,
      startDateFormatted: `${year}-${mm}-01`,
      endDateFormatted: `${year}-${mm}-${dd}`,
    };
  }

  /**
   * Evaluates if today is the actual last calendar day of the current month.
   * Compares today's month with tomorrow's month.
   */
  static isTodayLastDayOfMonth(targetDate: Date = new Date()): boolean {
    const tomorrow = new Date(targetDate);
    tomorrow.setDate(targetDate.getDate() + 1);
    return tomorrow.getMonth() !== targetDate.getMonth();
  }
}

