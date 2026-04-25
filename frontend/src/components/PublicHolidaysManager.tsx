import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { useScrollPreservation } from '../hooks/useScrollPreservation';

interface PublicHoliday {
  id: string;
  name: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

const PublicHolidaysManager: React.FC = () => {
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Scroll preservation
  const scrollContainerRef = useScrollPreservation([holidays]);
  
  // Import dialog state
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importYear, setImportYear] = useState(new Date().getFullYear().toString());
  const [importCountry, setImportCountry] = useState('AU'); // Default to Australia
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/holidays', {
        withCredentials: true
      });
      
      // Backend returns { holidays: [...] }
      const holidaysData = response.data.holidays || response.data;
      const holidaysArray = Array.isArray(holidaysData) ? holidaysData : [];
      
      // Sort by date
      const sortedHolidays = holidaysArray.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      setHolidays(sortedHolidays);
      setError(null);
    } catch (err) {
      console.error('Error fetching holidays:', err);
      setError('Failed to load public holidays');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !date) {
      setError('Name and date are required');
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      if (editingId) {
        await axios.put(
          `/api/holidays/${editingId}`,
          { name, date: format(date, 'yyyy-MM-dd') },
          { withCredentials: true }
        );
        setSuccess('Holiday updated successfully');
      } else {
        await axios.post(
          '/api/holidays',
          { name, date: format(date, 'yyyy-MM-dd') },
          { withCredentials: true }
        );
        setSuccess('Holiday added successfully');
      }

      // Reset form
      setName('');
      setDate(null);
      setEditingId(null);

      // Refresh list
      await fetchHolidays();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to save holiday';
      setError(errorMessage);
    }
  };

  const handleEdit = (holiday: PublicHoliday) => {
    setEditingId(holiday.id);
    setName(holiday.name);
    setDate(parseISO(holiday.date));
    setError(null);
    setSuccess(null);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await axios.delete(`/api/holidays/${deleteId}`, { withCredentials: true });
      setSuccess('Holiday deleted successfully');
      await fetchHolidays();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to delete holiday';
      setError(errorMessage);
    } finally {
      setShowDeleteConfirm(false);
      setDeleteId(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
    setDate(null);
    setError(null);
    setSuccess(null);
  };

  const handleImportHolidays = async () => {
    setImporting(true);
    setImportResult(null);
    setError(null);

    try {
      const response = await axios.post(
        '/api/holiday-import/import',
        {
          year: parseInt(importYear),
          countryCode: importCountry,
        },
        { withCredentials: true }
      );

      const { inserted, skipped } = response.data;
      setImportResult(`Successfully imported ${inserted} holidays. ${skipped} were skipped (already exist).`);
      setSuccess(`Imported ${inserted} holidays`);
      await fetchHolidays();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to import holidays';
      setError(errorMessage);
      setImportResult(null);
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Add/Edit Form */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {editingId ? 'Edit Public Holiday' : 'Add Public Holiday'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Holiday Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2 }}
          placeholder="e.g., New Year's Day"
        />

        <DatePicker
          label="Date"
          value={date}
          onChange={(newValue) => setDate(newValue)}
          slotProps={{
            textField: {
              fullWidth: true,
              sx: { mb: 2 },
            },
          }}
        />

        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!name.trim() || !date}
          >
            {editingId ? 'Update' : 'Add'} Holiday
          </Button>
          {editingId && (
            <Button onClick={handleCancel} sx={{ color: 'text.secondary', borderColor: 'text.secondary' }}>
              Cancel
            </Button>
          )}
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setShowImportDialog(true)}
            sx={{ ml: { xs: 0, sm: 'auto' } }}
          >
            Import Holidays from Web
          </Button>
        </Box>
      </Paper>

      {/* List of Holidays */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Public Holidays
        </Typography>

        {holidays.length === 0 ? (
          <Typography color="text.secondary">
            No public holidays defined
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {holidays.map((holiday) => (
              <Paper
                key={holiday.id}
                elevation={1}
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  '&:hover': {
                    elevation: 3,
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {holiday.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {format(parseISO(holiday.date), 'MMMM dd, yyyy')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton onClick={() => handleEdit(holiday)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(holiday.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this public holiday? This will affect leave calculations.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Holidays Dialog */}
      <Dialog open={showImportDialog} onClose={() => !importing && setShowImportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Public Holidays</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Automatically import public holidays from the web for a specific year and country.
          </DialogContentText>

          {importResult && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {importResult}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Year"
            type="number"
            value={importYear}
            onChange={(e) => setImportYear(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            label="Country Code"
            value={importCountry}
            onChange={(e) => setImportCountry(e.target.value.toUpperCase())}
            sx={{ mb: 2 }}
            placeholder="e.g., AU, US, GB, CA"
            helperText="Use 2-letter country code (AU=Australia, US=USA, GB=UK, CA=Canada, etc.)"
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowImportDialog(false)} disabled={importing} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleImportHolidays} 
            variant="contained" 
            disabled={importing || !importYear || !importCountry}
            sx={{ bgcolor: '#9e9e9e', '&:hover': { bgcolor: '#757575' } }}
          >
            {importing ? <CircularProgress size={24} /> : 'Import'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PublicHolidaysManager;
