import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
} from '@mui/material';
import { SalesTransaction } from '../api/salesApi';

interface ItemStats {
  item: string;
  totalRevenue: number;
  count: number;
  totalQuantity: number;
  transactions: SalesTransaction[];
}

interface ItemBreakdownTableProps {
  transactions: SalesTransaction[];
  onItemClick: (item: string) => void;
}

/**
 * Normalize an item name for comparison and grouping.
 * Applies trim and lowercase conversion.
 */
const normalizeItem = (item: string): string => {
  return item.trim().toLowerCase();
};

/**
 * Calculate statistics for each unique item across all transactions.
 * Groups transactions by normalized item name and calculates total revenue and count.
 * Results are sorted by total revenue in descending order.
 */
const calculateItemStats = (transactions: SalesTransaction[]): ItemStats[] => {
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
  
  for (const [, txns] of grouped.entries()) {
    const totalRevenue = txns.reduce((sum, t) => sum + (t.price * t.quantity), 0);
    const totalQuantity = txns.reduce((sum, t) => sum + t.quantity, 0);
    
    stats.push({
      item: txns[0].item, // Use original casing from first occurrence
      totalRevenue,
      count: txns.length,
      totalQuantity,
      transactions: txns,
    });
  }
  
  // Sort by revenue in descending order
  stats.sort((a, b) => b.totalRevenue - a.totalRevenue);
  
  return stats;
};

const ItemBreakdownTable: React.FC<ItemBreakdownTableProps> = ({
  transactions,
  onItemClick,
}) => {
  const itemStats = calculateItemStats(transactions);

  if (itemStats.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No items to display. Add some sales transactions to see the breakdown.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} elevation={1}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell>
              <Typography variant="subtitle2" fontWeight="bold">
                Item
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" fontWeight="bold">
                Total Revenue
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" fontWeight="bold">
                Quantity
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" fontWeight="bold">
                Transactions
              </Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {itemStats.map((stat) => (
            <TableRow
              key={stat.item}
              onClick={() => onItemClick(stat.item)}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
                transition: 'background-color 0.2s',
              }}
            >
              <TableCell>
                <Typography variant="body1">{stat.item}</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body1" sx={{ color: '#2e7d32', fontWeight: 'medium' }}>
                  ${stat.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body1">{stat.totalQuantity}</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body1">{stat.count}</Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ItemBreakdownTable;
