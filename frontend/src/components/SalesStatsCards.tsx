import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { SalesTransaction } from '../api/salesApi';

interface SalesStatsCardsProps {
  transactions: SalesTransaction[];
}

const SalesStatsCards: React.FC<SalesStatsCardsProps> = ({ transactions }) => {
  // Calculate total revenue (sum of all prices * quantities)
  const totalRevenue = transactions.reduce((sum, transaction) => sum + (transaction.price * transaction.quantity), 0);
  
  // Calculate total items sold (sum of all quantities)
  const totalItemsSold = transactions.reduce((sum, transaction) => sum + transaction.quantity, 0);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
        gap: 2,
        mb: 3,
      }}
    >
      {/* Total Revenue Card */}
      <Card
        sx={{
          backgroundColor: '#f5f5f5',
          border: '1px solid #e0e0e0',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4,
            backgroundColor: '#eeeeee',
          },
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}>
            Total Revenue
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32', fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
            ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
        </CardContent>
      </Card>

      {/* Total Items Sold Card */}
      <Card
        sx={{
          backgroundColor: '#f5f5f5',
          border: '1px solid #e0e0e0',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4,
            backgroundColor: '#eeeeee',
          },
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}>
            Total Items Sold
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
            {totalItemsSold}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SalesStatsCards;
