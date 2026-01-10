/**
 * Date utilities for handling pure DATE (YYYY-MM-DD) without timezone conversion.
 * 
 * Problem: When using `new Date('2026-01-31')`, JavaScript interprets it as UTC midnight,
 * which can shift the date by -1 day when displayed in local timezone (e.g., Brazil UTC-3).
 * 
 * Solution: Parse dates as local time by appending 'T00:00:00' or manually parsing components.
 */

/**
 * Parse a date string (YYYY-MM-DD) as local date without timezone conversion.
 * This ensures the date displayed is exactly the date stored.
 */
export const parseLocalDate = (dateString: string): Date => {
  if (!dateString) {
    return new Date();
  }
  
  // If already a full ISO string with time, extract just the date part
  const datePart = dateString.split('T')[0];
  
  // Parse as local time by using the Date constructor with year, month, day
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};

/**
 * Format a date as YYYY-MM-DD string for database storage.
 * This ensures no timezone conversion occurs.
 */
export const formatDateForDB = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Check if a date string (YYYY-MM-DD) represents a past date.
 * Compares only the date part, ignoring time.
 */
export const isDatePast = (dateString: string): boolean => {
  const date = parseLocalDate(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
};

/**
 * Check if a date string (YYYY-MM-DD) is today.
 */
export const isDateToday = (dateString: string): boolean => {
  const date = parseLocalDate(dateString);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

/**
 * Get today's date as YYYY-MM-DD string.
 */
export const getTodayString = (): string => {
  return formatDateForDB(new Date());
};
