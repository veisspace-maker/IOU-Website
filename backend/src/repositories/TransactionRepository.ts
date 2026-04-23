import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, Entity } from '../types/debtTracker';

/**
 * TransactionRepository handles database operations for debt transactions
 * Requirements: 9.1, 9.2, 9.3, 9.4, 10.2, 10.3, 10.4, 10.5
 */
export class TransactionRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Creates a new transaction in the database
   * Requirements: 9.1, 10.2, 10.3
   * 
   * @param transaction - Transaction data without ID
   * @returns Created transaction with generated ID
   */
  async create(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const id = uuidv4();
    
    const result = await this.pool.query(
      `INSERT INTO debt_transactions_v2 (id, from_entity, to_entity, amount, timestamp, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, from_entity, to_entity, amount, timestamp, description`,
      [id, transaction.from, transaction.to, transaction.amount, transaction.timestamp, transaction.description || null]
    );

    return this.mapRowToTransaction(result.rows[0]);
  }

  /**
   * Retrieves all transactions ordered by timestamp (newest first)
   * Requirements: 9.2, 10.2
   * 
   * @returns Array of all transactions
   */
  async getAll(): Promise<Transaction[]> {
    const result = await this.pool.query(
      `SELECT id, from_entity, to_entity, amount, timestamp, description
       FROM debt_transactions_v2
       ORDER BY timestamp DESC`
    );

    return result.rows.map(row => this.mapRowToTransaction(row));
  }

  /**
   * Updates an existing transaction
   * Requirements: 9.3, 10.4
   * 
   * @param id - Transaction ID
   * @param updates - Partial transaction data to update
   * @returns Updated transaction
   * @throws Error if transaction not found
   */
  async update(id: string, updates: Partial<Omit<Transaction, 'id'>>): Promise<Transaction> {
    // Check if transaction exists
    const checkResult = await this.pool.query(
      'SELECT id FROM debt_transactions_v2 WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      throw new Error(`Transaction with id ${id} not found`);
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.from !== undefined) {
      updateFields.push(`from_entity = $${paramIndex++}`);
      values.push(updates.from);
    }
    if (updates.to !== undefined) {
      updateFields.push(`to_entity = $${paramIndex++}`);
      values.push(updates.to);
    }
    if (updates.amount !== undefined) {
      updateFields.push(`amount = $${paramIndex++}`);
      values.push(updates.amount);
    }
    if (updates.timestamp !== undefined) {
      updateFields.push(`timestamp = $${paramIndex++}`);
      values.push(updates.timestamp);
    }
    if (updates.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }

    if (updateFields.length === 0) {
      // No updates provided, just return the existing transaction
      const result = await this.pool.query(
        'SELECT id, from_entity, to_entity, amount, timestamp, description FROM debt_transactions_v2 WHERE id = $1',
        [id]
      );
      return this.mapRowToTransaction(result.rows[0]);
    }

    values.push(id);
    const query = `
      UPDATE debt_transactions_v2
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, from_entity, to_entity, amount, timestamp, description
    `;

    const result = await this.pool.query(query, values);
    return this.mapRowToTransaction(result.rows[0]);
  }

  /**
   * Deletes a transaction from the database
   * Requirements: 9.4, 10.5
   * 
   * @param id - Transaction ID
   * @throws Error if transaction not found
   */
  async delete(id: string): Promise<void> {
    const result = await this.pool.query(
      'DELETE FROM debt_transactions_v2 WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error(`Transaction with id ${id} not found`);
    }
  }

  /**
   * Maps a database row to a Transaction object
   * @private
   */
  private mapRowToTransaction(row: any): Transaction {
    return {
      id: row.id,
      from: row.from_entity as Entity,
      to: row.to_entity as Entity,
      amount: parseFloat(row.amount),
      timestamp: parseInt(row.timestamp),
      description: row.description || undefined,
    };
  }
}
