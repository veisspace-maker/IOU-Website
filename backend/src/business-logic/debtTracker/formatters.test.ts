import { formatDebtDisplay, formatCurrency, formatEntityName, formatTimestamp } from './formatters';
import { DebtResult } from '../../types/debtTrackerV2';

describe('formatters', () => {
  describe('formatDebtDisplay', () => {
    it('should format debt when Danik owes Lev', () => {
      const result: DebtResult = {
        debtor: 'danik',
        creditor: 'lev',
        amount: 50.00
      };
      expect(formatDebtDisplay(result)).toBe('Danik owes Lev $50.00');
    });

    it('should format debt when Lev owes Danik', () => {
      const result: DebtResult = {
        debtor: 'lev',
        creditor: 'danik',
        amount: 75.50
      };
      expect(formatDebtDisplay(result)).toBe('Lev owes Danik $75.50');
    });

    it('should display "No debt" when debtor is none', () => {
      const result: DebtResult = {
        debtor: 'none',
        creditor: 'none',
        amount: 0
      };
      expect(formatDebtDisplay(result)).toBe('No debt');
    });

    it('should display "No debt" when amount is zero', () => {
      const result: DebtResult = {
        debtor: 'lev',
        creditor: 'danik',
        amount: 0
      };
      expect(formatDebtDisplay(result)).toBe('No debt');
    });

    it('should format very large amounts correctly', () => {
      const result: DebtResult = {
        debtor: 'danik',
        creditor: 'lev',
        amount: 999999.99
      };
      expect(formatDebtDisplay(result)).toBe('Danik owes Lev $999999.99');
    });

    it('should format very small amounts correctly', () => {
      const result: DebtResult = {
        debtor: 'lev',
        creditor: 'danik',
        amount: 0.01
      };
      expect(formatDebtDisplay(result)).toBe('Lev owes Danik $0.01');
    });
  });

  describe('formatCurrency', () => {
    it('should format whole numbers with 2 decimal places', () => {
      expect(formatCurrency(50)).toBe('$50.00');
    });

    it('should format numbers with 1 decimal place', () => {
      expect(formatCurrency(50.5)).toBe('$50.50');
    });

    it('should format numbers with 2 decimal places', () => {
      expect(formatCurrency(50.75)).toBe('$50.75');
    });

    it('should round numbers with more than 2 decimal places', () => {
      expect(formatCurrency(50.755)).toBe('$50.76');
      expect(formatCurrency(50.754)).toBe('$50.75');
    });

    it('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should format very large amounts', () => {
      expect(formatCurrency(999999.99)).toBe('$999999.99');
    });

    it('should format very small amounts', () => {
      expect(formatCurrency(0.01)).toBe('$0.01');
    });
  });

  describe('formatEntityName', () => {
    it('should convert "lev" to "Lev"', () => {
      expect(formatEntityName('lev')).toBe('Lev');
    });

    it('should convert "danik" to "Danik"', () => {
      expect(formatEntityName('danik')).toBe('Danik');
    });

    it('should convert "2masters" to "2 Masters"', () => {
      expect(formatEntityName('2masters')).toBe('2 Masters');
    });
  });

  describe('formatTimestamp', () => {
    it('should format a timestamp to human-readable format', () => {
      // January 15, 2024 at 3:45 PM
      const timestamp = new Date('2024-01-15T15:45:00').getTime();
      const formatted = formatTimestamp(timestamp);
      
      // Check that it contains the expected components
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
      expect(formatted).toContain('3:45');
      expect(formatted).toContain('PM');
    });

    it('should format morning timestamps with AM', () => {
      // January 15, 2024 at 9:30 AM
      const timestamp = new Date('2024-01-15T09:30:00').getTime();
      const formatted = formatTimestamp(timestamp);
      
      expect(formatted).toContain('9:30');
      expect(formatted).toContain('AM');
    });

    it('should format midnight correctly', () => {
      // January 15, 2024 at midnight
      const timestamp = new Date('2024-01-15T00:00:00').getTime();
      const formatted = formatTimestamp(timestamp);
      
      expect(formatted).toContain('12:00');
      expect(formatted).toContain('AM');
    });

    it('should format noon correctly', () => {
      // January 15, 2024 at noon
      const timestamp = new Date('2024-01-15T12:00:00').getTime();
      const formatted = formatTimestamp(timestamp);
      
      expect(formatted).toContain('12:00');
      expect(formatted).toContain('PM');
    });

    it('should format epoch timestamp', () => {
      const timestamp = 0;
      const formatted = formatTimestamp(timestamp);
      
      // Should contain date components (exact format may vary by timezone)
      // Epoch is either Dec 31, 1969 or Jan 1, 1970 depending on timezone
      expect(formatted).toMatch(/1969|1970/);
      expect(formatted).toMatch(/Dec|Jan/);
    });

    it('should format far future timestamp', () => {
      // January 1, 2099 at 12:00 PM
      const timestamp = new Date('2099-01-01T12:00:00').getTime();
      const formatted = formatTimestamp(timestamp);
      
      expect(formatted).toContain('2099');
      expect(formatted).toContain('Jan');
    });
  });
});
