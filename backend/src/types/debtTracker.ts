// Type definitions for Debt Tracker

/**
 * Entity type representing the three participants in debt transactions
 */
export type Entity = 'lev' | 'danik' | '2masters';

/**
 * Transaction represents a raw money movement between two entities
 */
export interface Transaction {
  id: string;
  from: Entity;
  to: Entity;
  amount: number;
  timestamp: number;
  description?: string;
}

/**
 * DebtResult represents the calculated net debt between Lev and Danik
 */
export interface DebtResult {
  debtor: 'lev' | 'danik' | 'none';
  creditor: 'lev' | 'danik' | 'none';
  amount: number;
}

/**
 * ValidationResult represents the outcome of transaction validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
