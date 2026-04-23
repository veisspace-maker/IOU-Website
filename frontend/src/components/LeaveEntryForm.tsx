import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  CircularProgress,
  Fade,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { format, isBefore, startOfDay } from 'date-fns';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Fade ref={ref} {...props} />;
});

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

interface LeaveRecord {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  businessDays: number;
}

interface LeaveEntryFormProps {
  selectedPersonId: string;
  selectedPersonName: string;
  onLeaveCreated: () => void;
  prefilledStartDate?: string;
  prefilledEndDate?: string;
}

const LeaveEntryForm: React.FC<LeaveEntryFormProps> = ({
  selectedPersonId,
  selectedPersonName,
  onLeaveCreated,
  prefilledStartDate,
  prefilledEndDate,
}) => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [businessDays, setBusinessDays] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Disabled dates
  const [holidays, setHolidays] = useState<Date[]>([]);
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  
  // Dialogs
  const [showZeroBusinessDaysError, setShowZeroBusinessDaysError] = useState(false);
  const [showPastDateWarning, setShowPastDateWarning] = useState(false);
  const [showOverlapDialog, setShowOverlapDialog] = useState(false);
  const [overlappingLeave, setOverlappingLeave] = useState<LeaveRecord[]>([]);

  // Set prefilled dates when provided
  useEffect(() => {
    if (prefilledStartDate && prefilledEndDate) {
      setStartDate(new Date(prefilledStartDate));
      setEndDate(new Date(prefilledEndDate));
    }
  }, [prefilledStartDate, prefilledEndDate]);

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

    fetchDisabledDates();
  }, []);

  // Calculate business days when dates change
  useEffect(() => {
    const calculateBusinessDays = async () => {
      if (!startDate || !endDate) {
        setBusinessDays(null);
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
        setBusinessDays(null);
        setError(err.response?.data?.error || 'Failed to calculate business days');
      } finally {
        setCalculating(false);
      }
    };

    calculateBusinessDays();
  }, [startDate, endDate]);

  // Check if date should be disabled
  const shouldDisableDate = (date: Date): boolean => {
    // Disable weekends (Saturday = 6, Sunday = 0)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return true;
    }

    // Disable holidays
    const isHoliday = holidays.some(
      (holiday) =>
        holiday.getFullYear() === date.getFullYear() &&
        holiday.getMonth() === date.getMonth() &&
        holiday.getDate() === date.getDate()
    );
    if (isHoliday) {
      return true;
    }

    // Disable closed dates
    const isClosedDate = closedDates.some((closed) => {
      const closedStart = new Date(closed.startDate);
      const closedEnd = new Date(closed.endDate);
      return date >= closedStart && date <= closedEnd;
    });
    if (isClosedDate) {
      return true;
    }

    return false;
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate || businessDays === null) {
      return;
    }

    // Check for zero business days
    if (businessDays === 0) {
      setShowZeroBusinessDaysError(true);
      return;
    }

    // Check for past dates
    const today = startOfDay(new Date());
    if (isBefore(startDate, today)) {
      setShowPastDateWarning(true);
      return;
    }

    // Check for overlap
    await checkOverlapAndSubmit();
  };

  const checkOverlapAndSubmit = async () => {
    if (!startDate || !endDate) return;

    try {
      const overlapResponse = await axios.post<{
        hasOverlap: boolean;
        overlappingLeave: LeaveRecord[];
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
        setOverlappingLeave(overlapResponse.data.overlappingLeave);
        setShowOverlapDialog(true);
        return;
      }

      // No overlap, proceed with submission
      await submitLeave();
    } catch (err: any) {
      console.error('Error checking overlap:', err);
      setError(err.response?.data?.error || 'Failed to check overlap');
    }
  };

  const submitLeave = async () => {
    if (!startDate || !endDate) return;

    try {
      setSubmitting(true);
      await axios.post(
        '/api/leave',
        {
          userId: selectedPersonId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        { withCredentials: true }
      );

      // Reset form
      setStartDate(null);
      setEndDate(null);
      setBusinessDays(null);
      setError(null);

      // Notify parent
      onLeaveCreated();
    } catch (err: any) {
      console.error('Error creating leave:', err);
      setError(err.response?.data?.error || 'Failed to create leave record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmPastDate = async () => {
    setShowPastDateWarning(false);
    await checkOverlapAndSubmit();
  };

  const handleKeepSeparate = async () => {
    setShowOverlapDialog(false);
    await submitLeave();
  };

  const handleMerge = () => {
    // For MVP, we'll just keep separate
    // Full merge logic would require more complex date range merging
    setShowOverlapDialog(false);
    setError('Merge functionality not yet implemented. Please adjust dates or keep separate.');
  };

  // Get label for leave type
  const getLeaveLabel = (): string => {
    if (businessDays === null) return '';
    if (businessDays === 1) return 'Day Off';
    return `${businessDays} business days`;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Book Leave for {selectedPersonName}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={(newValue) => setStartDate(newValue)}
            shouldDisableDate={shouldDisableDate}
            format="dd/MM/yyyy"
            slotProps={{
              textField: {
                fullWidth: true,
                sx: { flex: 1, minWidth: '200px' },
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
                sx: { flex: 1, minWidth: '200px' },
              },
            }}
          />
        </Box>

        {calculating && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Calculating business days...
            </Typography>
          </Box>
        )}

        {businessDays !== null && !calculating && (
          <Typography variant="body1" sx={{ mb: 2, fontWeight: 'bold' }}>
            {getLeaveLabel()}
          </Typography>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={!startDate || !endDate || businessDays === null || calculating || submitting}
          fullWidth
        >
          {submitting ? 'Submitting...' : 'Book Leave'}
        </Button>

        {/* Zero Business Days Error Dialog */}
        <Dialog open={showZeroBusinessDaysError} onClose={() => setShowZeroBusinessDaysError(false)} TransitionComponent={Transition}>
          <DialogTitle>Invalid Leave Period</DialogTitle>
          <DialogContent>
            <DialogContentText>
              The selected date range contains zero business days. Please select a range that includes at least one business day.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowZeroBusinessDaysError(false)} color="primary">
              OK
            </Button>
          </DialogActions>
        </Dialog>

        {/* Past Date Warning Dialog */}
        <Dialog open={showPastDateWarning} onClose={() => setShowPastDateWarning(false)} TransitionComponent={Transition}>
          <DialogTitle>Past Date Warning</DialogTitle>
          <DialogContent>
            <DialogContentText>
              You are booking leave that starts in the past. Are you sure you want to continue?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPastDateWarning(false)} sx={{ color: 'text.secondary' }}>
              Cancel
            </Button>
            <Button onClick={handleConfirmPastDate} variant="contained" sx={{ bgcolor: '#9e9e9e', '&:hover': { bgcolor: '#757575' } }}>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        {/* Overlap Dialog */}
        <Dialog open={showOverlapDialog} onClose={() => setShowOverlapDialog(false)} TransitionComponent={Transition}>
          <DialogTitle>Overlapping Leave Detected</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This leave period overlaps with existing leave:
            </DialogContentText>
            {overlappingLeave.map((leave) => (
              <Typography key={leave.id} variant="body2" sx={{ mt: 1 }}>
                • {format(new Date(leave.startDate), 'dd/MM/yyyy')} → {format(new Date(leave.endDate), 'dd/MM/yyyy')} ({leave.businessDays} business days)
              </Typography>
            ))}
            <DialogContentText sx={{ mt: 2 }}>
              Would you like to merge these periods or keep them separate?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowOverlapDialog(false)} sx={{ color: 'text.secondary' }}>
              Cancel
            </Button>
            <Button onClick={handleKeepSeparate} sx={{ color: 'text.primary' }}>
              Keep Separate
            </Button>
            <Button onClick={handleMerge} variant="contained" sx={{ bgcolor: '#9e9e9e', '&:hover': { bgcolor: '#757575' } }}>
              Merge
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </LocalizationProvider>
  );
};

export default LeaveEntryForm;
