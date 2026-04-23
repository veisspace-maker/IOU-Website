import React, { useState } from 'react';
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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import { SalesTransaction, deleteSale } from '../api/salesApi';
import { useScrollPreservation } from '../hooks/useScrollPreservation';

interface SalesTransactionListProps {
  transactions: SalesTransaction[];
  loading: boolean;
  error: string | null;
  onTransactionUpdate: () => void;
  onEdit: (transaction: SalesTransaction) => void;
}

const SalesTransactionList: React.FC<SalesTransactionListProps> = ({
  transactions,
  loading,
  error,
  onTransactionUpdate,
  onEdit,
}) => {
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<SalesTransaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Scroll preservation
  const scrollContainerRef = useScrollPreservation([transactions]);

  const handleDeleteClick = (transaction: SalesTransaction) => {
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
      await deleteSale(transactionToDelete.id);
      
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
      onTransactionUpdate();
    } catch (err: any) {
      console.error('Error deleting sales transaction:', err);
      alert(err.message || 'Failed to delete sales transaction');
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
          No sales transactions yet. Create your first sale above!
        </Typography>
      </Paper>
    );
  }

  return (
    <>
      <Paper sx={{ p: { xs: 1, sm: 2 } }}>
        <Typography 
          variant="h6" 
          gutterBottom
          sx={{ 
            px: { xs: 1, sm: 0 },
            fontSize: { xs: '1.125rem', sm: '1.25rem' }
          }}
        >
          Sales History
        </Typography>
        
        <Box
          ref={scrollContainerRef}
          sx={{
            maxHeight: '600px',
            overflowY: 'auto',
          }}
        >
          <List sx={{ pt: 0 }}>
          {transactions.map((transaction, index) => {
            const transactionDate = new Date(transaction.date);
            const formattedDate = format(transactionDate, 'MMM d, yyyy');
            
            // Debug logging
            console.log('Transaction:', transaction.item, 'Quantity:', transaction.quantity, 'Type:', typeof transaction.quantity);

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

                  {/* Item Name - Full Row */}
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: { xs: '0.938rem', sm: '1rem' },
                      lineHeight: 1.5,
                      fontWeight: 'bold',
                      mb: 0.5
                    }}
                  >
                    {transaction.item}
                  </Typography>

                  {/* Price and Quantity - Next Row */}
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: transaction.seller || transaction.description ? 1 : 0 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: 'primary.main',
                        fontSize: { xs: '1.25rem', sm: '1.5rem' }
                      }}
                    >
                      ${(transaction.price * (transaction.quantity || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      {(transaction.quantity || 1) > 1 && (
                        <Typography 
                          component="span" 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ ml: 1, fontSize: { xs: '0.813rem', sm: '0.875rem' } }}
                        >
                          (${transaction.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per unit)
                        </Typography>
                      )}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}
                    >
                      × {transaction.quantity || 1}
                    </Typography>
                  </Box>

                  {/* Seller Info */}
                  {transaction.seller && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        mb: transaction.description ? 1 : 0,
                        fontSize: { xs: '0.813rem', sm: '0.875rem' }
                      }}
                    >
                      Sold by: {transaction.seller.charAt(0).toUpperCase() + transaction.seller.slice(1)}
                    </Typography>
                  )}

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
                {index < transactions.length - 1 && <Divider />}
              </React.Fragment>
            );
          })}
        </List>
        </Box>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Sales Transaction</DialogTitle>
        <DialogContent>
          <Typography>
            Delete this sales transaction?
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

export default SalesTransactionList;
