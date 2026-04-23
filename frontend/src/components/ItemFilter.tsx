import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { SalesTransaction } from '../api/salesApi';
import { normalizeItem } from '../utils/salesUtils';

interface ItemFilterProps {
  transactions: SalesTransaction[];
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}

/**
 * Extract unique item names from transactions using normalization
 * Returns items in their original casing (first occurrence)
 */
const getUniqueItems = (transactions: SalesTransaction[]): string[] => {
  const seen = new Map<string, string>();
  
  for (const transaction of transactions) {
    const normalized = normalizeItem(transaction.item);
    
    // Keep the first occurrence's original casing
    if (!seen.has(normalized)) {
      seen.set(normalized, transaction.item);
    }
  }
  
  return Array.from(seen.values());
};

const ItemFilter: React.FC<ItemFilterProps> = ({
  transactions,
  selectedFilter,
  onFilterChange,
}) => {
  const uniqueItems = getUniqueItems(transactions);
  
  // Generate filter options with "All" as first option
  const filterOptions = ['All', ...uniqueItems];

  const handleChange = (event: SelectChangeEvent) => {
    onFilterChange(event.target.value);
  };

  return (
    <FormControl fullWidth sx={{ mb: 3 }}>
      <InputLabel id="item-filter-label">Filter by Item</InputLabel>
      <Select
        labelId="item-filter-label"
        id="item-filter"
        value={selectedFilter}
        label="Filter by Item"
        onChange={handleChange}
      >
        {filterOptions.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default ItemFilter;
