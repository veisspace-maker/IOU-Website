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
import { format, parseISO } from 'date-fns';
import { useLocation } from 'react-router-dom';
import { useScrollPreservation } from '../hooks/useScrollPreservation';

interface ClosedDate {
  id: string;
  startDate: string;
  endDate: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

interface OverlapInfo {
  overlapping: ClosedDate[];
}

interface ConflictInfo {
  conflicting: Array<{
    id: string;
    userId: string;
    startDate: string;
    endDate: string;
    businessDays: number;
  }>;
}

const ClosedDatesManager: React.FC = () => {
  const location = useLocation();
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [note, setNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showOverlapDialog, setShowOverlapDialog] = useState(false);
  const [overlapInfo, setOverlapInfo] = useState<OverlapInfo | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictInfo, setConflictInfo] = useState<ConflictInfo | null>(null);
  const [showPastDateWarning, setShowPastDateWarning] = useState(false);

  // Scroll preservation
  const scrollContainerRef = useScrollPreservation([closedDates]);

  useEffect(() => {
    fetchClosedDates();
  }, []);

  // Handle navigation state from calendar selection
  useEffect(() => {
    const state = location.state as {
      startDate?: string;
      endDate?: string;
      note?: string;
      editId?: string;
    } | null;

    if (state) {
      if (state.startDate) {
        setStartDate(parseISO(state.startDate));
      }
      if (state.endDate) {
        setEndDate(parseISO(state.endDate));
      }
      if (state.note) {
        setNote(state.note);
      }
      if (state.editId) {
        setEditingId(state.editId);
      }

      // Clear the state after reading to prevent re-population on re-render
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchClosedDates = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/closed-dates', {
        withCredentials: true
      });
      // Backend returns { closedDates: [...] }
      const closedDatesData = response.data.closedDates || response.data;
      setClosedDates(Array.isArray(closedDatesData) ? closedDatesData : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching closed dates:', err);
      setError('Failed to load closed dates');
    } finally {
      setLoading(false);
    }
  };

  const checkOverlap = async (start: Date, end: Date): Promise<OverlapInfo | null> => {
    try {
      const response = await axios.post(
        '/api/closed-dates/check-overlap',
        { startDate: format(start, 'yyyy-MM-dd'), endDate: format(end, 'yyyy-MM-dd') },
        { withCredentials: true }
      );
      // Backend returns { hasOverlap, overlappingPeriods, message }
      return {
        overlapping: response.data.overlappingPeriods || []
      };
    } catch (err) {
      console.error('Error checking overlap:', err);
      return null;
    }
  };

  const checkLeaveConflict = async (start: Date, end: Date): Promise<ConflictInfo | null> => {
    try {
      const response = await axios.post(
        '/api/closed-dates/check-leave-conflict',
        { startDate: format(start, 'yyyy-MM-dd'), endDate: format(end, 'yyyy-MM-dd') },
        { withCredentials: true }
      );
      // Backend returns { hasConflict, conflictingLeave, message }
      return {
        conflicting: response.data.conflictingLeave || []
      };
    } catch (err) {
      console.error('Error checking leave conflict:', err);
      return null;
    }
  };

