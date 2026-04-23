import { SalesTransaction } from '../api/salesApi';

/**
 * Normalize an item name for comparison (trim + lowercase)
 * This matches the backend normalization logic
 */
export const normalizeItem = (item: string): string => {
  return item.trim().toLowerCase();
};

/**
 * Filter transactions by item name using normalized comparison
 * If filterItem is "All", returns all transactions
 * Otherwise, returns only transactions where the normalized item name matches
 */
export const filterByItem = (
  transactions: SalesTransaction[],
  filterItem: string
): SalesTransaction[] => {
  if (filterItem === 'All') {
    return transactions;
  }
  
  const normalized = normalizeItem(filterItem);
  return transactions.filter(t => normalizeItem(t.item) === normalized);
};
