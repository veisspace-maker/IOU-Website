import { calculateNetDebt, Transaction, NetDebt } from './debtCalculations';

describe('calculateNetDebt', () => {
  // Helper function to create test transactions
  const createTransaction = (
    id: number,
    from: 'Lev' | 'Danik' | '2_Masters',
    to: 'Lev' | 'Danik' | '2_Masters',
    amount: number
  ): Transaction => ({
    id,
    from,
    to,
    amount,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe('Direct transactions between Lev and Danik', () => {
    it('should calculate debt when Lev pays Danik', () => {
      const transactions = [createTransaction(1, 'Lev', 'Danik', 100)];
      const result = calculateNetDebt(transactions);
      
      expect(result).toEqual({
        debtor: 'Danik',
        creditor: 'Lev',
        amount: 100,
      });
    });

    it('should calculate debt when Danik pays Lev', () => {
      const transactions = [createTransaction(1, 'Danik', 'Lev', 50)];
      const result = calculateNetDebt(transactions);
      
      expect(result).toEqual({
        debtor: 'Lev',
        creditor: 'Danik',
        amount: 50,
      });
    });

    it('should calculate net debt with multiple direct transactions', () => {
      const transactions = [
        createTransaction(1, 'Lev', 'Danik', 100),
        createTransaction(2, 'Danik', 'Lev', 30),
      ];
      const result = calculateNetDebt(transactions);
      
      // Lev paid 100, Danik paid 30, so Danik owes Lev 70
      expect(result).toEqual({
        debtor: 'Danik',
        creditor: 'Lev',
        amount: 70,
      });
    });

    it('should return zero debt when payments are equal', () => {
      const transactions = [
        createTransaction(1, 'Lev', 'Danik', 100),
        createTransaction(2, 'Danik', 'Lev', 100),
      ];
      const result = calculateNetDebt(transactions);
      
      expect(result).toEqual({
        debtor: null,
        creditor: null,
        amount: 0,
      });
    });
  });

  describe('Transactions involving 2_Masters', () => {
    it('should calculate debt when Lev pays to 2_Masters', () => {
      const transactions = [createTransaction(1, 'Lev', '2_Masters', 100)];
      const result = calculateNetDebt(transactions);
      
      // Lev paid for both, Danik owes Lev half (50)
      expect(result).toEqual({
        debtor: 'Danik',
        creditor: 'Lev',
        amount: 50,
      });
    });

    it('should calculate debt when 2_Masters pays to Lev', () => {
      const transactions = [createTransaction(1, '2_Masters', 'Lev', 100)];
      const result = calculateNetDebt(transactions);
      
      // Lev received from shared, Danik paid Lev's half (50)
      expect(result).toEqual({
        debtor: 'Danik',
        creditor: 'Lev',
        amount: 50,
      });
    });

    it('should calculate debt when Danik pays to 2_Masters', () => {
      const transactions = [createTransaction(1, 'Danik', '2_Masters', 100)];
      const result = calculateNetDebt(transactions);
      
      // Danik paid for both, Lev owes Danik half (50)
      expect(result).toEqual({
        debtor: 'Lev',
        creditor: 'Danik',
        amount: 50,
      });
    });

    it('should calculate debt when 2_Masters pays to Danik', () => {
      const transactions = [createTransaction(1, '2_Masters', 'Danik', 100)];
      const result = calculateNetDebt(transactions);
      
      // Danik received from shared, Lev paid Danik's half (50)
      expect(result).toEqual({
        debtor: 'Lev',
        creditor: 'Danik',
        amount: 50,
      });
    });
  });

  describe('Mixed transaction types', () => {
    it('should handle combination of direct and 2_Masters transactions', () => {
      const transactions = [
        createTransaction(1, 'Lev', 'Danik', 100),      // Danik owes Lev 100
        createTransaction(2, 'Danik', '2_Masters', 60), // Lev owes Danik 30
      ];
      const result = calculateNetDebt(transactions);
      
      // Net: Danik owes Lev 70
      expect(result).toEqual({
        debtor: 'Danik',
        creditor: 'Lev',
        amount: 70,
      });
    });

    it('should handle multiple 2_Masters transactions', () => {
      const transactions = [
        createTransaction(1, 'Lev', '2_Masters', 100),    // Danik owes Lev 50
        createTransaction(2, 'Danik', '2_Masters', 80),   // Lev owes Danik 40
      ];
      const result = calculateNetDebt(transactions);
      
      // Net: Danik owes Lev 10
      expect(result).toEqual({
        debtor: 'Danik',
        creditor: 'Lev',
        amount: 10,
      });
    });

    it('should handle complex scenario with all transaction types', () => {
      const transactions = [
        createTransaction(1, 'Lev', 'Danik', 100),        // Danik owes Lev 100
        createTransaction(2, 'Danik', 'Lev', 50),         // Lev owes Danik 50
        createTransaction(3, 'Lev', '2_Masters', 60),     // Danik owes Lev 30
        createTransaction(4, '2_Masters', 'Danik', 40),   // Lev owes Danik 20
      ];
      const result = calculateNetDebt(transactions);
      
      // Net: 100 - 50 + 30 - 20 = 60, Danik owes Lev
      expect(result).toEqual({
        debtor: 'Danik',
        creditor: 'Lev',
        amount: 60,
      });
    });
  });

  describe('Edge cases', () => {
    it('should return zero debt for empty transaction list', () => {
      const transactions: Transaction[] = [];
      const result = calculateNetDebt(transactions);
      
      expect(result).toEqual({
        debtor: null,
        creditor: null,
        amount: 0,
      });
    });

    it('should handle large transaction amounts', () => {
      const transactions = [createTransaction(1, 'Lev', 'Danik', 999999.99)];
      const result = calculateNetDebt(transactions);
      
      expect(result).toEqual({
        debtor: 'Danik',
        creditor: 'Lev',
        amount: 999999.99,
      });
    });

    it('should handle small decimal amounts', () => {
      const transactions = [createTransaction(1, 'Lev', 'Danik', 0.01)];
      const result = calculateNetDebt(transactions);
      
      expect(result).toEqual({
        debtor: 'Danik',
        creditor: 'Lev',
        amount: 0.01,
      });
    });

    it('should handle fractional amounts from 2_Masters splits', () => {
      const transactions = [createTransaction(1, 'Lev', '2_Masters', 33.33)];
      const result = calculateNetDebt(transactions);
      
      expect(result).toEqual({
        debtor: 'Danik',
        creditor: 'Lev',
        amount: 16.665,
      });
    });

    it('should handle many small transactions', () => {
      const transactions = Array.from({ length: 100 }, (_, i) =>
        createTransaction(i, i % 2 === 0 ? 'Lev' : 'Danik', i % 2 === 0 ? 'Danik' : 'Lev', 1)
      );
      const result = calculateNetDebt(transactions);
      
      // 50 transactions each way, should be zero
      expect(result).toEqual({
        debtor: null,
        creditor: null,
        amount: 0,
      });
    });
  });
});
