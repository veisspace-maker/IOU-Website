import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Fade,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { format, isBefore, startOfDay, isWeekend } from 'date-fns';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Fade ref={ref} {...props} />;
});

interface LeaveRecord {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  businessDays: number;
}

interface User {
  id: string;
  username: string;
}

interface PublicHoliday {
  id: string;
  name: string;
  date: string;
}

interface ClosedDate {
  id: string;
  startDate: string;
  endDate: string;
  note?: string;
}

interface LeaveModalProps {
  open: boolean;
  leave: LeaveRecord | null;
  users: User[];
  onClose: () => void;
  onLeaveUpdated: () => void;
}

const LeaveModal: React.FC<LeaveModalProps> = ({
  open,
  leave,
  users,
  onClose,
  onLeaveUpdated,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [businessDays, setBusinessDays] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmEdit, setShowConfirmEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Disabled dates
  const [holidays, setHolidays] = useState<Date[]>([]);
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);

  // Initialize form when leave changes
  useEffect(() => {
    if (leave) {
      setStartDate(new Date(leave.startDate));
      setEndDate(new Date(leave.endDate));
      setBusinessDays(leave.businessDays);
      setIsEditing(false);
      setShowConfirmDelete(false);
      setShowConfirmEdit(false);
      setError(null);
    }
  }, [leave]);

  // Fetch holidays and closed dates
  useEffect(() => {
    const fetchDisabledDates = async () => {
      try {
        // Fetch holidays
        const holidaysResponse = await axios.get<{ holidays: PublicHoliday[] }>(
          '/api/holidays',
          { withCredentials: true }
        );
        const holidayDates = holidaysResponse.data.holidays.map(
          (h) => new Date(h.date)
        );
        setHolidays(holidayDates);

        // Fetch closed dates
        const closedResponse = await axios.get<{ closedDates: ClosedDate[] }>(
          '/api/closed-dates',
          { withCredentials: true }
        );
        setClosedDates(closedResponse.data.closedDates);
      } catch (err) {
        console.error('Error fetching disabled dates:', err);
      }
    };

    if (open) {
      fetchDisabledDates();
    }
  }, [open]);

  // Calculate business days when dates change in edit mode
  useEffect(() => {
    const calculateBusinessDays = async () => {
      if (!isEditing || !startDate || !endDate) {
        return;
      }

      try {
        setCalculating(true);
        const response = await axios.post<{ businessDays: number }>(
          '/api/leave/calculate-business-days',
          {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          { withCredentials: true }
        );
        setBusinessDays(response.data.businessDays);
        setError(null);
      } catch (err: any) {
        console.error('Error calculating business days:', err);
        setError(err.response?.data?.error || 'Failed to calculate business days');
        setBusinessDays(null);
      } finally {
        setCalculating(false);
      }
    };

    calculateBusinessDays();
  }, [startDate, endDate, isEditing]);

  if (!leave) {
    return null;
  }

  const user = users.find((u) => u.id === leave.userId);
  const userName = user?.username || 'Unknown';

  // Check if a date should be disabled
  const shouldDisableDate = (date: Date): boolean => {
    // Disable weekends
    if (isWeekend(date)) {
      return true;
    }

    // Disable public holidays
    const isHoliday = holidays.some(
      (holiday) =>
        format(holiday, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    if (isHoliday) {
      return true;
    }

    // Disable closed dates
    const isClosed = closedDates.some((closed) => {
      const closedStart = startOfDay(new Date(closed.startDate));
      const closedEnd = startOfDay(new Date(closed.endDate));
      const checkDate = startOfDay(date);
      return checkDate >= closedStart && checkDate <= closedEnd;
    });
    if (isClosed) {
      return true;
    }

    return false;
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setStartDate(new Date(leave.startDate));
    setEndDate(new Date(leave.endDate));
    setBusinessDays(leave.businessDays);
    setIsEditing(false);
    setError(null);
  };

  const handleSaveEdit = () => {
    // Validate business days
    if (businessDays === null || businessDays === 0) {
      setError('Cannot save leave with zero business days');
      return;
    }

    // Check for past dates
    const today = startOfDay(new Date());
    if (startDate && isBefore(startOfDay(startDate), today)) {
      // Show warning but allow to proceed to confirmation
      setShowConfirmEdit(true);
      return;
    }

    setShowConfirmEdit(true);
  };

  const handleConfirmEdit = async () => {
    if (!startDate || !endDate || businessDays === null) {
      return;
    }

    try {
      setSubmitting(true);

      await axios.put(
        `/api/leave/${leave.id}`,
        {
          userId: leave.userId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        { withCredentials: true }
      );

      onLeaveUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating leave:', error);
      setError(error.response?.data?.error || 'Failed to update leave');
      setShowConfirmEdit(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setSubmitting(true);

      await axios.delete(`/api/leave/${leave.id}`, { withCredentials: true });

      onLeaveUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error deleting leave:', error);
      setError(error.response?.data?.error || 'Failed to delete leave');
      setShowConfirmDelete(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmDelete(false);
  };

  const handleCancelConfirmEdit = () => {
    setShowConfirmEdit(false);
  };

  const formatLeaveLabel = (days: number): string => {
    if (days === 1) {
      return 'Day Off';
    }
    return `${days} business days`;
  };

  // Confirmation dialogs
  if (showConfirmDelete) {
    return (
      <Dialog open={open} onClose={onClose} TransitionComponent={Transition}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            <Box component="span" sx={{ fontWeight: 'bold' }}>
              {userName}
            </Box>
            {' - '}
            {format(new Date(leave.startDate), 'dd/MM/yyyy')} → {format(new Date(leave.endDate), 'dd/MM/yyyy')}
            {' ('}
            {formatLeaveLabel(leave.businessDays)}
            {')'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} disabled={submitting} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" disabled={submitting}>
            {submitting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (showConfirmEdit) {
    const isPastDate = startDate && isBefore(startOfDay(startDate), startOfDay(new Date()));
    
    return (
      <Dialog open={open} onClose={onClose} TransitionComponent={Transition}>
        <DialogTitle>Confirm Edit</DialogTitle>
        <DialogContent>
          {isPastDate && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Warning: This leave starts in the past.
            </Alert>
          )}
          <Typography>
            Are you sure you want to save these changes?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelConfirmEdit} disabled={submitting} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button onClick={handleConfirmEdit} disabled={submitting} sx={{ color: 'text.primary' }}>
            {submitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Main modal
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth TransitionComponent={Transition}>
      <DialogTitle>Leave Details</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!isEditing ? (
          <Box>
            <Typography variant="body1" gutterBottom>
              <Box component="span" sx={{ fontWeight: 'bold' }}>
                {userName}
              </Box>
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {format(new Date(leave.startDate), 'dd/MM/yyyy')} → {format(new Date(leave.endDate), 'dd/MM/yyyy')}
            </Typography>
            <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
              {formatLeaveLabel(leave.businessDays)}
            </Typography>
          </Box>
        ) : (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Editing leave for{' '}
                <Box component="span" sx={{ fontWeight: 'bold' }}>
                  {userName}
                </Box>
              </Typography>

              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                shouldDisableDate={shouldDisableDate}
                format="dd/MM/yyyy"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
              />

              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                shouldDisableDate={shouldDisableDate}
                minDate={startDate || undefined}
                format="dd/MM/yyyy"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
              />

              {calculating ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    Calculating business days...
                  </Typography>
                </Box>
              ) : businessDays !== null ? (
                <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                  {formatLeaveLabel(businessDays)}
                </Typography>
              ) : null}
            </Box>
          </LocalizationProvider>
        )}
      </DialogContent>
      <DialogActions>
        {!isEditing ? (
          <>
            <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
            <Button onClick={handleDelete} color="error">
              Delete
            </Button>
            <Button onClick={handleEdit} sx={{ color: 'text.primary' }}>
              Edit
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleCancelEdit} sx={{ color: 'text.secondary' }}>Cancel</Button>
            <Button onClick={handleSaveEdit} sx={{ color: 'text.primary' }} disabled={calculating || businessDays === null || businessDays === 0}>
              Save
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default LeaveModal;
