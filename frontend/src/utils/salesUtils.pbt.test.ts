import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { filterByItem, normalizeItem } from './salesUtils';
import { SalesTransaction } from '../api/salesApi';

/**
 * Property-Based Test for Filter Behavior Correctness
 * Feature: sales-tracker, Property 6: Filter Behavior Correctness
 * Validates: Requirements 3.3, 3.4, 3.5
 */
describe('filterByItem - Property-Based Tests', () => {
  // Arbitrary generator for SalesTransaction
  const salesTransactionArb = fc.record({
    id: fc.uuid(),
    item: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
    price: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
    date: fc.date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) })
      .map(d => d.toISOString().split('T')[0]),
    description: fc.option(fc.string(), { nil: null }),
    createdBy: fc.uuid(),
  }) as fc.Arbitrary<SalesTransaction>;

  it('selecting "All" returns all transactions', () => {
    fc.assert(
      fc.property(
        fc.array(salesTransactionArb, { minLength: 0, maxLength: 50 }),
        (transactions) => {
          const result = filterByItem(transactions, 'All');

          // Property: Selecting "All" should return all transactions
          expect(result).toHaveLength(transactions.length);
          expect(result).toEqual(transactions);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('selecting specific item returns only matching transactions', () => {
    fc.assert(
      fc.property(
        fc.array(salesTransactionArb, { minLength: 1, maxLength: 50 }),
        (transactions) => {
          // Pick a random transaction and use its item as the filter
          const randomIndex = Math.floor(Math.random() * transactions.length);
          const filterItem = transactions[randomIndex].item;
          
          const result = filterByItem(transactions, filterItem);

          // Property 1: All returned transactions should match the filter (normalized)
          const normalizedFilter = normalizeItem(filterItem);
          const allMatch = result.every(t => normalizeItem(t.item) === normalizedFilter);

          // Property 2: All matching transactions should be included
          const expectedMatches = transactions.filter(
            t => normalizeItem(t.item) === normalizedFilter
          );
          const allIncluded = result.length === expectedMatches.length;

          // Property 3: Result should be a subset of original transactions
          const isSubset = result.every(r => transactions.includes(r));

          expect(allMatch).toBe(true);
          expect(allIncluded).toBe(true);
          expect(isSubset).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('filter is case-insensitive', () => {
    fc.assert(
      fc.property(
        fc.array(salesTransactionArb, { minLength: 1, maxLength: 50 }),
        fc.constantFrom('lower', 'UPPER', 'MiXeD'),
        (transactions, caseVariant) => {
          // Pick a random transaction
          const randomIndex = Math.floor(Math.random() * transactions.length);
          const originalItem = transactions[randomIndex].item;
          
          // Create different case variants of the item
          let filterItem: string;
          if (caseVariant === 'lower') {
            filterItem = originalItem.toLowerCase();
          } else if (caseVariant === 'UPPER') {
            filterItem = originalItem.toUpperCase();
          } else {
            // Mixed case
            filterItem = originalItem.split('').map((c, i) => 
              i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()
            ).join('');
          }

          const result = filterByItem(transactions, filterItem);

          // Property: Case variations should produce the same result
          const normalizedOriginal = normalizeItem(originalItem);
          const expectedMatches = transactions.filter(
            t => normalizeItem(t.item) === normalizedOriginal
          );

          expect(result).toHaveLength(expectedMatches.length);
          expect(result.every(r => 
            normalizeItem(r.item) === normalizedOriginal
          )).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('filter handles whitespace correctly', () => {
    fc.assert(
      fc.property(
        fc.array(salesTransactionArb, { minLength: 1, maxLength: 50 }),
        (transactions) => {
          // Pick a random transaction and add whitespace to its item
          const randomIndex = Math.floor(Math.random() * transactions.length);
          const originalItem = transactions[randomIndex].item;
          const filterItemWithWhitespace = `  ${originalItem}  `;

          const result = filterByItem(transactions, filterItemWithWhitespace);

          // Property: Whitespace should be trimmed for comparison
          const normalizedOriginal = normalizeItem(originalItem);
          const expectedMatches = transactions.filter(
            t => normalizeItem(t.item) === normalizedOriginal
          );

          expect(result).toHaveLength(expectedMatches.length);
          expect(result.every(r => 
            normalizeItem(r.item) === normalizedOriginal
          )).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('filter with non-existent item returns empty array', () => {
    fc.assert(
      fc.property(
        fc.array(salesTransactionArb, { minLength: 0, maxLength: 50 }),
        fc.uuid(), // Use UUID as a filter that's unlikely to match any item
        (transactions, nonExistentItem) => {
          // Ensure the filter doesn't match any transaction
          const hasMatch = transactions.some(
            t => normalizeItem(t.item) === normalizeItem(nonExistentItem)
          );

          if (!hasMatch) {
            const result = filterByItem(transactions, nonExistentItem);
            
            // Property: Non-matching filter should return empty array
            expect(result).toHaveLength(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('filter preserves transaction order', () => {
    fc.assert(
      fc.property(
        fc.array(salesTransactionArb, { minLength: 2, maxLength: 50 }),
        (transactions) => {
          // Pick a random transaction
          const randomIndex = Math.floor(Math.random() * transactions.length);
          const filterItem = transactions[randomIndex].item;

          const result = filterByItem(transactions, filterItem);

          if (result.length > 1) {
            // Property: Filtered results should maintain original order
            const normalizedFilter = normalizeItem(filterItem);
            const expectedOrder = transactions.filter(
              t => normalizeItem(t.item) === normalizedFilter
            );

            expect(result).toEqual(expectedOrder);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
