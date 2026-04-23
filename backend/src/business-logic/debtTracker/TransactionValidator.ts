/**
 * TransactionValidator module for Debt Tracker
 * 
 * Validates transaction data according to business rules:
 * - Entity names must be 'lev', 'danik', or '2masters'
 * - Self-transactions are not allowed (from !== to)
 * - Amounts must be positive numbers
 * - Timestamps must be valid numbers
 */

import type { Entity, Transaction, ValidationResult } from '../../types/debtTrackerV2';

const VALID_ENTITIES: readonly Entity[] = ['lev', 'danik', '2masters'] as const;

/**
 * Validates a transaction before it's stored
 * @param transaction - Transaction data to validate (without id)
 * @returns ValidationResult with valid flag and errors array
 */
export function validate(transaction: Omit<Transaction, 'id'>): ValidationResult {
  const errors: string[] = [];

  // Validate from entity
  if (!VALID_ENTITIES.includes(transaction.from)) {
    errors.push('From entity must be one of: lev, danik, 2masters');
  }

  // Validate to entity
  if (!VALID_ENTITIES.includes(transaction.to)) {
    errors.push('To entity must be one of: lev, danik, 2masters');
  }

  // Validate self-transaction
  if (transaction.from === transaction.to) {
    errors.push('Cannot create transaction from an entity to itself');
  }

  // Validate amount is positive
  if (typeof transaction.amount !== 'number' || transaction.amount <= 0 || isNaN(transaction.amount)) {
    errors.push('Amount must be a positive number');
  }

  // Validate timestamp
  if (typeof transaction.timestamp !== 'number' || isNaN(transaction.timestamp) || transaction.timestamp < 0) {
    errors.push('Timestamp must be a valid number');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
