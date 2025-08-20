import { format, parse, isValid, addDays, differenceInDays, differenceInYears } from 'date-fns';
import { DATE_FORMAT, TIME_FORMAT, DATE_TIME_FORMAT } from '../config/constants';
import i18n from '../i18n';

/**
 * Format a date to display format
 * @param date Date to format
 * @param formatString Format string to use
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | null | undefined, formatString: string = DATE_FORMAT): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, formatString);
};

/**
 * Format a date using the browser's locale API with proper error handling
 * @param date Date to format
 * @param options Intl.DateTimeFormatOptions to customize the output
 * @returns Formatted date string using the current locale
 */
export const formatLocalizedDate = (date: Date | string | null | undefined, options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) return '';
  
  try {
    // Use i18n.language as the locale, with fallback to 'en'
    return dateObj.toLocaleDateString(i18n.language || 'en', options);
  } catch (error) {
    console.error('Error formatting date with locale:', error);
    // Fallback to browser's default locale
    try {
      return dateObj.toLocaleDateString(undefined, options);
    } catch (fallbackError) {
      console.error('Error using fallback locale:', fallbackError);
      // Last resort fallback - just return the ISO string date part
      return dateObj.toISOString().split('T')[0];
    }
  }
};

/**
 * Format a time string
 * @param time Time string in HH:MM format
 * @returns Formatted time string
 */
export const formatTime = (time: string): string => {
  if (!time) return '';
  
  try {
    // Parse the time string (assuming it's in 24-hour format like "14:30")
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    return format(date, TIME_FORMAT);
  } catch (_error) {
    console.error('Error formatting time:', _error);
    return time; // Return the original time if parsing fails
  }
};

/**
 * Format a date and time
 * @param date Date object or string
 * @param time Time string in HH:MM format
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: Date | string, time?: string): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) return '';
  
  if (time) {
    const [hours, minutes] = time.split(':').map(Number);
    dateObj.setHours(hours, minutes, 0, 0);
  }
  
  return format(dateObj, DATE_TIME_FORMAT);
};

/**
 * Parse a date string to a Date object
 * @param dateString Date string to parse
 * @param formatString Format of the date string
 * @returns Parsed Date object or null if invalid
 */
export const parseDate = (dateString: string, formatString: string = DATE_FORMAT): Date | null => {
  try {
    const parsedDate = parse(dateString, formatString, new Date());
    return isValid(parsedDate) ? parsedDate : null;
  } catch (_error) {
    console.error('Error parsing date:', _error);
    return null;
  }
};

/**
 * Get age from date of birth
 * @param dateOfBirth Date of birth
 * @returns Age in years
 */
export const calculateAge = (dateOfBirth: Date | string | null | undefined): number => {
  if (!dateOfBirth) return 0;
  
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  if (!isValid(dob)) return 0;
  
  return differenceInYears(new Date(), dob);
};

/**
 * Get date range for a week
 * @param date Date in the week
 * @returns Object with start and end dates
 */
export const getWeekRange = (date: Date = new Date()): { start: Date; end: Date } => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  
  const start = new Date(date);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

/**
 * Get date range for a month
 * @param date Date in the month
 * @returns Object with start and end dates
 */
export const getMonthRange = (date: Date = new Date()): { start: Date; end: Date } => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

/**
 * Check if a date is today
 * @param date Date to check
 * @returns True if the date is today
 */
export const isToday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if a date is in the past
 * @param date Date to check
 * @returns True if the date is in the past
 */
export const isPastDate = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return dateObj < today;
};

/**
 * Get a list of dates between start and end dates
 * @param startDate Start date
 * @param endDate End date
 * @returns Array of dates
 */
export const getDatesBetween = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];
  const days = differenceInDays(endDate, startDate) + 1;
  
  for (let i = 0; i < days; i++) {
    const date = addDays(startDate, i);
    dates.push(date);
  }
  
  return dates;
};