import { describe, test, expect } from 'vitest';
import { normalizeItem, filterByItem } from './salesUtils';
import { SalesTransaction } from '../api/salesApi';

describe('salesUtils', () => {
  describe('normalizeItem', () => {
    test('trims leading and trailing whitespace', () => {
      expect(normalizeItem('  Widget  ')).toBe('widget');
      expect(normalizeItem('\tGadget\n')).toBe('gadget');
      expect(normalizeItem('   Item   ')).toBe('item');
    });

    test('converts to lowercase', () => {
      expect(normalizeItem('WIDGET')).toBe('widget');
      expect(normalizeItem('Widget')).toBe('widget');
      expect(normalizeItem('WiDgEt')).toBe('widget');
    });

    test('handles already normalized items', () => {
      expect(normalizeItem('widget')).toBe('widget');
      expect(normalizeItem('gadget')).toBe('gadget');
    });

    test('handles empty string', () => {
      expect(normalizeItem('')).toBe('');
      expect(normalizeItem('   ')).toBe('');
    });
  });

  describe('filterByItem', () => {
    const mockTransactions: SalesTransaction[] = [
      {
        id: '1',
        item: 'Widget',
        price: 100,
      quantity: 1,
      seller: 'seller1',
      date: '2024-01-01',
        description: 'Test widget',
        createdBy: 'user1',
      },
      {
        id: '2',
        item: 'widget',
        price: 50,
      quantity: 1,
      seller: 'seller1',
      date: '2024-01-02',
        description: null,
        createdBy: 'user1',
      },
      {
        id: '3',
        item: 'Gadget',
        price: 200,
      quantity: 1,
      seller: 'seller1',
      date: '2024-01-03',
        description: 'Test gadget',
        createdBy: 'user2',
      },
      {
        id: '4',
        item: '  WIDGET  ',
        price: 75,
      quantity: 1,
      seller: 'seller1',
      date: '2024-01-04',
        description: null,
        createdBy: 'user1',
      },
    ];

    test('returns all transactions when filter is "All"', () => {
      const result = filterByItem(mockTransactions, 'All');
      expect(result).toEqual(mockTransactions);
      expect(result).toHaveLength(4);
    });

    test('filters transactions by exact item name (case-insensitive)', () => {
      const result = filterByItem(mockTransactions, 'Widget');
      expect(result).toHaveLength(3);
      expect(result.map(t => t.id)).toEqual(['1', '2', '4']);
    });

    test('filters with different casing', () => {
      const result = filterByItem(mockTransactions, 'WIDGET');
      expect(result).toHaveLength(3);
      expect(result.map(t => t.id)).toEqual(['1', '2', '4']);
    });

    test('filters with whitespace in filter value', () => {
      const result = filterByItem(mockTransactions, '  widget  ');
      expect(result).toHaveLength(3);
      expect(result.map(t => t.id)).toEqual(['1', '2', '4']);
    });

    test('returns single matching transaction', () => {
      const result = filterByItem(mockTransactions, 'Gadget');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('3');
    });

    test('returns empty array when no matches', () => {
      const result = filterByItem(mockTransactions, 'NonExistent');
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    test('handles empty transaction list', () => {
      const result = filterByItem([], 'Widget');
      expect(result).toEqual([]);
    });

    test('handles empty transaction list with "All" filter', () => {
      const result = filterByItem([], 'All');
      expect(result).toEqual([]);
    });
  });
});
