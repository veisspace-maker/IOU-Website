import React from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { SalesTransaction } from '../api/salesApi';
import { filterByItem } from '../utils/salesUtils';
import SalesTransactionList from './SalesTransactionList';

interface DrillDownViewProps {
  item: string;
  transactions: SalesTransaction[];
  onClose: () => void;
  onTransactionUpdate: () => void;
  onEdit: (transaction: SalesTransaction) => void;
}

const DrillDownView: React.FC<DrillDownViewProps> = ({
  item,
  transactions,
  onClose,
  onTransactionUpdate,
  onEdit,
}) => {
  // Filter transactions for the selected item
  const filteredTransactions = filterByItem(transactions, item);

  // Calculate statistics for the selected item
  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.price, 0);
  const count = filteredTransactions.length;

  return (
    <Box>
      {/* Header with back button */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <IconButton
          onClick={onClose}
          sx={{
            backgroundColor: 'background.paper',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
          {item}
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Count
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {count}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtered Transaction List */}
      <SalesTransactionList
        transactions={filteredTransactions}
        loading={false}
        error={null}
        onTransactionUpdate={onTransactionUpdate}
        onEdit={onEdit}
      />
    </Box>
  );
};

export default DrillDownView;
