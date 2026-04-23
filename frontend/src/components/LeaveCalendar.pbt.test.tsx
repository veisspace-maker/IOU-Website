import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { isWeekend } from 'date-fns';
import { getWeekdaysInRange } from './LeaveCalendar.test';

/**
 * Property-Based Test for Selection Range Validity
 * Validates: Requirements 2.1, 2.2
 */
describe('getWeekdaysInRange - Property-Based Tests', () => {
  it('selected dates are always valid weekdays in range', () => {
    fc.assert(
      fc.property(
        // Generate two arbitrary dates
        fc.date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) }),
        fc.date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) }),
        (date1, date2) => {
          const result = getWeekdaysInRange(date1, date2);

          // Determine actual start and end (function handles order)
          const start = date1 < date2 ? date1 : date2;
          const end = date1 < date2 ? date2 : date1;

          // Property 1: All returned dates are weekdays
          const allWeekdays = result.every(date => !isWeekend(date));

          // Property 2: All dates are within range
          const allInRange = result.every(date => date >= start && date <= end);

          // Property 3: No duplicate dates
          const uniqueDates = new Set(result.map(d => d.getTime()));
          const noDuplicates = uniqueDates.size === result.length;

          // Property 4: Dates are sorted
          const isSorted = result.every((date, i) => {
            if (i === 0) return true;
            return date >= result[i - 1];
          });

          return allWeekdays && allInRange && noDuplicates && isSorted;
        }
      ),
      { numRuns: 1000 } // Run 1000 random test cases
    );
  });

  it('result length is consistent with date range', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) }),
        fc.date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) }),
        (date1, date2) => {
          const result = getWeekdaysInRange(date1, date2);

          // Determine actual start and end
          const start = date1 < date2 ? date1 : date2;
          const end = date1 < date2 ? date2 : date1;

          // Calculate expected maximum weekdays
          const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

          // Result should never exceed total days in range
          const lengthValid = result.length <= daysDiff;

          // Result should never exceed theoretical max weekdays (5/7 of total days + buffer)
          const maxWeekdays = Math.ceil(daysDiff * 5 / 7) + 2; // +2 for edge cases
          const lengthReasonable = result.length <= maxWeekdays;

          return lengthValid && lengthReasonable;
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('same date returns single element or empty array', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) }),
        (date) => {
          const result = getWeekdaysInRange(date, date);

          // If date is a weekday, should return array with 1 element
          // If date is a weekend, should return empty array
          if (isWeekend(date)) {
            return result.length === 0;
          } else {
            return result.length === 1 && result[0].getTime() === date.getTime();
          }
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('reversed dates produce same result as forward dates', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) }),
        fc.date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) }),
        (date1, date2) => {
          const forward = getWeekdaysInRange(date1, date2);
          const backward = getWeekdaysInRange(date2, date1);

          // Both should produce identical results
          if (forward.length !== backward.length) return false;

          return forward.every((date, i) => 
            date.getTime() === backward[i].getTime()
          );
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('result never contains Saturday or Sunday', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) }),
        fc.date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) }),
        (date1, date2) => {
          const result = getWeekdaysInRange(date1, date2);

          // Check that no date is Saturday (6) or Sunday (0)
          return result.every(date => {
            const day = date.getDay();
            return day !== 0 && day !== 6;
          });
        }
      ),
      { numRuns: 1000 }
    );
  });
});
