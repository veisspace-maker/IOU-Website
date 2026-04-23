/**
 * Unit tests for Sales Tracker business logic
 * 
 * Tests the core business logic functions:
 * - normalizeItem: Item name normalization
 * - calculateItemStats: Per-item statistics aggregation
 * - filterByItem: Transaction filtering by item
 */

import { describe, it, expect } from 'vitest';
import { normalizeItem, calculateItemStats, filterByItem } from './salesCalculations';
import { SalesTransaction } from '../types/models';

describe('normalizeItem', () => {
  it('should trim leading and trailing whitespace', () => {
    expect(normalizeItem('  Widget  ')).toBe('widget');
    expect(normalizeItem('\tGadget\t')).toBe('gadget');
    expect(normalizeItem(' Item ')).toBe('item');
  });

  it('should convert to lowercase', () => {
    expect(normalizeItem('WIDGET')).toBe('widget');
    expect(normalizeItem('Widget')).toBe('widget');
    expect(normalizeItem('WiDgEt')).toBe('widget');
  });

  it('should handle strings that are already normalized', () => {
    expect(normalizeItem('widget')).toBe('widget');
    expect(normalizeItem('gadget')).toBe('gadget');
  });

  it('should handle empty strings', () => {
    expect(normalizeItem('')).toBe('');
    expect(normalizeItem('   ')).toBe('');
  });

  it('should handle strings with multiple words', () => {
    expect(normalizeItem('  Blue Widget  ')).toBe('blue widget');
    expect(normalizeItem('RED GADGET')).toBe('red gadget');
  });
});

describe('calculateItemStats', () => {
  const createTransaction = (item: string, price: number, id: string = '1'): SalesTransaction => ({
    id,
    item,
    price,
    date: '2024-01-01',
    description: null,
    createdBy: 'user1',
  });

  it('should return empty array for empty transaction list', () => {
    const stats = calculateItemStats([]);
    expect(stats).toEqual([]);
  });

  it('should calculate stats for a single transaction', () => {
    const transactions = [createTransaction('Widget', 100, '1')];
    const stats = calculateItemStats(transactions);

    expect(stats).toHaveLength(1);
    expect(stats[0].item).toBe('Widget');
    expect(stats[0].totalRevenue).toBe(100);
    expect(stats[0].count).toBe(1);
    expect(stats[0].transactions).toEqual(transactions);
  });

  it('should group transactions by normalized item name', () => {
    const transactions = [
      createTransaction('Widget', 100, '1'),
      createTransaction('widget', 50, '2'),
      createTransaction('WIDGET', 25, '3'),
    ];
    const stats = calculateItemStats(transactions);

    expect(stats).toHaveLength(1);
    expect(stats[0].item).toBe('Widget'); // First occurrence casing
    expect(stats[0].totalRevenue).toBe(175);
    expect(stats[0].count).toBe(3);
  });

  it('should calculate stats for multiple different items', () => {
    const transactions = [
      createTransaction('Widget', 100, '1'),
      createTransaction('Gadget', 200, '2'),
      createTransaction('Tool', 50, '3'),
    ];
    const stats = calculateItemStats(transactions);

    expect(stats).toHaveLength(3);
    
    // Should be sorted by revenue (descending)
    expect(stats[0].item).toBe('Gadget');
    expect(stats[0].totalRevenue).toBe(200);
    expect(stats[0].count).toBe(1);
    
    expect(stats[1].item).toBe('Widget');
    expect(stats[1].totalRevenue).toBe(100);
    expect(stats[1].count).toBe(1);
    
    expect(stats[2].item).toBe('Tool');
    expect(stats[2].totalRevenue).toBe(50);
    expect(stats[2].count).toBe(1);
  });

  it('should sort items by total revenue in descending order', () => {
    const transactions = [
      createTransaction('Low', 10, '1'),
      createTransaction('High', 500, '2'),
      createTransaction('Medium', 100, '3'),
      createTransaction('Low', 5, '4'), // Another Low item
    ];
    const stats = calculateItemStats(transactions);

    expect(stats).toHaveLength(3);
    expect(stats[0].item).toBe('High');
    expect(stats[0].totalRevenue).toBe(500);
    expect(stats[1].item).toBe('Medium');
    expect(stats[1].totalRevenue).toBe(100);
    expect(stats[2].item).toBe('Low');
    expect(stats[2].totalRevenue).toBe(15); // 10 + 5
    expect(stats[2].count).toBe(2);
  });

  it('should preserve original casing from first occurrence', () => {
    const transactions = [
      createTransaction('WIDGET', 100, '1'),
      createTransaction('widget', 50, '2'),
      createTransaction('Widget', 25, '3'),
    ];
    const stats = calculateItemStats(transactions);

    expect(stats).toHaveLength(1);
    expect(stats[0].item).toBe('WIDGET'); // First occurrence
  });

  it('should handle items with whitespace variations', () => {
    const transactions = [
      createTransaction('  Widget  ', 100, '1'),
      createTransaction('Widget', 50, '2'),
      createTransaction('widget  ', 25, '3'),
    ];
    const stats = calculateItemStats(transactions);

    expect(stats).toHaveLength(1);
    expect(stats[0].totalRevenue).toBe(175);
    expect(stats[0].count).toBe(3);
  });

  it('should include all transactions in the stats', () => {
    const transactions = [
      createTransaction('Widget', 100, '1'),
      createTransaction('widget', 50, '2'),
    ];
    const stats = calculateItemStats(transactions);

    expect(stats[0].transactions).toHaveLength(2);
    expect(stats[0].transactions).toContain(transactions[0]);
    expect(stats[0].transactions).toContain(transactions[1]);
  });
});

