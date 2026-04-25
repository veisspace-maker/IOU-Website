import React, { useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Tabs, Tab, Paper, Snackbar, Alert, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SalesTransaction } from '../api/salesApi';
import AddSalesTransactionForm from '../components/AddSalesTransactionForm';
import SalesTransactionList from '../components/SalesTransactionList';
import ItemFilter from '../components/ItemFilter';
import { filterByItem } from '../utils/salesUtils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`sales-tabpanel-${index}`}
      aria-labelledby={`sales-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const SalesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [transactions, setTransactions] = useState<SalesTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleBack = () => {
    navigate('/');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Fetch sales transactions on mount
  useEffect(() => {
    loadTransactions(false);
  }, []);

  const loadTransactions = async (append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setTransactions([]);
      }
      setError(null);
      
      const offset = append ? transactions.length : 0;
      const limit = 50;
      
      const response = await fetch(`/api/sales?limit=${limit}&offset=${offset}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch sales transactions');
      }
      
      const data = await response.json();
      
      if (append) {
        setTransactions(prev => [...prev, ...data.transactions]);
      } else {
        setTransactions(data.transactions);
      }
      
      setHasMore(data.transactions.length === limit && (offset + limit) < data.total);
    } catch (err: any) {
      console.error('Error loading sales transactions:', err);
      setError(err.message || 'Failed to load sales transactions');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    loadTransactions(true);
  };

  const handleTransactionCreated = () => {
    // Refresh transaction list after successful creation
    loadTransactions(false);
    // Show success feedback
    setSuccessMessage('Sales transaction created successfully!');
  };

  const handleTransactionUpdate = () => {
    // Refresh transaction list after update or deletion
    loadTransactions(false);
    // Show success feedback
    setSuccessMessage('Sales transaction updated successfully!');
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
  };

  // Apply filter to transactions
  const filteredTransactions = filterByItem(transactions, selectedFilter);

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
            Sales Tracker
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ 
              mr: 2,
              display: { xs: 'none', sm: 'block' }
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
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Tabs */}
        <Paper elevation={1} sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="sales tabs"
            variant="fullWidth"
          >
            <Tab label="Transactions" id="sales-tab-0" aria-controls="sales-tabpanel-0" />
            <Tab label="Stats" id="sales-tab-1" aria-controls="sales-tabpanel-1" />
          </Tabs>
        </Paper>

        {/* Transactions Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ mb: 3 }}>
            <AddSalesTransactionForm onTransactionCreated={handleTransactionCreated} />
          </Box>

          <Box sx={{ mb: 3 }}>
            <ItemFilter
              transactions={transactions}
              selectedFilter={selectedFilter}
              onFilterChange={handleFilterChange}
            />
          </Box>

          <SalesTransactionList
            transactions={filteredTransactions}
            loading={loading}
            error={error}
            onTransactionUpdate={handleTransactionUpdate}
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
        </TabPanel>

        {/* Stats Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Sales Statistics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sales statistics and analysis will be implemented here.
          </Typography>
        </TabPanel>
      </Box>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SalesPage;
