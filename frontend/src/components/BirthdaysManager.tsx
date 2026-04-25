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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';
import { format, parseISO, differenceInYears } from 'date-fns';
import { useScrollPreservation } from '../hooks/useScrollPreservation';

interface Birthday {
  id: string;
  name: string;
  dateOfBirth: string;
  createdAt: string;
  updatedAt: string;
}

const BirthdaysManager: React.FC = () => {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showEditConfirm, setShowEditConfirm] = useState(false);

  // Scroll preservation
  const scrollContainerRef = useScrollPreservation([birthdays]);

  useEffect(() => {
    fetchBirthdays();
  }, []);

  const fetchBirthdays = async () => {
    try {
      setLoading(true);
      const response = await axios.get<{ birthdays: Birthday[] }>('/api/birthdays', {
        withCredentials: true
      });
      
      // Sort by name
      const sortedBirthdays = response.data.birthdays.sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      
      setBirthdays(sortedBirthdays);
      setError(null);
    } catch (err) {
      console.error('Error fetching birthdays:', err);
      setError('Failed to load birthdays');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob: string): number => {
    return differenceInYears(new Date(), parseISO(dob));
  };

  const handleSubmit = async () => {
    if (!name.trim() || !dateOfBirth) {
      setError('Name and date of birth are required');
      return;
    }

    if (editingId) {
      setShowEditConfirm(true);
    } else {
      await performSubmit();
    }
  };

  const performSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!dateOfBirth) {
      setError('Date of birth is required');
      return;
    }

    try {
      if (editingId) {
        await axios.put(
          `/api/birthdays/${editingId}`,
          { name, dateOfBirth: format(dateOfBirth, 'yyyy-MM-dd') },
          { withCredentials: true }
        );
        setSuccess('Birthday updated successfully');
      } else {
        const response = await axios.post(
          '/api/birthdays',
          { name, dateOfBirth: format(dateOfBirth, 'yyyy-MM-dd') },
          { withCredentials: true }
        );
        console.log('Birthday created:', response.data);
        setSuccess('Birthday added successfully');
      }

      // Reset form
      setName('');
      setDateOfBirth(null);
      setEditingId(null);

      // Refresh list
      await fetchBirthdays();
    } catch (err: any) {
      console.error('Error saving birthday:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      const errorMessage = err.response?.data?.error || 'Failed to save birthday';
      setError(errorMessage);
    }
  };

  const confirmEdit = async () => {
    setShowEditConfirm(false);
    await performSubmit();
  };

  const handleEdit = (birthday: Birthday) => {
    setEditingId(birthday.id);
    setName(birthday.name);
    setDateOfBirth(parseISO(birthday.dateOfBirth));
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
      await axios.delete(`/api/birthdays/${deleteId}`, { withCredentials: true });
      setSuccess('Birthday deleted successfully');
      await fetchBirthdays();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to delete birthday';
      setError(errorMessage);
    } finally {
      setShowDeleteConfirm(false);
      setDeleteId(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
    setDateOfBirth(null);
    setError(null);
    setSuccess(null);
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
          {editingId ? 'Edit Birthday' : 'Add Birthday'}
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
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2 }}
          placeholder="e.g., John Doe"
        />

        <DatePicker
          label="Date of Birth"
          value={dateOfBirth}
          onChange={(newValue) => setDateOfBirth(newValue)}
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
            disabled={!name.trim() || !dateOfBirth}
          >
            {editingId ? 'Update' : 'Add'} Birthday
          </Button>
          {editingId && (
            <Button onClick={handleCancel} sx={{ color: 'text.secondary', borderColor: 'text.secondary' }}>
              Cancel
            </Button>
          )}
        </Box>
      </Paper>

      {/* List of Birthdays */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Birthdays
        </Typography>

        {birthdays.length === 0 ? (
          <Typography color="text.secondary">
            No birthdays defined
          </Typography>
        ) : (
          <Box
            ref={scrollContainerRef}
            sx={{
              maxHeight: '500px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {birthdays.map((birthday) => {
              const age = calculateAge(birthday.dateOfBirth);
              return (
                <Paper
                  key={birthday.id}
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
                      {birthday.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {format(parseISO(birthday.dateOfBirth), 'dd/MM/yyyy')} (Age: {age})
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton onClick={() => handleEdit(birthday)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(birthday.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </Paper>

      {/* Edit Confirmation Dialog */}
      <Dialog open={showEditConfirm} onClose={() => setShowEditConfirm(false)}>
        <DialogTitle>Confirm Edit</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to update this birthday?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditConfirm(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button onClick={confirmEdit} variant="contained" sx={{ bgcolor: '#9e9e9e', '&:hover': { bgcolor: '#757575' } }}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this birthday?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BirthdaysManager;
