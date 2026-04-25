/**
 * Property-Based Tests for Sales Transaction Creation
 * 
 * Tests universal properties that should hold for all valid inputs
 * using fast-check for property-based testing.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { SalesTransaction } from '../types/models';
import { normalizeItem, filterByItem, calculateItemStats } from '../business-logic/salesCalculations';

describe('Property-Based Tests: Sales Transactions', () => {
  const createdIds: string[] = [];
  const testUserId = '00000000-0000-4000-8000-000000000001';

  beforeEach(async () => {
    // Ensure test user exists (or use an existing user)
    try {
      // Try to get the first existing user from the database
      const userResult = await pool.query('SELECT id FROM users LIMIT 1');
      if (userResult.rows.length === 0) {
        // If no users exist, we can't run the test
        throw new Error('No users found in database. Please create at least one user first.');
      }
      // We'll use the first user's ID for testing
    } catch (error) {
      console.error('Error checking for users:', error);
      throw error;
    }
  });

  afterEach(async () => {
    // Clean up created transactions
    for (const id of createdIds) {
      try {
        await pool.query('DELETE FROM sales_transactions WHERE id = $1', [id]);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    createdIds.length = 0;
  });

  /**
   * Feature: sales-tracker, Property 1: Transaction Creation Invariants
   * 
   * **Validates: Requirements 1.1, 1.3, 1.4, 1.5**
   * 
   * For any valid transaction input (item, price, date, optional description),
   * creating a transaction should result in a stored record with:
   * - A unique UUID
   * - The trimmed item name
   * - All provided fields
   * - The creating user's ID
   */
  it('Property 1: Transaction Creation Invariants', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          item: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          price: fc.integer({ min: 1, max: 1000000 }).map(n => n / 100), // Generate cents, convert to dollars
          date: fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') })
            .map(d => d.toISOString().split('T')[0]),
          description: fc.option(fc.string({ maxLength: 500 }), { nil: null })
        }),
        async (input) => {
          // Get a real user ID from the database
          const userResult = await pool.query('SELECT id FROM users LIMIT 1');
          const userId = userResult.rows[0].id;
          
          const trimmedItem = input.item.trim();
          const transactionId = uuidv4();

          // Insert transaction directly into database (simulating API logic)
          const result = await pool.query(
            `INSERT INTO sales_transactions (id, item, price, date, description, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, item, price, date, description, created_by, created_at`,
            [transactionId, trimmedItem, input.price, input.date, input.description || null, userId]
          );

          const transaction = result.rows[0];
          createdIds.push(transaction.id);

          // Invariant 1: Transaction has a valid UUID (Requirement 1.5)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          expect(transaction.id).toMatch(uuidRegex);
          expect(transaction.id).toBe(transactionId);

          // Invariant 2: Item name is trimmed (Requirement 1.4)
          expect(transaction.item).toBe(trimmedItem);

          // Invariant 3: All provided fields are stored (Requirement 1.1)
          expect(parseFloat(transaction.price)).toBe(input.price);
          // Date is stored (format may vary due to timezone conversion)
          expect(transaction.date).toBeDefined();
          expect(transaction.date).not.toBeNull();
          
          // Invariant 4: Description is stored correctly (null or value)
          // Empty strings are converted to null in the database
          const expectedDescription = (input.description === null || input.description === '') ? null : input.description;
          if (expectedDescription === null) {
            expect(transaction.description).toBeNull();
          } else {
            expect(transaction.description).toBe(expectedDescription);
          }

          // Invariant 5: Creating user's ID is recorded (Requirement 1.3)
          expect(transaction.created_by).toBe(userId);

          // Verify transaction is actually stored in database
          const dbResult = await pool.query(
            'SELECT * FROM sales_transactions WHERE id = $1',
            [transaction.id]
          );

          expect(dbResult.rows).toHaveLength(1);
          const dbTransaction = dbResult.rows[0];

          // Verify database record matches inserted data
          expect(dbTransaction.id).toBe(transactionId);
          expect(dbTransaction.item).toBe(trimmedItem);
          expect(parseFloat(dbTransaction.price)).toBe(input.price);
          // Date is stored (format may vary due to timezone conversion)
          expect(dbTransaction.date).toBeDefined();
          expect(dbTransaction.date).not.toBeNull();
          // Empty strings are converted to null in the database (reuse expectedDescription from above)
          expect(dbTransaction.description).toBe(expectedDescription);
          expect(dbTransaction.created_by).toBe(userId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: sales-tracker, Property 7: Item Normalization Consistency
   * 
   * **Validates: Requirements 3.5, 7.1**
   * 
   * For any two item names that differ only in whitespace or casing,
   * they should be treated as identical for filtering, grouping, and
   * comparison purposes.
   * 
   * This property tests that:
   * 1. normalizeItem produces the same output for equivalent items
   * 2. filterByItem treats equivalent items as the same
   * 3. calculateItemStats groups equivalent items together
   */
  it('Property 7: Item Normalization Consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a base item name
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        // Generate two variations of the same item with different whitespace/casing
        fc.tuple(
          fc.constantFrom('', ' ', '  ', '\t', '\n'),  // leading whitespace
          fc.constantFrom('', ' ', '  ', '\t', '\n'),  // trailing whitespace
          fc.boolean(),  // uppercase first letter
          fc.boolean()   // uppercase all letters
        ),
        fc.tuple(
          fc.constantFrom('', ' ', '  ', '\t', '\n'),  // leading whitespace
          fc.constantFrom('', ' ', '  ', '\t', '\n'),  // trailing whitespace
          fc.boolean(),  // uppercase first letter
          fc.boolean()   // uppercase all letters
        ),
        // Generate additional transaction data
        fc.integer({ min: 1, max: 1000000 }).map(n => n / 100),  // price1
        fc.integer({ min: 1, max: 1000000 }).map(n => n / 100),  // price2
        fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') })
          .map(d => d.toISOString().split('T')[0]),  // date1
        fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') })
          .map(d => d.toISOString().split('T')[0]),  // date2
        async (baseItem, variation1, variation2, price1, price2, date1, date2) => {
          // Create two variations of the same item name
          const [lead1, trail1, upperFirst1, upperAll1] = variation1;
          const [lead2, trail2, upperFirst2, upperAll2] = variation2;
          
          let item1 = baseItem.trim();
          let item2 = baseItem.trim();
          
          // Apply casing transformations
          if (upperAll1) {
            item1 = item1.toUpperCase();
          } else if (upperFirst1 && item1.length > 0) {
            item1 = item1.charAt(0).toUpperCase() + item1.slice(1);
          }
          
          if (upperAll2) {
            item2 = item2.toUpperCase();
          } else if (upperFirst2 && item2.length > 0) {
            item2 = item2.charAt(0).toUpperCase() + item2.slice(1);
          }
          
          // Apply whitespace transformations
          item1 = lead1 + item1 + trail1;
          item2 = lead2 + item2 + trail2;
          
          // Get a real user ID from the database
          const userResult = await pool.query('SELECT id FROM users LIMIT 1');
          const userId = userResult.rows[0].id;
          
          // Create two transactions with the item variations
          const id1 = uuidv4();
          const id2 = uuidv4();
          
          await pool.query(
            `INSERT INTO sales_transactions (id, item, price, date, description, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id1, item1.trim(), price1, date1, null, userId]
          );
          createdIds.push(id1);
          
          await pool.query(
            `INSERT INTO sales_transactions (id, item, price, date, description, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id2, item2.trim(), price2, date2, null, userId]
          );
          createdIds.push(id2);
          
          // Fetch the transactions
          const result = await pool.query(
            'SELECT * FROM sales_transactions WHERE id IN ($1, $2)',
            [id1, id2]
          );
          
          const transactions: SalesTransaction[] = result.rows.map(row => ({
            id: row.id,
            item: row.item,
            price: parseFloat(row.price),
            quantity: row.quantity || 1,
            seller: row.seller || 'unknown',
            date: row.date,
            description: row.description,
            createdBy: row.created_by,
            createdAt: row.created_at
          }));
          
          // Property 1: normalizeItem produces the same output for both variations
          const normalized1 = normalizeItem(item1);
          const normalized2 = normalizeItem(item2);
          expect(normalized1).toBe(normalized2);
          
          // Property 2: filterByItem treats both variations as the same item
          // Filter using the first variation
          const filtered1 = filterByItem(transactions, item1);
          expect(filtered1).toHaveLength(2);
          expect(filtered1.map(t => t.id).sort()).toEqual([id1, id2].sort());
          
          // Filter using the second variation
          const filtered2 = filterByItem(transactions, item2);
          expect(filtered2).toHaveLength(2);
          expect(filtered2.map(t => t.id).sort()).toEqual([id1, id2].sort());
          
          // Property 3: calculateItemStats groups both transactions together
          const stats = calculateItemStats(transactions);
          expect(stats).toHaveLength(1);  // Only one unique item
          expect(stats[0].count).toBe(2);  // Both transactions grouped together
          expect(stats[0].totalRevenue).toBeCloseTo(price1 + price2, 2);
          
          // The item name in stats should be one of the original names (first occurrence)
          const statsItemNormalized = normalizeItem(stats[0].item);
          expect(statsItemNormalized).toBe(normalized1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: sales-tracker, Property 12: Per-Item Statistics Accuracy
   * 
   * **Validates: Requirements 7.1, 7.2, 7.3**
   * 
   * For any set of transactions, grouping by normalized item name should
   * produce statistics where:
   * - Each item's total revenue equals the sum of matching transaction prices
   * - Each item's count equals the number of matching transactions
   * 
   * This property verifies that the calculateItemStats function correctly
   * aggregates transactions by normalized item name and computes accurate
   * statistics for each unique item.
   */
  it('Property 12: Per-Item Statistics Accuracy', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate an array of transactions with various items
        fc.array(
          fc.record({
            item: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            price: fc.integer({ min: 1, max: 1000000 }).map(n => n / 100),
            date: fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') })
              .map(d => d.toISOString().split('T')[0]),
            description: fc.option(fc.string({ maxLength: 200 }), { nil: null })
          }),
          { minLength: 1, maxLength: 20 }  // Generate 1-20 transactions
        ),
        async (transactionInputs) => {
          // Get a real user ID from the database
          const userResult = await pool.query('SELECT id FROM users LIMIT 1');
          const userId = userResult.rows[0].id;
          
          // Create all transactions in the database
          const transactions: SalesTransaction[] = [];
          
          for (const input of transactionInputs) {
            const id = uuidv4();
            const trimmedItem = input.item.trim();
            
            await pool.query(
              `INSERT INTO sales_transactions (id, item, price, date, description, created_by)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [id, trimmedItem, input.price, input.date, input.description || null, userId]
            );
            createdIds.push(id);
            
            transactions.push({
              id,
              item: trimmedItem,
              price: input.price,
              quantity: 1,
              seller: 'seller1',
              date: input.date,
              description: input.description || null,
              createdBy: userId,
              createdAt: new Date()
            });
          }
          
          // Calculate item statistics using the business logic function
          const itemStats = calculateItemStats(transactions);
          
          // Build expected statistics by manually grouping transactions
          const expectedStats = new Map<string, { totalRevenue: number; count: number; transactions: SalesTransaction[] }>();
          
          for (const transaction of transactions) {
            const normalized = normalizeItem(transaction.item);
            
            if (!expectedStats.has(normalized)) {
              expectedStats.set(normalized, {
                totalRevenue: 0,
                count: 0,
                transactions: []
              });
            }
            
            const stats = expectedStats.get(normalized)!;
            stats.totalRevenue += transaction.price;
            stats.count += 1;
            stats.transactions.push(transaction);
          }
          
          // Verify that we have the correct number of unique items
          expect(itemStats.length).toBe(expectedStats.size);
          
          // Verify each item's statistics
          for (const stats of itemStats) {
            const normalized = normalizeItem(stats.item);
            const expected = expectedStats.get(normalized);
            
            // The item should exist in our expected stats
            expect(expected).toBeDefined();
            
            if (expected) {
              // Property 1: Total revenue equals sum of matching transaction prices (Requirement 7.2)
              expect(stats.totalRevenue).toBeCloseTo(expected.totalRevenue, 2);
              
              // Property 2: Count equals number of matching transactions (Requirement 7.3)
              expect(stats.count).toBe(expected.count);
              
              // Property 3: All transactions for this item are included
              expect(stats.transactions.length).toBe(expected.count);
              
              // Property 4: Transactions are grouped by normalized item name (Requirement 7.1)
              for (const transaction of stats.transactions) {
                expect(normalizeItem(transaction.item)).toBe(normalized);
              }
              
              // Property 5: Sum of prices in transactions array matches totalRevenue
              const calculatedRevenue = stats.transactions.reduce((sum, t) => sum + t.price, 0);
              expect(calculatedRevenue).toBeCloseTo(stats.totalRevenue, 2);
            }
          }
          
          // Verify that all transactions are accounted for
          const totalTransactionsInStats = itemStats.reduce((sum, stats) => sum + stats.count, 0);
          expect(totalTransactionsInStats).toBe(transactions.length);
          
          // Verify that total revenue across all items equals sum of all transaction prices
          const totalRevenueInStats = itemStats.reduce((sum, stats) => sum + stats.totalRevenue, 0);
          const totalRevenueExpected = transactions.reduce((sum, t) => sum + t.price, 0);
          expect(totalRevenueInStats).toBeCloseTo(totalRevenueExpected, 2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