  const isPastDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate) {
      setError('Start date and end date are required');
      return;
    }

    if (startDate > endDate) {
      setError('Start date must be before or equal to end date');
      return;
    }

    // Check for past dates
    if (isPastDate(startDate)) {
      setShowPastDateWarning(true);
      return;
    }

    await performSubmit();
  };

  const confirmPastDateSubmit = async () => {
    setShowPastDateWarning(false);
    await performSubmit();
  };

  const performSubmit = async () => {
    if (!startDate || !endDate) {
      setError('Start date and end date are required');
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      // Check for overlaps
      const overlapResult = await checkOverlap(startDate, endDate);
      if (overlapResult && overlapResult.overlapping.length > 0) {
        setOverlapInfo(overlapResult);
        setShowOverlapDialog(true);
        return;
      }

      // Check for leave conflicts
      const conflictResult = await checkLeaveConflict(startDate, endDate);
      if (conflictResult && conflictResult.conflicting.length > 0) {
        setConflictInfo(conflictResult);
        setShowConflictDialog(true);
        return;
      }

      // No conflicts, proceed with save
      await saveClosedDate();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to save closed date';
      setError(errorMessage);
    }
  };

  const saveClosedDate = async () => {
    if (!startDate || !endDate) return;

    try {
      if (editingId) {
        await axios.put(
          `/api/closed-dates/${editingId}`,
          { startDate: format(startDate, 'yyyy-MM-dd'), endDate: format(endDate, 'yyyy-MM-dd'), note: note || undefined },
          { withCredentials: true }
        );
        setSuccess('Closed date updated successfully');
      } else {
        await axios.post(
          '/api/closed-dates',
          { startDate: format(startDate, 'yyyy-MM-dd'), endDate: format(endDate, 'yyyy-MM-dd'), note: note || undefined },
          { withCredentials: true }
        );
        setSuccess('Closed date added successfully');
      }

      // Reset form
      setStartDate(null);
      setEndDate(null);
      setNote('');
      setEditingId(null);

      // Refresh list
      await fetchClosedDates();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to save closed date';
      setError(errorMessage);
    }
  };

  const handleKeepSeparate = async () => {
    setShowOverlapDialog(false);
    setOverlapInfo(null);
    await saveClosedDate();
  };

  const handleMerge = async () => {
    setShowOverlapDialog(false);
    
    if (!overlapInfo || overlapInfo.overlapping.length === 0 || !startDate || !endDate) return;

    // Find the earliest start and latest end
    const allDates = [
      { start: startDate, end: endDate },
      ...overlapInfo.overlapping.map(cd => ({
        start: parseISO(cd.startDate),
        end: parseISO(cd.endDate)
      }))
    ];

    const mergedStart = new Date(Math.min(...allDates.map(d => d.start.getTime())));
    const mergedEnd = new Date(Math.max(...allDates.map(d => d.end.getTime())));

    // Delete overlapping entries
    for (const cd of overlapInfo.overlapping) {
      await axios.delete(`/api/closed-dates/${cd.id}`, { withCredentials: true });
    }

    // Create merged entry
    setStartDate(mergedStart);
    setEndDate(mergedEnd);
    setOverlapInfo(null);
    
    await saveClosedDate();
  };

  const confirmLeaveConflict = async () => {
    setShowConflictDialog(false);
    setConflictInfo(null);
    await saveClosedDate();
  };

  const handleEdit = (closedDate: ClosedDate) => {
    setEditingId(closedDate.id);
    setStartDate(parseISO(closedDate.startDate));
    setEndDate(parseISO(closedDate.endDate));
    setNote(closedDate.note || '');
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
      await axios.delete(`/api/closed-dates/${deleteId}`, { withCredentials: true });
      setSuccess('Closed date deleted successfully');
      await fetchClosedDates();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to delete closed date';
      setError(errorMessage);
    } finally {
      setShowDeleteConfirm(false);
      setDeleteId(null);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setStartDate(null);
    setEndDate(null);
    setNote('');
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
          {editingId ? 'Edit Closed Period' : 'Add Closed Period'}
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

        <DatePicker
          label="Start Date"
          value={startDate}
          onChange={(newValue) => setStartDate(newValue)}
          slotProps={{
            textField: {
              fullWidth: true,
              sx: { mb: 2 },
            },
          }}
        />

        <DatePicker
          label="End Date"
          value={endDate}
          onChange={(newValue) => setEndDate(newValue)}
          minDate={startDate || undefined}
          slotProps={{
            textField: {
              fullWidth: true,
              sx: { mb: 2 },
            },
          }}
        />

        <TextField
          fullWidth
          label="Note (Optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          multiline
          rows={2}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!startDate || !endDate}
          >
            {editingId ? 'Update' : 'Add'} Closed Period
          </Button>
          {editingId && (
            <Button onClick={handleCancel} sx={{ color: 'text.secondary', borderColor: 'text.secondary' }}>
              Cancel
            </Button>
          )}
        </Box>
      </Paper>

      {/* List of Closed Dates */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Closed Periods
        </Typography>

        {closedDates.length === 0 ? (
          <Typography color="text.secondary">
            No closed periods defined
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
            {closedDates.map((cd) => (
              <Paper
                key={cd.id}
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
                    {format(parseISO(cd.startDate), 'MMM dd, yyyy')} → {format(parseISO(cd.endDate), 'MMM dd, yyyy')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {cd.note || 'No note'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton onClick={() => handleEdit(cd)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(cd.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Paper>

      {/* Dialogs */}
      <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this closed period?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showOverlapDialog} onClose={() => setShowOverlapDialog(false)}>
        <DialogTitle>Overlapping Closed Periods</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            This period overlaps with existing closed periods:
          </DialogContentText>
          {overlapInfo?.overlapping.map((cd) => (
            <Typography key={cd.id} variant="body2" sx={{ mb: 1 }}>
              • {format(parseISO(cd.startDate), 'MMM dd, yyyy')} → {format(parseISO(cd.endDate), 'MMM dd, yyyy')}
              {cd.note && ` (${cd.note})`}
            </Typography>
          ))}
          <DialogContentText sx={{ mt: 2 }}>
            Would you like to merge them or keep them separate?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowOverlapDialog(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button onClick={handleKeepSeparate} sx={{ color: 'text.primary', borderColor: 'text.primary' }}>
            Keep Separate
          </Button>
          <Button onClick={handleMerge} variant="contained" sx={{ bgcolor: '#9e9e9e', '&:hover': { bgcolor: '#757575' } }}>
            Merge
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showConflictDialog} onClose={() => setShowConflictDialog(false)}>
        <DialogTitle>Leave Conflict Warning</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            This closed period conflicts with existing leave records:
          </DialogContentText>
          {conflictInfo?.conflicting.map((leave) => (
            <Typography key={leave.id} variant="body2" sx={{ mb: 1 }}>
              • {format(parseISO(leave.startDate), 'MMM dd, yyyy')} → {format(parseISO(leave.endDate), 'MMM dd, yyyy')}
              {' '}({leave.businessDays} business days)
            </Typography>
          ))}
          <DialogContentText sx={{ mt: 2 }}>
            Adding this closed period will affect the business day calculations for these leave records. Continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConflictDialog(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button onClick={confirmLeaveConflict} variant="contained" sx={{ bgcolor: '#9e9e9e', '&:hover': { bgcolor: '#757575' } }}>
            Continue Anyway
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showPastDateWarning} onClose={() => setShowPastDateWarning(false)}>
        <DialogTitle>Past Date Warning</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The start date is in the past. Are you sure you want to add this closed period?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPastDateWarning(false)} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button onClick={confirmPastDateSubmit} variant="contained" sx={{ bgcolor: '#9e9e9e', '&:hover': { bgcolor: '#757575' } }}>
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClosedDatesManager;
