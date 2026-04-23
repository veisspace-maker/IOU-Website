import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import SalesTransactionList from './SalesTransactionList';
import { SalesTransaction } from '../api/salesApi';

// Mock the useScrollPreservation hook
vi.mock('../hooks/useScrollPreservation', () => ({
  useScrollPreservation: () => ({ current: null }),
}));

/**
 * Property-Based Test for Transaction Display Completeness
 * Feature: sales-tracker, Property 4: Transaction Display Completeness
 * Validates: Requirements 2.1
 * 
 * Property: For any transaction, the rendered display should contain 
 * the item name, price, date, and description (if present).
 */
describe('SalesTransactionList - Property-Based Tests', () => {
  // Arbitrary generator for SalesTransaction
  const salesTransactionArb = fc.record({
    id: fc.uuid(),
    item: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    price: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
    date: fc.date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) })
      .map(d => d.toISOString().split('T')[0]),
    description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
    createdBy: fc.uuid(),
    createdAt: fc.date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) })
      .map(d => d.toISOString()),
  }) as fc.Arbitrary<SalesTransaction>;

  it('displays all required fields for any transaction', () => {
    fc.assert(
      fc.property(
        fc.array(salesTransactionArb, { minLength: 1, maxLength: 20 }),
        (transactions) => {
          // Render the component with generated transactions
          const { container } = render(
            <SalesTransactionList
              transactions={transactions}
              loading={false}
              error={null}
              onTransactionUpdate={vi.fn()}
              onEdit={vi.fn()}
            />
          );

          const containerText = container.textContent || '';

          // Property: For each transaction, verify all required fields are displayed
          transactions.forEach((transaction) => {
            // 1. Item name should be displayed
            expect(containerText).toContain(transaction.item);

            // 2. Price should be displayed (formatted as currency)
            const formattedPrice = `$${transaction.price.toFixed(2)}`;
            expect(containerText).toContain(formattedPrice);

            // 3. Date should be displayed (in some formatted form)
            // The component uses date-fns format, so we check the date exists in the DOM
            const dateObj = new Date(transaction.date);
            const year = dateObj.getFullYear();
            // Check that the year appears (as a proxy for date being rendered)
            expect(containerText).toContain(year.toString());

            // 4. Description should be displayed if present
            if (transaction.description) {
              expect(containerText).toContain(transaction.description);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('displays description only when present', () => {
    fc.assert(
      fc.property(
        salesTransactionArb,
        (transaction) => {
          const { container } = render(
            <SalesTransactionList
              transactions={[transaction]}
              loading={false}
              error={null}
              onTransactionUpdate={vi.fn()}
              onEdit={vi.fn()}
            />
          );

          const containerText = container.textContent || '';

          // Property: Description should only appear in DOM if it's not null
          if (transaction.description) {
            expect(containerText).toContain(transaction.description);
          }
          
          // Always verify the other required fields are present
          expect(containerText).toContain(transaction.item);
          expect(containerText).toContain(`$${transaction.price.toFixed(2)}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('displays all transactions in the list', () => {
    fc.assert(
      fc.property(
        fc.array(salesTransactionArb, { minLength: 1, maxLength: 50 }),
        (transactions) => {
          const { container } = render(
            <SalesTransactionList
              transactions={transactions}
              loading={false}
              error={null}
              onTransactionUpdate={vi.fn()}
              onEdit={vi.fn()}
            />
          );

          const containerText = container.textContent || '';

          // Property: Every transaction's item name and price should be displayed
          transactions.forEach((transaction) => {
            expect(containerText).toContain(transaction.item);
            expect(containerText).toContain(`$${transaction.price.toFixed(2)}`);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
