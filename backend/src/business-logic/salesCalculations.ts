/**
 * Business logic calculations for Sales Tracker
 * 
 * This module contains pure functions for:
 * - Item name normalization
 * - Per-item statistics aggregation
 * - Transaction filtering by item
 */

import { SalesTransaction, ItemStats } from '../types/models';

/**
 * Normalize an item name for comparison and grouping.
 * 
 * Normalization applies:
 * - Trim leading and trailing whitespace
 * - Convert to lowercase
 * 
 * This ensures that items with different casing or whitespace
 * are treated as the same item for filtering and statistics.
 * 
 * @param item - The item name to normalize
 * @returns Normalized item name (trimmed and lowercase)
 * 
 * @example
 * normalizeItem("  Widget  ") // "widget"
 * normalizeItem("WIDGET") // "widget"
 * normalizeItem("Widget") // "widget"
 */
export function normalizeItem(item: string): string {
  return item.trim().toLowerCase();
}

/**
 * Calculate statistics for each unique item across all transactions.
 * 
 * Groups transactions by normalized item name and calculates:
 * - Total revenue (sum of prices)
 * - Transaction count
 * - List of all transactions for that item
 * 
 * Results are sorted by total revenue in descending order.
 * The original item name casing from the first occurrence is preserved.
 * 
 * @param transactions - Array of all sales transactions
 * @returns Array of ItemStats sorted by revenue (highest first)
 * 
 * @example
 * const transactions = [
 *   { item: "Widget", price: 100, ... },
 *   { item: "widget", price: 50, ... },
 *   { item: "Gadget", price: 200, ... }
 * ];
 * const stats = calculateItemStats(transactions);
 * // [
 * //   { item: "Gadget", totalRevenue: 200, count: 1, transactions: [...] },
 * //   { item: "Widget", totalRevenue: 150, count: 2, transactions: [...] }
 * // ]
 */
export function calculateItemStats(transactions: SalesTransaction[]): ItemStats[] {
  // Group transactions by normalized item name
  const grouped = new Map<string, SalesTransaction[]>();
  
  for (const transaction of transactions) {
    const normalized = normalizeItem(transaction.item);
    
    if (!grouped.has(normalized)) {
      grouped.set(normalized, []);
    }
    
    grouped.get(normalized)!.push(transaction);
  }
  
  // Calculate statistics for each group
  const stats: ItemStats[] = [];
  
  for (const [normalizedItem, txns] of grouped.entries()) {
    const totalRevenue = txns.reduce((sum, t) => sum + (t.price * t.quantity), 0);
    
    stats.push({
      item: txns[0].item, // Use original casing from first occurrence
      totalRevenue,
      count: txns.length,
      transactions: txns
    });
  }
  
  // Sort by revenue in descending order
  stats.sort((a, b) => b.totalRevenue - a.totalRevenue);
  
  return stats;
}

/**
 * Filter transactions by item name using normalized comparison.
 * 
 * If filterItem is "All", returns all transactions.
 * Otherwise, returns only transactions where the normalized item name
 * matches the normalized filter value.
 * 
 * @param transactions - Array of all sales transactions
 * @param filterItem - Item name to filter by, or "All" for no filtering
 * @returns Filtered array of transactions
 * 
 * @example
 * const transactions = [
 *   { item: "Widget", price: 100, ... },
 *   { item: "widget", price: 50, ... },
 *   { item: "Gadget", price: 200, ... }
 * ];
 * 
 * filterByItem(transactions, "All") // Returns all 3 transactions
 * filterByItem(transactions, "WIDGET") // Returns 2 transactions (both Widget variants)
 * filterByItem(transactions, "Gadget") // Returns 1 transaction
 */
export function filterByItem(
  transactions: SalesTransaction[],
  filterItem: string
): SalesTransaction[] {
  if (filterItem === 'All') {
    return transactions;
  }
  
  const normalized = normalizeItem(filterItem);
  return transactions.filter(t => normalizeItem(t.item) === normalized);
}
