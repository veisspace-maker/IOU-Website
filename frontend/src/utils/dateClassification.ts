/**
 * Utility functions for classifying dates as holidays, closed dates, or both
 * Implements priority handling: when a date is both a holiday and closed date,
 * prioritize closed date but show both in the UI
 */

interface PublicHoliday {
  id: string;
  name: string;
  date: string;
}

interface ClosedDate {
  id: string;
  startDate: string;
  endDate: string;
  note?: string;
}

export interface DateClassification {
  isHoliday: boolean;
  isClosedDate: boolean;
  holidayName?: string;
  closedDateNote?: string;
  priority: 'closed' | 'holiday' | 'both' | 'none';
  displayLabel: string;
}

/**
 * Check if a date falls within a closed date period
 */
function isDateInClosedPeriod(date: Date, closedDate: ClosedDate): boolean {
  const checkDate = new Date(date);
  const startDate = new Date(closedDate.startDate);
  const endDate = new Date(closedDate.endDate);
  
  // Set all to midnight for date-only comparison
  checkDate.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  
  return checkDate >= startDate && checkDate <= endDate;
}

/**
 * Check if a date matches a holiday
 */
function isDateHoliday(date: Date, holiday: PublicHoliday): boolean {
  const checkDate = new Date(date);
  const holidayDate = new Date(holiday.date);
  
  // Set to midnight for date-only comparison
  checkDate.setHours(0, 0, 0, 0);
  holidayDate.setHours(0, 0, 0, 0);
  
  return checkDate.getTime() === holidayDate.getTime();
}

/**
 * Classify a date based on holidays and closed dates
 * Returns classification with priority handling
 */
export function classifyDate(
  date: Date | string,
  holidays: PublicHoliday[],
  closedDates: ClosedDate[]
): DateClassification {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  
  // Check if it's a holiday
  const matchingHoliday = holidays.find(h => isDateHoliday(checkDate, h));
  const isHoliday = !!matchingHoliday;
  
  // Check if it's a closed date
  const matchingClosedDate = closedDates.find(c => isDateInClosedPeriod(checkDate, c));
  const isClosedDate = !!matchingClosedDate;
  
  // Determine priority and display label
  let priority: 'closed' | 'holiday' | 'both' | 'none';
  let displayLabel: string;
  
  if (isClosedDate && isHoliday) {
    // Both: prioritize closed but show both
    priority = 'both';
    displayLabel = `${matchingClosedDate?.note || 'Company Closed'} (${matchingHoliday?.name})`;
  } else if (isClosedDate) {
    priority = 'closed';
    displayLabel = matchingClosedDate?.note || 'Company Closed';
  } else if (isHoliday) {
    priority = 'holiday';
    displayLabel = matchingHoliday?.name || 'Public Holiday';
  } else {
    priority = 'none';
    displayLabel = '';
  }
  
  return {
    isHoliday,
    isClosedDate,
    holidayName: matchingHoliday?.name,
    closedDateNote: matchingClosedDate?.note,
    priority,
    displayLabel,
  };
}

/**
 * Check if a date should be disabled in date pickers
 * (weekends, holidays, or closed dates)
 */
export function isDateDisabled(
  date: Date | string,
  holidays: PublicHoliday[],
  closedDates: ClosedDate[]
): boolean {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  
  // Check if it's a weekend
  const dayOfWeek = checkDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  
  if (isWeekend) {
    return true;
  }
  
  // Check if it's a holiday or closed date
  const classification = classifyDate(checkDate, holidays, closedDates);
  return classification.isHoliday || classification.isClosedDate;
}

/**
 * Get all disabled dates in a date range
 */
export function getDisabledDatesInRange(
  startDate: Date | string,
  endDate: Date | string,
  holidays: PublicHoliday[],
  closedDates: ClosedDate[]
): Date[] {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  const disabledDates: Date[] = [];
  const currentDate = new Date(start);
  
  while (currentDate <= end) {
    if (isDateDisabled(currentDate, holidays, closedDates)) {
      disabledDates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return disabledDates;
}
