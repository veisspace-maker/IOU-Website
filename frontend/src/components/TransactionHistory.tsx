import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  Paper,
  CircularProgress,
  Divider,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { DebtTransaction, deleteDebtTransaction } from '../api/debtTrackerApi';
import { formatEntityName, formatCurrency, formatTimestamp } from '../utils/debtTrackerUtils';
import { useScrollPreservation } from '../hooks/useScrollPreservation';

interface TransactionHistoryProps {
  transactions: DebtTransaction[];
  loading: boolean;
  error: string | null;
  onTransactionUpdate: () => void;
  onEdit: (transaction: DebtTransaction) => void;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  loading,
  error,
  onTransactionUpdate,
  onEdit,
}) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<DebtTransaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Smart search function
  const smartSearch = (transaction: DebtTransaction, query: string): boolean => {
    if (!query.trim()) return true;

    const lowerQuery = query.toLowerCase().trim();
    
    // Check if query is a number
    const isNumeric = /^\d+$/.test(lowerQuery);
    
    if (isNumeric) {
      const queryNum = parseInt(lowerQuery, 10);
      
      // Search in date (day, month, year)
      const date = new Date(transaction.timestamp);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      
      if (day === queryNum || month === queryNum || year === queryNum) {
        return true;
      }
      
      // Search in amount (exact match or contains)
      const amount = transaction.amount;
      if (amount === queryNum || amount.toString().includes(lowerQuery)) {
        return true;
      }
      
      return false;
    }
    
    // Text search in entity names
    const fromName = formatEntityName(transaction.from).toLowerCase();
    const toName = formatEntityName(transaction.to).toLowerCase();
    
    if (fromName.includes(lowerQuery) || toName.includes(lowerQuery)) {
      return true;
    }
    
    // Search in description
    if (transaction.description?.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    // Search in formatted date (DD/MM/YYYY)
    const formattedDate = formatTimestamp(transaction.timestamp).toLowerCase();
    if (formattedDate.includes(lowerQuery)) {
      return true;
    }
    
    // Search in formatted amount
    const formattedAmount = formatCurrency(transaction.amount).toLowerCase();
    if (formattedAmount.includes(lowerQuery)) {
      return true;
    }
    
    return false;
  };

  // Filter transactions based on search
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => smartSearch(transaction, searchQuery));
  }, [transactions, searchQuery]);

  // Scroll preservation
  const scrollContainerRef = useScrollPreservation([filteredTransactions]);

  const handleDeleteClick = (transaction: DebtTransaction) => {
    setTransactionToDelete(transaction);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setTransactionToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;

    try {
      setDeleting(true);
      await deleteDebtTransaction(transactionToDelete.id);
      
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
      onTransactionUpdate();
    } catch (err: any) {
      console.error('Error deleting debt transaction:', err);
      alert(err.message || 'Failed to delete debt transaction');
    } finally {
      setDeleting(false);
    }
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

  if (transactions.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary" align="center">
          No transactions yet. Create your first transaction above!
        </Typography>
      </Paper>
    );
  }

  return (
    <>
      <Paper sx={{ p: { xs: 1, sm: 2 } }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 2,
          gap: 2,
          flexWrap: 'wrap'
        }}>
          <Typography 
            variant="h6"
            sx={{ 
              fontSize: { xs: '1.125rem', sm: '1.25rem' }
            }}
          >
            Transaction History
          </Typography>
          
          {/* Search Field */}
          <TextField
            size="small"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ 
              minWidth: { xs: '100%', sm: '250px' },
              maxWidth: { xs: '100%', sm: '350px' }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchQuery('')}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {filteredTransactions.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
            No transactions found matching "{searchQuery}"
          </Typography>
        ) : (
          <Box
            ref={scrollContainerRef}
            sx={{
              maxHeight: '600px',
              overflowY: 'auto',
            }}
          >
            <List sx={{ pt: 0 }}>
            {filteredTransactions.map((transaction, index) => {
            const formattedDate = formatTimestamp(transaction.timestamp);
            const fromName = formatEntityName(transaction.from);
            const toName = formatEntityName(transaction.to);
            const formattedAmount = formatCurrency(transaction.amount);

            return (
              <React.Fragment key={transaction.id}>
                <ListItem
                  sx={{
                    display: 'block',
                    py: { xs: 2.5, sm: 2 },
                    px: { xs: 1.5, sm: 2 },
                  }}
                >
                  {/* Header: Date and Actions */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    mb: 1.5,
                    gap: 1
                  }}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}
                    >
                      {formattedDate}
                    </Typography>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto', flexShrink: 0 }}>
                      <IconButton
                        size="small"
                        onClick={() => onEdit(transaction)}
                        sx={{ padding: { xs: '6px', sm: '8px' } }}
                        aria-label="edit"
                      >
                        <EditIcon sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(transaction)}
                        color="error"
                        sx={{ padding: { xs: '6px', sm: '8px' } }}
                        aria-label="delete"
                      >
                        <DeleteIcon sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }} />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Transaction Details: From -> To */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontSize: { xs: '0.938rem', sm: '1rem' },
                        lineHeight: 1.5,
                        fontWeight: 'bold'
                      }}
                    >
                      {fromName}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}
                    >
                      →
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontSize: { xs: '0.938rem', sm: '1rem' },
                        lineHeight: 1.5,
                        fontWeight: 'bold'
                      }}
                    >
                      {toName}
                    </Typography>
                  </Box>

                  {/* Amount */}
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: 'primary.main',
                      mb: transaction.description ? 1.5 : 0,
                      fontSize: { xs: '1.25rem', sm: '1.5rem' }
                    }}
                  >
                    {formattedAmount}
                  </Typography>

                  {/* Description */}
                  {transaction.description && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mt: 1,
                        fontStyle: 'italic',
                        fontSize: { xs: '0.813rem', sm: '0.875rem' },
                        lineHeight: 1.5
                      }}
                    >
                      {transaction.description}
                    </Typography>
                  )}
                </ListItem>
                {index < filteredTransactions.length - 1 && <Divider />}
              </React.Fragment>
            );
          })}
        </List>
        </Box>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Transaction</DialogTitle>
        <DialogContent>
          <Typography>
            Delete this transaction?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TransactionHistory;
