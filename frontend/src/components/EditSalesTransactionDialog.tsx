import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Slide,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TransitionProps } from '@mui/material/transitions';
import { format } from 'date-fns';
import { updateSale, UpdateSaleData, SalesTransaction } from '../api/salesApi';

interface EditSalesTransactionDialogProps {
  open: boolean;
  transaction: SalesTransaction | null;
  onClose: () => void;
  onTransactionUpdated: () => void;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="down" ref={ref} {...props} />;
});

const EditSalesTransactionDialog: React.FC<EditSalesTransactionDialogProps> = ({
  open,
  transaction,
  onClose,
  onTransactionUpdated,
}) => {
  const [item, setItem] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [date, setDate] = useState<Date | null>(null);
  const [description, setDescription] = useState<string>('');
  const [seller, setSeller] = useState<string>('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Populate form when transaction changes
  useEffect(() => {
    if (transaction && open) {
      setItem(transaction.item || '');
      // Calculate total price from per-unit price
      const totalPrice = (transaction.price || 0) * (transaction.quantity || 1);
      setPrice(totalPrice.toString());
      setQuantity(transaction.quantity?.toString() || '1');
      setDate(transaction.date ? new Date(transaction.date) : null);
      setDescription(transaction.description || '');
      setSeller(transaction.seller || '');
    } else if (!open) {
      // Reset form when dialog closes
      setItem('');
      setPrice('');
      setQuantity('1');
      setDate(null);
      setDescription('');
      setSeller('');
    }
  }, [transaction, open]);

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setItem(e.target.value);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrice(e.target.value);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuantity(e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
  };

  const handleSubmit = async () => {
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

      // Close dialog and notify parent
      onClose();
      onTransactionUpdated();
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

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Sales Transaction</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
            <TextField
              label="Item"
              value={item}
              onChange={handleItemChange}
              fullWidth
              required
              placeholder="e.g., Product A, Service B"
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Total Price ($)"
                type="number"
                value={price}
                onChange={handlePriceChange}
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
                required
                helperText={
                  price && quantity && parseFloat(price) > 0 && parseInt(quantity) > 1
                    ? `$${(parseFloat(price) / parseInt(quantity)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per unit`
                    : ''
                }
              />

              <TextField
                label="Quantity"
                type="number"
                value={quantity}
                onChange={handleQuantityChange}
                sx={{ width: '150px' }}
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
              onChange={handleDescriptionChange}
              fullWidth
              placeholder="e.g., Additional details about the sale"
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={submitting || !item.trim() || !price || !date || !seller}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Dialog */}
      <Dialog
        open={showError}
        onClose={handleCloseError}
        TransitionComponent={Transition}
      >
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

export default EditSalesTransactionDialog;
