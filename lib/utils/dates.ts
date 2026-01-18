/**
 * Date formatting and manipulation utilities
 */

/**
 * Formats a date to a short format (e.g., "13 Aug")
 * 
 * @param date - Date string or Date object
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatShortDate(
  date: string | Date,
  options?: {
    includeYear?: boolean;
    locale?: string;
  }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }

  const includeYear = options?.includeYear ?? false;
  const locale = options?.locale ?? 'en-GB';

  if (includeYear) {
    return dateObj.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  return dateObj.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Formats a date to show day abbreviation and number (e.g., "SUN", "13")
 * 
 * @param date - Date string or Date object
 * @returns Object with day abbreviation and number
 */
export function formatDayInfo(date: string | Date): { abbreviation: string; number: string } {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return { abbreviation: '', number: '' };
  }

  const dayAbbrev = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const dayNumber = dateObj.getDate().toString();

  return {
    abbreviation: dayAbbrev,
    number: dayNumber,
  };
}

/**
 * Formats date and time (e.g., "13 Aug 10:03 am")
 * 
 * @param date - Date string or Date object
 * @param options - Formatting options
 * @returns Formatted date and time string
 */
export function formatDateTime(
  date: string | Date,
  options?: {
    includeSeconds?: boolean;
    use24Hour?: boolean;
  }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }

  const dateStr = formatShortDate(dateObj);
  const timeStr = formatTime(dateObj, options);

  return `${dateStr} ${timeStr}`;
}

/**
 * Formats time (e.g., "10:03 am" or "22:03")
 * 
 * @param date - Date string or Date object
 * @param options - Formatting options
 * @returns Formatted time string
 */
export function formatTime(
  date: string | Date,
  options?: {
    includeSeconds?: boolean;
    use24Hour?: boolean;
  }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const includeSeconds = options?.includeSeconds ?? false;
  const use24Hour = options?.use24Hour ?? false;

  if (use24Hour) {
    return dateObj.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: false,
    });
  }

  return dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: true,
  });
}

/**
 * Formats month and year (e.g., "August 2025" or "Aug 2025")
 * 
 * @param date - Date string or Date object
 * @param format - 'short' or 'long'
 * @returns Formatted month and year string
 */
export function formatMonthYear(date: string | Date, format: 'short' | 'long' = 'long'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }

  return dateObj.toLocaleDateString('en-US', {
    month: format === 'short' ? 'short' : 'long',
    year: 'numeric',
  });
}

/**
 * Gets the start and end dates of a month
 * 
 * @param date - Date string or Date object
 * @returns Object with start and end dates
 */
export function getMonthBounds(date: string | Date): { start: Date; end: Date } {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return { start, end };
}

/**
 * Gets the start and end dates of a day
 * 
 * @param date - Date string or Date object
 * @returns Object with start and end dates
 */
export function getDayBounds(date: string | Date): { start: Date; end: Date } {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const start = new Date(dateObj);
  start.setHours(0, 0, 0, 0);

  const end = new Date(dateObj);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Checks if a date is today
 */
export function isToday(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

/**
 * Checks if two dates are on the same day
 */
export function isSameDay(date1: string | Date, date2: string | Date): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
}

/**
 * Adds days to a date
 */
export function addDays(date: string | Date, days: number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const result = new Date(dateObj);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Adds months to a date
 */
export function addMonths(date: string | Date, months: number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const result = new Date(dateObj);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Gets an array of dates for a month
 * 
 * @param date - Date string or Date object
 * @returns Array of Date objects for each day in the month
 */
export function getDaysInMonth(date: string | Date): Date[] {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const { start, end } = getMonthBounds(dateObj);
  
  const days: Date[] = [];
  const current = new Date(start);

  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

/**
 * Gets an array of dates for a week centered around a date
 * 
 * @param date - Date string or Date object
 * @returns Array of Date objects for the week (7 days)
 */
export function getWeekDates(date: string | Date): Date[] {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const dayOfWeek = dateObj.getDay();
  const startOfWeek = addDays(dateObj, -dayOfWeek);
  
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(startOfWeek, i));
  }

  return days;
}
