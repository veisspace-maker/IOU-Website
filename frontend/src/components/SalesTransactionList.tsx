import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  Paper,
  CircularProgress,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import { SalesTransaction, deleteSale, updateSale, UpdateSaleData } from '../api/salesApi';
import { useScrollPreservation } from '../hooks/useScrollPreservation';

interface SalesTransactionListProps {
  transactions: SalesTransaction[];
  loading: boolean;
  error: string | null;
  onTransactionUpdate: () => void;
}

const SalesTransactionList: React.FC<SalesTransactionListProps> = ({
  transactions,
  loading,
  error,
  onTransactionUpdate,
}) => {
  // Expanded transaction state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Edit form state
  const [item, setItem] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [date, setDate] = useState<Date | null>(null);
  const [description, setDescription] = useState<string>('');
  const [seller, setSeller] = useState<string>('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<SalesTransaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Scroll preservation
  const scrollContainerRef = useScrollPreservation([transactions]);

  const handleTransactionClick = (transaction: SalesTransaction) => {
    if (expandedId === transaction.id) {
      // Collapse if already expanded
      setExpandedId(null);
    } else {
      // Expand and populate form
      setExpandedId(transaction.id);
      setItem(transaction.item || '');
      const totalPrice = (transaction.price || 0) * (transaction.quantity || 1);
      setPrice(totalPrice.toString());
      setQuantity(transaction.quantity?.toString() || '1');
      setDate(transaction.date ? new Date(transaction.date) : null);
      setDescription(transaction.description || '');
      setSeller(transaction.seller || '');
      setShowError(false);
    }
  };

  const handleDeleteClick = (transaction: SalesTransaction, e: React.MouseEvent) => {
    e.stopPropagation();
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
      setExpandedId(null);
      onTransactionUpdate();
    } catch (err: any) {
      console.error('Error deleting sales transaction:', err);
      alert(err.message || 'Failed to delete sales transaction');
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    const transaction = transactions.find(t => t.id === expandedId);
    if (!transaction) return;

    // Validate item name
    if (!item.trim()) {
      setErrorMessage('Item name is required');
      setShowError(true);
      return;
    }

    // Validate seller
    if (!seller) {
      setErrorMessage('Seller is required');
      setShowError(true);
      return;
    }

    // Validate price
    const priceValue = parseFloat(price);
    
    if (isNaN(priceValue) || priceValue <= 0) {
      setErrorMessage('Price must be a positive number greater than zero');
      setShowError(true);
      return;
    }

    // Validate quantity
    const quantityValue = parseInt(quantity);
    
    if (isNaN(quantityValue) || quantityValue <= 0) {
      setErrorMessage('Quantity must be a positive integer');
      setShowError(true);
      return;
    }

    // Validate date
    if (!date) {
      setErrorMessage('Date is required');
      setShowError(true);
      return;
    }

    try {
      setSubmitting(true);
      
      // Calculate price per unit from total price
      const pricePerUnit = priceValue / quantityValue;

      // Prepare data for API
      const updateData: UpdateSaleData = {
        item: item.trim(),
        price: pricePerUnit,
        quantity: quantityValue,
        date: format(date, 'yyyy-MM-dd'),
        seller: seller,
      };

      // Add description if provided
      if (description.trim()) {
        updateData.description = description.trim();
      }

      // Update sale transaction
      await updateSale(transaction.id, updateData);

      // Close dropdown and notify parent
      setExpandedId(null);
      onTransactionUpdate();
    } catch (error: any) {
      console.error('Error updating sale:', error);
      setErrorMessage(error.message || 'Failed to update sales transaction');
      setShowError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseError = () => {
    setShowError(false);
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
            const isExpanded = expandedId === transaction.id;

            return (
              <React.Fragment key={transaction.id}>
                <ListItem
                  sx={{
                    display: 'block',
                    py: { xs: 2.5, sm: 2 },
                    px: { xs: 1.5, sm: 2 },
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                  onClick={() => handleTransactionClick(transaction)}
                >
                  {/* Header: Date and Expand Icon */}
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

                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
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

                  {/* Expanded Edit Form */}
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Box 
                      sx={{ 
                        mt: 3, 
                        pt: 3, 
                        borderTop: '1px solid',
                        borderColor: 'divider',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
                        Edit Sales Transaction
                      </Typography>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                          label="Item"
                          value={item}
                          onChange={(e) => setItem(e.target.value)}
                          fullWidth
                          required
                          placeholder="e.g., Product A, Service B"
                        />
                        
                        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                          <TextField
                            label="Total Price ($)"
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            fullWidth
                            inputProps={{ min: 0, step: 0.01 }}
                            required
                            helperText={
                              price && quantity && parseFloat(price) > 0 && parseInt(quantity) > 1
                                ? `${(parseFloat(price) / parseInt(quantity)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per unit`
                                : ''
                            }
                          />

                          <TextField
                            label="Quantity"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            sx={{ width: { xs: '100%', sm: '150px' } }}
                            inputProps={{ min: 1, step: 1 }}
                            required
                          />
                        </Box>

                        <DatePicker
                          label="Date"
                          value={date}
                          onChange={(newValue) => setDate(newValue)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              required: true,
                            },
                          }}
                        />

                        <FormControl fullWidth required>
                          <InputLabel>Seller</InputLabel>
                          <Select
                            value={seller}
                            label="Seller"
                            onChange={(e) => setSeller(e.target.value)}
                          >
                            <MenuItem value="leva">Leva</MenuItem>
                            <MenuItem value="danik">Danik</MenuItem>
                          </Select>
                        </FormControl>

                        <TextField
                          label="Description (Optional)"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          fullWidth
                          placeholder="e.g., Additional details about the sale"
                          multiline
                          rows={2}
                        />

                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(transaction, e);
                            }}
                            color="error"
                            disabled={submitting}
                          >
                            Delete
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedId(null);
                            }}
                            disabled={submitting}
                            sx={{ color: 'text.secondary' }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveEdit();
                            }}
                            variant="contained"
                            color="primary"
                            disabled={submitting || !item.trim() || !price || !date || !seller}
                          >
                            {submitting ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </Collapse>
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

      {/* Error Dialog */}
      <Dialog open={showError} onClose={handleCloseError}>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <Typography>{errorMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseError} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SalesTransactionList;