describe('filterByItem', () => {
  const createTransaction = (item: string, price: number, id: string = '1'): SalesTransaction => ({
    id,
    item,
    price,
    date: '2024-01-01',
    description: null,
    createdBy: 'user1',
  });

  it('should return all transactions when filter is "All"', () => {
    const transactions = [
      createTransaction('Widget', 100, '1'),
      createTransaction('Gadget', 200, '2'),
      createTransaction('Tool', 50, '3'),
    ];
    const filtered = filterByItem(transactions, 'All');

    expect(filtered).toEqual(transactions);
    expect(filtered).toHaveLength(3);
  });

  it('should filter transactions by exact item name (case-insensitive)', () => {
    const transactions = [
      createTransaction('Widget', 100, '1'),
      createTransaction('Gadget', 200, '2'),
      createTransaction('Tool', 50, '3'),
    ];
    const filtered = filterByItem(transactions, 'Widget');

    expect(filtered).toHaveLength(1);
    expect(filtered[0].item).toBe('Widget');
  });

  it('should filter using normalized comparison (case-insensitive)', () => {
    const transactions = [
      createTransaction('Widget', 100, '1'),
      createTransaction('widget', 50, '2'),
      createTransaction('WIDGET', 25, '3'),
      createTransaction('Gadget', 200, '4'),
    ];
    const filtered = filterByItem(transactions, 'WIDGET');

    expect(filtered).toHaveLength(3);
    expect(filtered.every(t => normalizeItem(t.item) === 'widget')).toBe(true);
  });

  it('should filter using normalized comparison (whitespace)', () => {
    const transactions = [
      createTransaction('  Widget  ', 100, '1'),
      createTransaction('Widget', 50, '2'),
      createTransaction('widget  ', 25, '3'),
      createTransaction('Gadget', 200, '4'),
    ];
    const filtered = filterByItem(transactions, 'Widget');

    expect(filtered).toHaveLength(3);
  });

  it('should return empty array when no items match', () => {
    const transactions = [
      createTransaction('Widget', 100, '1'),
      createTransaction('Gadget', 200, '2'),
    ];
    const filtered = filterByItem(transactions, 'NonExistent');

    expect(filtered).toEqual([]);
  });

  it('should return empty array when filtering empty transaction list', () => {
    const filtered = filterByItem([], 'Widget');
    expect(filtered).toEqual([]);
  });

  it('should handle filter value with different casing and whitespace', () => {
    const transactions = [
      createTransaction('Blue Widget', 100, '1'),
      createTransaction('blue widget', 50, '2'),
      createTransaction('BLUE WIDGET', 25, '3'),
    ];
    const filtered = filterByItem(transactions, '  BLUE WIDGET  ');

    expect(filtered).toHaveLength(3);
  });
});
