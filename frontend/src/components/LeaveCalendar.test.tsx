import { describe, it, expect } from 'vitest';
import { addDays, isWeekend } from 'date-fns';

// Helper function to get weekdays in range (extracted for testing)
export const getWeekdaysInRange = (start: Date, end: Date): Date[] => {
  const dates: Date[] = [];
  // Ensure start is before end
  const actualStart = start < end ? start : end;
  const actualEnd = start < end ? end : start;
  let current = new Date(actualStart);

  while (current <= actualEnd) {
    if (!isWeekend(current)) {
      dates.push(new Date(current));
    }
    current = addDays(current, 1);
  }

  return dates;
};

describe('getWeekdaysInRange', () => {
  it('should return only weekdays', () => {
    // Monday to Friday
    const start = new Date(2024, 0, 1); // Monday, Jan 1, 2024
    const end = new Date(2024, 0, 5); // Friday, Jan 5, 2024
    const result = getWeekdaysInRange(start, end);

    expect(result.length).toBe(5);
    result.forEach(date => {
      expect(isWeekend(date)).toBe(false);
    });
  });

  it('should handle reversed date order', () => {
    const start = new Date(2024, 0, 5); // Friday
    const end = new Date(2024, 0, 1); // Monday
    const result = getWeekdaysInRange(start, end);

    expect(result.length).toBe(5);
    // Should be sorted from Monday to Friday
    expect(result[0].getDate()).toBe(1);
    expect(result[4].getDate()).toBe(5);
  });

  it('should return empty array for weekend-only range', () => {
    const start = new Date(2024, 0, 6); // Saturday
    const end = new Date(2024, 0, 7); // Sunday
    const result = getWeekdaysInRange(start, end);

    expect(result.length).toBe(0);
  });

  it('should handle single day range', () => {
    const date = new Date(2024, 0, 1); // Monday
    const result = getWeekdaysInRange(date, date);

    expect(result.length).toBe(1);
    expect(result[0].getDate()).toBe(1);
  });

  it('should handle multi-week range', () => {
    const start = new Date(2024, 0, 1); // Monday, Jan 1
    const end = new Date(2024, 0, 12); // Friday, Jan 12
    const result = getWeekdaysInRange(start, end);

    // 2 full weeks = 10 weekdays
    expect(result.length).toBe(10);
    result.forEach(date => {
      expect(isWeekend(date)).toBe(false);
    });
  });

  it('should skip weekends in the middle of range', () => {
    const start = new Date(2024, 0, 5); // Friday
    const end = new Date(2024, 0, 8); // Monday
    const result = getWeekdaysInRange(start, end);

    // Should only include Friday and Monday, skipping Sat/Sun
    expect(result.length).toBe(2);
    expect(result[0].getDate()).toBe(5); // Friday
    expect(result[1].getDate()).toBe(8); // Monday
  });

  it('should handle same weekday', () => {
    const monday = new Date(2024, 0, 1);
    const result = getWeekdaysInRange(monday, monday);

    expect(result.length).toBe(1);
    expect(result[0].getDay()).toBe(1); // Monday
  });

  it('should handle range starting on weekend', () => {
    const start = new Date(2024, 0, 6); // Saturday
    const end = new Date(2024, 0, 10); // Wednesday
    const result = getWeekdaysInRange(start, end);

    // Should include Mon, Tue, Wed (3 days)
    expect(result.length).toBe(3);
    expect(result[0].getDate()).toBe(8); // Monday
    expect(result[2].getDate()).toBe(10); // Wednesday
  });

  it('should handle range ending on weekend', () => {
    const start = new Date(2024, 0, 3); // Wednesday
    const end = new Date(2024, 0, 7); // Sunday
    const result = getWeekdaysInRange(start, end);

    // Should include Wed, Thu, Fri (3 days)
    expect(result.length).toBe(3);
    expect(result[0].getDate()).toBe(3); // Wednesday
    expect(result[2].getDate()).toBe(5); // Friday
  });
});
