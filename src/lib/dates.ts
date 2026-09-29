// All dates are handled as ISO strings representing dates only (YYYY-MM-DD)
// to avoid local timezone issues, but "current date" checks are strictly in IST.

/**
 * Returns the current date in IST timezone as a YYYY-MM-DD string.
 */
export function getCurrentISTDateString(nowDate = new Date()): string {
  // Convert current time to IST
  // nowDate.getTime() is UTC ms. 
  // Get UTC date, add 5.5 hours to get IST date.
  const utc = nowDate.getTime() + (nowDate.getTimezoneOffset() * 60000);
  const ist = new Date(utc + (5.5 * 3600000));
  
  const year = ist.getFullYear();
  const month = String(ist.getMonth() + 1).padStart(2, '0');
  const day = String(ist.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the next due date using anchor-day logic and last-day clamping.
 * @param anchorDay The original day of the month the user joined (1-31)
 * @param lastDueDate The most recent due date (YYYY-MM-DD) or join date
 * @param monthsToAdd The duration of the new plan in months
 * @returns The next due date as YYYY-MM-DD
 */
export function calculateNextDueDate(anchorDay: number, lastDueDate: string, monthsToAdd: number): string {
  const [yearStr, monthStr] = lastDueDate.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10); // 1-12

  // Add months
  month += monthsToAdd;
  
  // Normalize year and month
  while (month > 12) {
    year += 1;
    month -= 12;
  }
  
  // Calculate the last day of the target month
  // new Date(year, month, 0) gives the last day of the previous month.
  // Since month is 1-indexed here, new Date(year, month, 0) gives the last day of the current 1-indexed month.
  const lastDayOfTargetMonth = new Date(year, month, 0).getDate();
  
  // Clamp to the last day if the anchor day exceeds it
  const day = Math.min(anchorDay, lastDayOfTargetMonth);
  
  const mStr = String(month).padStart(2, '0');
  const dStr = String(day).padStart(2, '0');
  
  return `${year}-${mStr}-${dStr}`;
}

export type MemberStatus = 'active' | 'due_soon' | 'due' | 'overdue' | 'frozen';

/**
 * Computes the real-time status of a member.
 */
export function computeMemberStatus(
  nextDueDate: string,
  isFrozen: boolean,
  graceDays: number,
  nowDate = new Date()
): MemberStatus {
  if (isFrozen) return 'frozen';

  const todayStr = getCurrentISTDateString(nowDate);
  
  // Convert strings to epoch for easy comparison
  const todayMs = new Date(todayStr + 'T00:00:00Z').getTime();
  const dueMs = new Date(nextDueDate + 'T00:00:00Z').getTime();
  
  const daysDiff = (dueMs - todayMs) / (1000 * 60 * 60 * 24);
  
  if (daysDiff < -graceDays) return 'overdue';
  if (daysDiff < 0) return 'due'; // within grace period, considered "due" (or overdue depending on logic, let's say "due" implies action needed but not strictly overdue beyond grace)
  if (daysDiff === 0) return 'due'; // Due today
  if (daysDiff <= 7) return 'due_soon'; // Within 7 days
  
  return 'active';
}

/**
 * Computes reminder schedule dates based on the next due date and offsets.
 */
export function calculateReminderDates(nextDueDate: string, offsets = [-3, 0, 1, 3, 7]): { offset: number, date: string }[] {
  const [yearStr, monthStr, dayStr] = nextDueDate.split('-');
  const baseDate = new Date(Date.UTC(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr)));
  
  return offsets.map(offset => {
    const d = new Date(baseDate.getTime() + (offset * 24 * 60 * 60 * 1000));
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return {
      offset,
      date: `${year}-${month}-${day}`
    };
  });
}

export function getNextDueDate(joinDate: string, payments?: { covers_to: string }[]): string {
  if (!payments || payments.length === 0) return joinDate;
  // Find the latest covers_to
  return payments.reduce((latest, p) => {
    return p.covers_to > latest ? p.covers_to : latest;
  }, payments[0].covers_to);
}
