import { calculateNetDebt } from './DebtCalculator';
import { Transaction } from '../../types/debtTrackerV2';

describe('DebtCalculator', () => {
  describe('calculateNetDebt', () => {
    // Helper function to create test transactions
    const createTransaction = (
      from: 'lev' | 'danik' | '2masters',
      to: 'lev' | 'danik' | '2masters',
      amount: number,
      timestamp: number = Date.now()
    ): Transaction => ({
      id: `test-${Math.random()}`,
      from,
      to,
      amount,
      timestamp,
    });

    describe('Direct transactions between Lev and Danik', () => {
      it('should calculate debt when lev pays danik', () => {
        const transactions = [createTransaction('lev', 'danik', 100)];
        const result = calculateNetDebt(transactions);
        
        expect(result.debtor).toBe('danik');
        expect(result.creditor).toBe('lev');
        expect(result.amount).toBe(100);
      });

      it('should calculate debt when danik pays lev', () => {
        const transactions = [createTransaction('danik', 'lev', 50)];
        const result = calculateNetDebt(transactions);
        
        expect(result.debtor).toBe('lev');
        expect(result.creditor).toBe('danik');
        expect(result.amount).toBe(50);
      });

      it('should sum multiple direct transactions', () => {
        const transactions = [
          createTransaction('lev', 'danik', 100),
          createTransaction('lev', 'danik', 50),
        ];
        const result = calculateNetDebt(transactions);
        
        expect(result.debtor).toBe('danik');
        expect(result.creditor).toBe('lev');
        expect(result.amount).toBe(150);
      });

      it('should calculate net debt when transactions go both ways', () => {
        const transactions = [
          createTransaction('lev', 'danik', 100),
          createTransaction('danik', 'lev', 30),
        ];
        const result = calculateNetDebt(transactions);
        
        expect(result.debtor).toBe('danik');
        expect(result.creditor).toBe('lev');
        expect(result.amount).toBe(70);
      });
    });

    describe('Transactions with 2masters (Lev side)', () => {
      it('should calculate debt when lev pays 2masters', () => {
        const transactions = [createTransaction('lev', '2masters', 100)];
        const result = calculateNetDebt(transactions);
        
        expect(result.debtor).toBe('danik');
        expect(result.creditor).toBe('lev');
        expect(result.amount).toBe(50);
      });

      it('should calculate debt when 2masters pays lev', () => {
        const transactions = [createTransaction('2masters', 'lev', 100)];
        const result = calculateNetDebt(transactions);
        
        expect(result.debtor).toBe('lev');
        expect(result.creditor).toBe('danik');
        expect(result.amount).toBe(50);
      });
    });

    describe('Transactions with 2masters (Danik side)', () => {
      it('should calculate debt when danik pays 2masters', () => {
        const transactions = [createTransaction('danik', '2masters', 100)];
        const result = calculateNetDebt(transactions);
        
        expect(result.debtor).toBe('lev');
        expect(result.creditor).toBe('danik');
        expect(result.amount).toBe(50);
      });

      it('should calculate debt when 2masters pays danik', () => {
        const transactions = [createTransaction('2masters', 'danik', 100)];
        const result = calculateNetDebt(transactions);
        
        expect(result.debtor).toBe('danik');
        expect(result.creditor).toBe('lev');
        expect(result.amount).toBe(50);
      });
    });

    describe('Edge cases', () => {
      it('should return no debt for empty transaction list', () => {
        const result = calculateNetDebt([]);
        
        expect(result.debtor).toBe('none');
        expect(result.creditor).toBe('none');
        expect(result.amount).toBe(0);
      });

      it('should return no debt when transactions cancel out', () => {
        const transactions = [
          createTransaction('lev', 'danik', 100),
          createTransaction('danik', 'lev', 100),
        ];
        const result = calculateNetDebt(transactions);
        
        expect(result.debtor).toBe('none');
        expect(result.creditor).toBe('none');
        expect(result.amount).toBe(0);
      });

      it('should handle very large amounts', () => {
        const transactions = [createTransaction('lev', 'danik', 1000000)];
        const result = calculateNetDebt(transactions);
        
        expect(result.debtor).toBe('danik');
        expect(result.creditor).toBe('lev');
        expect(result.amount).toBe(1000000);
      });

      it('should handle very small amounts', () => {
        const transactions = [createTransaction('lev', 'danik', 0.01)];
        const result = calculateNetDebt(transactions);
        
        expect(result.debtor).toBe('danik');
        expect(result.creditor).toBe('lev');
        expect(result.amount).toBe(0.01);
      });

      it('should handle decimal amounts with 2masters', () => {
        const transactions = [createTransaction('lev', '2masters', 100.50)];
        const result = calculateNetDebt(transactions);
        
        expect(result.debtor).toBe('danik');
        expect(result.creditor).toBe('lev');
        expect(result.amount).toBe(50.25);
      });
    });

    describe('Complex scenarios', () => {
      it('should handle mixed transaction types', () => {
        const transactions = [
          createTransaction('lev', 'danik', 100),      // Danik owes Lev 100
          createTransaction('danik', '2masters', 60),  // Lev owes Danik 30
          createTransaction('2masters', 'lev', 40),    // Lev owes Danik 20
        ];
        const result = calculateNetDebt(transactions);
        
        // Net: Danik owes Lev 100, Lev owes Danik 50 = Danik owes Lev 50
        expect(result.debtor).toBe('danik');
        expect(result.creditor).toBe('lev');
        expect(result.amount).toBe(50);
      });

      it('should handle all six transaction types', () => {
        const transactions = [
          createTransaction('lev', 'danik', 100),
          createTransaction('danik', 'lev', 50),
          createTransaction('lev', '2masters', 80),
          createTransaction('2masters', 'lev', 60),
          createTransaction('danik', '2masters', 40),
          createTransaction('2masters', 'danik', 20),
        ];
        const result = calculateNetDebt(transactions);
        
        // lev → danik: -100
        // danik → lev: +50
        // lev → 2masters: -40
        // 2masters → lev: +30
        // danik → 2masters: +20
        // 2masters → danik: -10
        // Total: -50 (Danik owes Lev 50)
        expect(result.debtor).toBe('danik');
        expect(result.creditor).toBe('lev');
        expect(result.amount).toBe(50);
      });

      it('should process transactions in order', () => {
        const transactions = [
          createTransaction('lev', 'danik', 100, 1000),
          createTransaction('danik', 'lev', 50, 2000),
          createTransaction('lev', 'danik', 30, 3000),
        ];
        const result = calculateNetDebt(transactions);
        
        // Order shouldn't matter for final result
        expect(result.debtor).toBe('danik');
        expect(result.creditor).toBe('lev');
        expect(result.amount).toBe(80);
      });
    });
  });
});
