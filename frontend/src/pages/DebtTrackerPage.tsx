import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Container,
  Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import TransactionForm from '../components/TransactionForm';
import DebtDisplay from '../components/DebtDisplay';
import TransactionHistory from '../components/TransactionHistory';
import EditTransactionDialog from '../components/EditTransactionDialog';
import { getDebtTransactions, DebtTransaction } from '../api/debtTrackerApi';

const DebtTrackerPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<DebtTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<DebtTransaction | null>(null);

  const fetchTransactions = async (append: boolean = false) => {
    console.log('🔄 Fetching transactions with pagination:', { append, currentCount: transactions.length });
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setTransactions([]);
      }
      setError(null);
      
      const offset = append ? transactions.length : 0;
      const limit = 20; // Reduced to 20 for better performance
      
      console.log('📡 API call:', { limit, offset });
      
      const response = await fetch(`/api/debt-transactions-v2?limit=${limit}&offset=${offset}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      
      console.log('✅ Received data:', { 
        transactionsCount: data.transactions.length, 
        total: data.total,
        hasMore: data.transactions.length === limit && (offset + limit) < data.total
      });
      
      if (append) {
        setTransactions(prev => [...prev, ...data.transactions]);
      } else {
        setTransactions(data.transactions);
      }
      
      setHasMore(data.transactions.length === limit && (offset + limit) < data.total);
    } catch (err: any) {
      console.error('Error fetching debt transactions:', err);
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchTransactions(false);
  }, [refreshKey]);

  const handleLoadMore = () => {
    fetchTransactions(true);
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleTransactionCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleTransactionUpdate = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleEdit = (transaction: DebtTransaction) => {
    setTransactionToEdit(transaction);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setTransactionToEdit(null);
  };

  const handleTransactionUpdated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Top bar */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="back"
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Debt Tracker
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              mr: 2,
              display: { xs: 'none', sm: 'block' },
            }}
          >
            {user?.username}
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            aria-label="settings"
            onClick={handleSettings}
          >
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main content */}
      <Container maxWidth="md" sx={{ py: 3 }}>
        {/* Transaction Form */}
        <Box sx={{ mb: 3 }}>
          <TransactionForm onTransactionCreated={handleTransactionCreated} />
        </Box>

        {/* Debt Display */}
        <Box sx={{ mb: 3 }}>
          <DebtDisplay refreshTrigger={refreshKey} />
        </Box>

        {/* Transaction History */}
        <Box>
          <TransactionHistory
            transactions={transactions}
            loading={loading}
            error={error}
            onTransactionUpdate={handleTransactionUpdate}
            onEdit={handleEdit}
          />
          
          {/* Load More Button */}
          {hasMore && !loading && transactions.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </Button>
            </Box>
          )}
        </Box>
      </Container>

      {/* Edit Transaction Dialog */}
      <EditTransactionDialog
        open={editDialogOpen}
        transaction={transactionToEdit}
        onClose={handleCloseEditDialog}
        onTransactionUpdated={handleTransactionUpdated}
      />
    </Box>
  );
};

export default DebtTrackerPage;
