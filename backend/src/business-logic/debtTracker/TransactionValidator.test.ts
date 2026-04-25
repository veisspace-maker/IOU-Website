/**
 * Unit tests for TransactionValidator
 * 
 * Tests validation logic for transaction data including:
 * - Valid entity names
 * - Self-transaction prevention
 * - Positive amount validation
 * - Valid timestamp validation
 */

import { describe, it, expect } from 'vitest';
import { validate } from './TransactionValidator';
import type { Transaction } from '../../types/debtTracker';

describe('TransactionValidator', () => {
  describe('validate', () => {
    it('should return valid for a correct transaction', () => {
      const transaction: Omit<Transaction, 'id'> = {
        from: 'lev',
        to: 'danik',
        amount: 100,
        timestamp: Date.now()
      };

      const result = validate(transaction);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept all valid entity combinations', () => {
      const validCombinations = [
        { from: 'lev' as const, to: 'danik' as const },
        { from: 'lev' as const, to: '2masters' as const },
        { from: 'danik' as const, to: 'lev' as const },
        { from: 'danik' as const, to: '2masters' as const },
        { from: '2masters' as const, to: 'lev' as const },
        { from: '2masters' as const, to: 'danik' as const }
      ];

      validCombinations.forEach(({ from, to }) => {
        const transaction: Omit<Transaction, 'id'> = {
          from,
          to,
          amount: 50,
          timestamp: Date.now()
        };

        const result = validate(transaction);
        expect(result.valid).toBe(true);
      });
    });

    describe('entity validation', () => {
      it('should reject invalid from entity', () => {
        const transaction = {
          from: 'invalid' as any,
          to: 'danik' as const,
          amount: 100,
          timestamp: Date.now()
        };

        const result = validate(transaction);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('From entity must be one of: lev, danik, 2masters');
      });

      it('should reject invalid to entity', () => {
        const transaction = {
          from: 'lev' as const,
          to: 'invalid' as any,
          amount: 100,
          timestamp: Date.now()
        };

        const result = validate(transaction);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('To entity must be one of: lev, danik, 2masters');
      });

      it('should reject both invalid entities', () => {
        const transaction = {
          from: 'invalid1' as any,
          to: 'invalid2' as any,
          amount: 100,
          timestamp: Date.now()
        };

        const result = validate(transaction);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('From entity must be one of: lev, danik, 2masters');
        expect(result.errors).toContain('To entity must be one of: lev, danik, 2masters');
      });
    });

    describe('self-transaction validation', () => {
      it('should reject transaction from lev to lev', () => {
        const transaction: Omit<Transaction, 'id'> = {
          from: 'lev',
          to: 'lev',
          amount: 100,
          timestamp: Date.now()
        };

        const result = validate(transaction);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Cannot create transaction from an entity to itself');
      });

      it('should reject transaction from danik to danik', () => {
        const transaction: Omit<Transaction, 'id'> = {
          from: 'danik',
          to: 'danik',
          amount: 100,
          timestamp: Date.now()
        };

        const result = validate(transaction);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Cannot create transaction from an entity to itself');
      });

      it('should reject transaction from 2masters to 2masters', () => {
        const transaction: Omit<Transaction, 'id'> = {
          from: '2masters',
          to: '2masters',
          amount: 100,
          timestamp: Date.now()
        };

        const result = validate(transaction);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Cannot create transaction from an entity to itself');
      });
    });

    describe('amount validation', () => {
      it('should reject zero amount', () => {
        const transaction: Omit<Transaction, 'id'> = {
          from: 'lev',
          to: 'danik',
          amount: 0,
          timestamp: Date.now()
        };

        const result = validate(transaction);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Amount must be a positive number');
      });

      it('should reject negative amount', () => {
        const transaction: Omit<Transaction, 'id'> = {
          from: 'lev',
          to: 'danik',
          amount: -50,
          timestamp: Date.now()
        };

        const result = validate(transaction);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Amount must be a positive number');
      });

      it('should reject NaN amount', () => {
        const transaction: Omit<Transaction, 'id'> = {
          from: 'lev',
          to: 'danik',
          amount: NaN,
          timestamp: Date.now()
        };

        const result = validate(transaction);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Amount must be a positive number');
      });

      it('should accept decimal amounts', () => {
        const transaction: Omit<Transaction, 'id'> = {
          from: 'lev',
          to: 'danik',
          amount: 99.99,
          timestamp: Date.now()
        };

        const result = validate(transaction);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept very large amounts', () => {
        const transaction: Omit<Transaction, 'id'> = {
          from: 'lev',
          to: 'danik',
          amount: 999999999.99,
          timestamp: Date.now()
        };

        const result = validate(transaction);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept very small positive amounts', () => {
        const transaction: Omit<Transaction, 'id'> = {
          from: 'lev',
          to: 'danik',
          amount: 0.01,
          timestamp: Date.now()
        };

        const result = validate(transaction);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('timestamp validation', () => {
      it('should accept valid timestamp', () => {
        const transaction: Omit<Transaction, 'id'> = {
          from: 'lev',
          to: 'danik',
          amount: 100,
          timestamp: Date.now()
        };

        const result = validate(transaction);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject negative timestamp', () => {
        const transaction: Omit<Transaction, 'id'> = {
          from: 'lev',
          to: 'danik',
          amount: 100,
          timestamp: -1
        };

        const result = validate(transaction);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Timestamp must be a valid number');
      });

      it('should reject NaN timestamp', () => {
        const transaction: Omit<Transaction, 'id'> = {
          from: 'lev',
          to: 'danik',
          amount: 100,
          timestamp: NaN
        };

        const result = validate(transaction);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Timestamp must be a valid number');
      });

      it('should accept zero timestamp (epoch)', () => {
        const transaction: Omit<Transaction, 'id'> = {
          from: 'lev',
          to: 'danik',
          amount: 100,
          timestamp: 0
        };

        const result = validate(transaction);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept future timestamps', () => {
        const transaction: Omit<Transaction, 'id'> = {
          from: 'lev',
          to: 'danik',
          amount: 100,
          timestamp: Date.now() + 1000000
        };

        const result = validate(transaction);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('multiple validation errors', () => {
      it('should return all validation errors', () => {
        const transaction = {
          from: 'invalid' as any,
          to: 'lev' as const,
          amount: -50,
          timestamp: NaN
        };

        const result = validate(transaction);

        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(3);
        expect(result.errors).toContain('From entity must be one of: lev, danik, 2masters');
        expect(result.errors).toContain('Amount must be a positive number');
        expect(result.errors).toContain('Timestamp must be a valid number');
      });

      it('should return self-transaction error along with other errors', () => {
        const transaction: Omit<Transaction, 'id'> = {
          from: 'lev',
          to: 'lev',
          amount: -100,
          timestamp: -1
        };

        const result = validate(transaction);

        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(3);
        expect(result.errors).toContain('Cannot create transaction from an entity to itself');
        expect(result.errors).toContain('Amount must be a positive number');
        expect(result.errors).toContain('Timestamp must be a valid number');
      });
    });

    describe('optional description field', () => {
      it('should accept transaction with description', () => {
        const transaction: Omit<Transaction, 'id'> = {
          from: 'lev',
          to: 'danik',
          amount: 100,
          timestamp: Date.now(),
          description: 'Test transaction'
        };

        const result = validate(transaction);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept transaction without description', () => {
        const transaction: Omit<Transaction, 'id'> = {
          from: 'lev',
          to: 'danik',
          amount: 100,
          timestamp: Date.now()
        };

        const result = validate(transaction);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });
});
