/**
 * Date utility functions for timezone-consistent date handling
 * All dates in the application use the company timezone
 */

// Company timezone - should match backend DB_TIMEZONE
// Using type assertion for Vite env variables
export const COMPANY_TIMEZONE = (import.meta as any).env?.VITE_COMPANY_TIMEZONE || 'Australia/Melbourne';

/**
 * Format a date string to YYYY-MM-DD in the company timezone
 */
export function formatDateForInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Use toLocaleDateString with company timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: COMPANY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  return formatter.format(d);
}

/**
 * Format a date for display in the company timezone (dd/mm/yyyy format)
 */
export function formatDateForDisplay(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: COMPANY_TIMEZONE,
    year: 'numeric',
    month: format === 'long' ? 'long' : '2-digit',
    day: '2-digit',
  };
  
  return new Intl.DateTimeFormat('en-AU', options).format(d);
}

/**
 * Get current date in the company timezone
 */
export function getCurrentDateInCompanyTimezone(): Date {
  // Get current time in company timezone
  const formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: COMPANY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(new Date());
  const dateParts: Record<string, string> = {};
  
  parts.forEach(part => {
    if (part.type !== 'literal') {
      dateParts[part.type] = part.value;
    }
  });
  
  // Create date in company timezone
  return new Date(
    `${dateParts.year}-${dateParts.month}-${dateParts.day}T${dateParts.hour}:${dateParts.minute}:${dateParts.second}`
  );
}

/**
 * Parse a date string ensuring it's interpreted in the company timezone
 */
export function parseDateInCompanyTimezone(dateString: string): Date {
  // If it's already a full ISO string with timezone, use it directly
  if (dateString.includes('T') && (dateString.includes('Z') || dateString.includes('+'))) {
    return new Date(dateString);
  }
  
  // Otherwise, treat it as a date in the company timezone
  // Add time component to ensure it's interpreted correctly
  const dateOnly = dateString.split('T')[0];
  return new Date(`${dateOnly}T12:00:00`);
}

/**
 * Check if two dates are the same day in the company timezone
 */
export function isSameDayInCompanyTimezone(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  return formatDateForInput(d1) === formatDateForInput(d2);
}

/**
 * Get the start of today in the company timezone
 */
export function getTodayInCompanyTimezone(): string {
  return formatDateForInput(getCurrentDateInCompanyTimezone());
}
