/**
 * Basic type validation tests for Debt Tracker V2
 * 
 * These tests verify that the core types are correctly defined
 * and can be used as expected.
 */

import { describe, it, expect } from 'vitest';
import type { Entity, Transaction, DebtResult, ValidationResult } from './debtTracker';

describe('Debt Tracker Types', () => {
  describe('Entity type', () => {
    it('should accept valid entity values', () => {
      const lev: Entity = 'lev';
      const danik: Entity = 'danik';
      const twoMasters: Entity = '2masters';
      
      expect(lev).toBe('lev');
      expect(danik).toBe('danik');
      expect(twoMasters).toBe('2masters');
    });
  });

  describe('Transaction interface', () => {
    it('should create a valid transaction object', () => {
      const transaction: Transaction = {
        id: 'test-id-123',
        from: 'lev',
        to: 'danik',
        amount: 100.50,
        timestamp: Date.now(),
        description: 'Test transaction'
      };
      
      expect(transaction.id).toBe('test-id-123');
      expect(transaction.from).toBe('lev');
      expect(transaction.to).toBe('danik');
      expect(transaction.amount).toBe(100.50);
      expect(transaction.timestamp).toBeGreaterThan(0);
      expect(transaction.description).toBe('Test transaction');
    });

    it('should allow optional description', () => {
      const transaction: Transaction = {
        id: 'test-id-456',
        from: 'danik',
        to: '2masters',
        amount: 50.00,
        timestamp: Date.now()
      };
      
      expect(transaction.description).toBeUndefined();
    });
  });

  describe('DebtResult interface', () => {
    it('should create a valid debt result when Danik owes Lev', () => {
      const result: DebtResult = {
        debtor: 'danik',
        creditor: 'lev',
        amount: 75.25
      };
      
      expect(result.debtor).toBe('danik');
      expect(result.creditor).toBe('lev');
      expect(result.amount).toBe(75.25);
    });

    it('should create a valid debt result when Lev owes Danik', () => {
      const result: DebtResult = {
        debtor: 'lev',
        creditor: 'danik',
        amount: 150.00
      };
      
      expect(result.debtor).toBe('lev');
      expect(result.creditor).toBe('danik');
      expect(result.amount).toBe(150.00);
    });

    it('should create a valid debt result when no debt exists', () => {
      const result: DebtResult = {
        debtor: 'none',
        creditor: 'none',
        amount: 0
      };
      
      expect(result.debtor).toBe('none');
      expect(result.creditor).toBe('none');
      expect(result.amount).toBe(0);
    });
  });

  describe('ValidationResult interface', () => {
    it('should create a valid validation result for valid input', () => {
      const result: ValidationResult = {
        valid: true,
        errors: []
      };
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should create a valid validation result for invalid input', () => {
      const result: ValidationResult = {
        valid: false,
        errors: [
          'Invalid entity name',
          'Amount must be positive'
        ]
      };
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toBe('Invalid entity name');
      expect(result.errors[1]).toBe('Amount must be positive');
    });
  });
});
