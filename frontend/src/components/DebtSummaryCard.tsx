import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface DebtResult {
  debtor: string;
  creditor: string;
  amount: number;
}

interface DebtSummaryCardProps {
  refreshKey?: number;
}

const DebtSummaryCard: React.FC<DebtSummaryCardProps> = ({ refreshKey = 0 }) => {
  const [debtData, setDebtData] = useState<DebtResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    
    const fetchNetDebt = async () => {
      try {
        setLoading(true);
        
        const response = await axios.get('/api/debt-transactions-v2/net-debt', { 
          withCredentials: true 
        });

        if (!isMounted) return;

        const netDebt = response.data.netDebt;
        
        // Only show if there's a debt
        if (netDebt && netDebt.amount > 0) {
          setDebtData(netDebt);
        } else {
          setDebtData(null);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching net debt:', err);
        if (isMounted) {
          setError('Failed to load debt summary');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchNetDebt();
    
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const handleCardClick = () => {
    navigate('/debt-tracker');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ p: 2 }}>
        {error}
      </Typography>
    );
  }

  if (!debtData) {
    return (
      <Typography color="text.secondary" sx={{ p: 2 }}>
        All settled! No outstanding debts.
      </Typography>
    );
  }

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        backgroundColor: '#f5f5f5',
        border: '1px solid #e0e0e0',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
          backgroundColor: '#eeeeee',
        },
      }}
      onClick={handleCardClick}
    >
      <CardContent>
        <Typography variant="body1" component="div">
          <Box component="span" sx={{ fontWeight: 'bold' }}>
            {debtData.debtor}
          </Box>
          {' owes '}
          <Box component="span" sx={{ fontWeight: 'bold' }}>
            {debtData.creditor}
          </Box>
        </Typography>
        <Typography variant="h5" sx={{ mt: 1, fontWeight: 'bold' }}>
          ${debtData.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default DebtSummaryCard;
