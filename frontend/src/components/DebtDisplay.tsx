import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import { getNetDebt } from '../api/debtTrackerApi';
import { formatDebtDisplay } from '../utils/debtTrackerUtils';
import { DebtResult } from '../utils/debtTrackerUtils';

interface DebtDisplayProps {
  refreshTrigger?: number;
}

const DebtDisplay: React.FC<DebtDisplayProps> = ({ refreshTrigger = 0 }) => {
  const [debtResult, setDebtResult] = useState<DebtResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNetDebt = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getNetDebt();
        setDebtResult(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch net debt');
      } finally {
        setLoading(false);
      }
    };

    fetchNetDebt();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Card
        sx={{
          backgroundColor: '#ffebee',
          border: '1px solid #ef5350',
          mb: 3,
        }}
      >
        <CardContent>
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!debtResult) {
    return null;
  }

  const displayText = formatDebtDisplay(debtResult);
  const isNoDebt = debtResult.debtor === 'none' || debtResult.creditor === 'none' || debtResult.amount === 0;

  return (
    <Card
      sx={{
        backgroundColor: isNoDebt ? '#e8f5e9' : '#fff3e0',
        border: `1px solid ${isNoDebt ? '#66bb6a' : '#ffa726'}`,
        mb: 3,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}>
          Net Debt
        </Typography>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            color: isNoDebt ? '#2e7d32' : '#e65100',
            fontSize: { xs: '1.5rem', sm: '2.125rem' },
          }}
        >
          {displayText}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default DebtDisplay;
