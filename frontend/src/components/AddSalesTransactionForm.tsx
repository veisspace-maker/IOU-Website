import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TransitionProps } from '@mui/material/transitions';
import { format } from 'date-fns';
import { createSale, CreateSaleData } from '../api/salesApi';
import { getSalesItems, SalesItem } from '../api/salesItemsApi';

interface AddSalesTransactionFormProps {
  onTransactionCreated: () => void;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="down" ref={ref} {...props} />;
});

const AddSalesTransactionForm: React.FC<AddSalesTransactionFormProps> = ({
  onTransactionCreated,
}) => {
  const [salesItems, setSalesItems] = useState<SalesItem[]>([]);
  const [item, setItem] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [date, setDate] = useState<Date | null>(new Date());
  const [description, setDescription] = useState<string>('');
  const [seller, setSeller] = useState<string>('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load sales items on mount
  useEffect(() => {
    loadSalesItems();
  }, []);

  const loadSalesItems = async () => {
    try {
      const items = await getSalesItems();
      setSalesItems(items);
    } catch (error) {
      console.error('Error loading sales items:', error);
    }
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
      const saleData: CreateSaleData = {
        item: item.trim(),
        price: pricePerUnit,
        quantity: quantityValue,
        date: format(date, 'yyyy-MM-dd'),
        seller: seller,
      };

      // Add description if provided
      if (description.trim()) {
        saleData.description = description.trim();
      }

      // Debug logging
      console.log('Creating sale with data:', saleData);

      // Create sale transaction
      await createSale(saleData);

      // Clear form after successful submission
      setItem('');
      setPrice('');
      setQuantity('1');
      setDate(new Date());
      setDescription('');
      setSeller('');
      
      // Notify parent to trigger refresh
      onTransactionCreated();
    } catch (error: any) {
      console.error('Error creating sale:', error);
      setErrorMessage(error.message || 'Failed to create sales transaction');
      setShowError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseError = () => {
    setShowError(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !submitting && item.trim() && price && date && seller) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          p: 3,
          animation: 'slideDown 0.3s ease-out',
          '@keyframes slideDown': {
            from: {
              opacity: 0,
              transform: 'translateY(-20px)',
            },
            to: {
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
        }}
        onKeyPress={handleKeyPress}
      >
        <Typography variant="h6" gutterBottom>
          Add Sales Transaction
        </Typography>

        <FormControl fullWidth required sx={{ mb: 2 }}>
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

        <Autocomplete
          freeSolo
          options={salesItems.map((item) => item.name)}
          value={item}
          onChange={(event, newValue) => {
            setItem(newValue || '');
          }}
          onInputChange={(event, newInputValue) => {
            setItem(newInputValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Item"
              required
              placeholder="Select or type item name"
              sx={{ mb: 2 }}
            />
          )}
        />

        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
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
              sx: { mb: 2 },
            },
          }}
        />

        <TextField
          label="Description (Optional)"
          value={description}
          onChange={handleDescriptionChange}
          fullWidth
          sx={{ mb: 2 }}
          placeholder="e.g., Additional details about the sale"
          multiline
          rows={2}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={submitting || !item.trim() || !price || !date || !seller}
          fullWidth
        >
          {submitting ? 'Saving...' : 'Add Sale'}
        </Button>
      </Paper>

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

export default AddSalesTransactionForm;
