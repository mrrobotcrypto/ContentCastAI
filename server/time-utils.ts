/**
 * Time utilities for Turkey timezone (Europe/Istanbul) with 03:00 AM reset logic
 */

/**
 * Get the current Turkey date string in YYYY-MM-DD format based on 03:00 AM reset logic
 * If it's before 03:00 AM in Turkey, considers it as the previous day
 */
export function getTurkeyResetDate(): string {
  const now = new Date();
  // Convert to Turkey timezone
  const turkeyTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
  
  // If it's before 03:00 AM, consider it as the previous day for reset purposes
  if (turkeyTime.getHours() < 3) {
    turkeyTime.setDate(turkeyTime.getDate() - 1);
  }
  
  return turkeyTime.toISOString().split('T')[0]; // YYYY-MM-DD format
}

/**
 * Get the next Turkey reset time (next 03:00 AM in Turkey timezone)
 */
export function getNextTurkeyReset(): Date {
  const now = new Date();
  // Convert to Turkey timezone
  const turkeyTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
  
  // Set to next 03:00 AM
  const nextReset = new Date(turkeyTime);
  nextReset.setHours(3, 0, 0, 0);
  
  // If it's already past 03:00 AM today, move to next day
  if (turkeyTime.getHours() >= 3) {
    nextReset.setDate(nextReset.getDate() + 1);
  }
  
  // Convert back to UTC for storage/comparison
  const utcOffset = nextReset.getTimezoneOffset() * 60000;
  const turkeyOffset = getTurkeyTimezoneOffset(nextReset);
  const nextResetUTC = new Date(nextReset.getTime() - turkeyOffset);
  
  return nextResetUTC;
}

/**
 * Get Turkey timezone offset in milliseconds
 */
function getTurkeyTimezoneOffset(date: Date): number {
  // Turkey is UTC+3, but we need to account for DST
  const turkeyTime = new Date(date.toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
  const utcTime = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  return turkeyTime.getTime() - utcTime.getTime();
}

/**
 * Get seconds until next Turkey reset (03:00 AM Turkey time)
 */
export function getSecondsUntilNextTurkeyReset(): number {
  const now = new Date();
  const nextReset = getNextTurkeyReset();
  const diffMs = nextReset.getTime() - now.getTime();
  return Math.max(0, Math.floor(diffMs / 1000));
}

/**
 * Check if it's a new day in Turkey timezone based on 03:00 AM reset
 */
export function isNewTurkeyDay(lastDate: string): boolean {
  const currentResetDate = getTurkeyResetDate();
  return lastDate !== currentResetDate;
}