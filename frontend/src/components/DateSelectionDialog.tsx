import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import { format } from 'date-fns';
import axios from 'axios';

interface DateSelectionDialogProps {
  open: boolean;
  startDate: Date;
  endDate: Date;
  selectedPersonId?: string | null;
  onConfirm: (note: string) => void;
  onCancel: () => void;
  onLeaveBooked?: () => void;
}

const DateSelectionDialog: React.FC<DateSelectionDialogProps> = ({
  open,
  startDate,
  endDate,
  selectedPersonId,
  onConfirm,
  onCancel,
  onLeaveBooked,
}) => {
  const [note, setNote] = useState('');
  const [businessDays, setBusinessDays] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLeaveMode = selectedPersonId !== null && selectedPersonId !== undefined;

  // Calculate business days when dialog opens in leave mode
  useEffect(() => {
    const calculateBusinessDays = async () => {
      if (!open || !isLeaveMode || !startDate || !endDate) {
        setBusinessDays(null);
        return;
      }

      try {
        setCalculating(true);
        setError(null);
        const response = await axios.post<{ businessDays: number }>(
          '/api/leave/calculate-business-days',
          {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          { withCredentials: true }
        );
        setBusinessDays(response.data.businessDays);
      } catch (err: any) {
        console.error('Error calculating business days:', err);
        setError(err.response?.data?.error || 'Failed to calculate business days');
        setBusinessDays(null);
      } finally {
        setCalculating(false);
      }
    };

    calculateBusinessDays();
  }, [open, isLeaveMode, startDate, endDate]);

  const handleConfirm = async () => {
    if (isLeaveMode) {
      // Book leave directly
      if (!selectedPersonId || businessDays === null) {
        return;
      }

      if (businessDays === 0) {
        setError('Cannot book leave with zero business days');
        return;
      }

      try {
        setSubmitting(true);
        setError(null);

        // Check for overlap
        const overlapResponse = await axios.post<{
          hasOverlap: boolean;
          overlappingLeave: any[];
        }>(
          '/api/leave/check-overlap',
          {
            userId: selectedPersonId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          { withCredentials: true }
        );

        if (overlapResponse.data.hasOverlap) {
          setError('This leave period overlaps with existing leave. Please adjust the dates.');
          setSubmitting(false);
          return;
        }

        // Create leave
        await axios.post(
          '/api/leave',
          {
            userId: selectedPersonId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          { withCredentials: true }
        );

        // Success - notify parent and close
        if (onLeaveBooked) {
          onLeaveBooked();
        }
        setNote('');
        setError(null);
        onCancel(); // Close dialog
      } catch (err: any) {
        console.error('Error booking leave:', err);
        setError(err.response?.data?.error || 'Failed to book leave');
        setSubmitting(false);
      }
    } else {
      // Closed period mode - use existing flow
      onConfirm(note);
      setNote('');
    }
  };

  const handleCancel = () => {
    onCancel();
    setNote('');
    setError(null);
  };

  const dialogTitle = isLeaveMode ? 'Book Leave' : 'Add Closed Period';
  const noteLabel = isLeaveMode ? 'Note (Optional)' : 'Note (Optional)';
  const notePlaceholder = isLeaveMode 
    ? 'Add a note for this leave period...' 
    : 'Add a description for this closed period...';
  const confirmButtonText = isLeaveMode ? 'Book Leave' : 'Continue';

  const formatLeaveLabel = (days: number): string => {
    if (days === 1) {
      return '1 Day Off';
    }
    return `${days} business days`;
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        <DialogContentText sx={{ mb: 2 }}>
          Selected date range:
        </DialogContentText>
        <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2 }}>
          {format(startDate, 'dd/MM/yyyy')} → {format(endDate, 'dd/MM/yyyy')}
        </Typography>

        {isLeaveMode && (
          <>
            {calculating ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Calculating business days...
                </Typography>
              </Box>
            ) : businessDays !== null ? (
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                {formatLeaveLabel(businessDays)}
              </Typography>
            ) : null}
          </>
        )}

        {!isLeaveMode && (
          <TextField
            fullWidth
            label={noteLabel}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            rows={3}
            placeholder={notePlaceholder}
            sx={{ mt: 2 }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} disabled={submitting} sx={{ color: 'text.secondary' }}>
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          disabled={submitting || (isLeaveMode && (calculating || businessDays === null || businessDays === 0))}
          sx={{ bgcolor: '#9e9e9e', '&:hover': { bgcolor: '#757575' } }}
        >
          {submitting ? 'Booking...' : confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DateSelectionDialog;
