import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';

interface DateSelectionDialogProps {
  open: boolean;
  startDate: Date;
  endDate: Date;
  selectedPersonId?: string | null;
  onConfirm: (note: string) => void;
  onCancel: () => void;
}

const DateSelectionDialog: React.FC<DateSelectionDialogProps> = ({
  open,
  startDate,
  endDate,
  selectedPersonId,
  onConfirm,
  onCancel,
}) => {
  const [note, setNote] = useState('');

  const handleConfirm = () => {
    onConfirm(note);
    setNote(''); // Reset for next time
  };

  const handleCancel = () => {
    onCancel();
    setNote('');
  };

  const isLeaveMode = selectedPersonId !== null && selectedPersonId !== undefined;
  const dialogTitle = isLeaveMode ? 'Add Leave' : 'Add Closed Period';
  const noteLabel = isLeaveMode ? 'Note (Optional)' : 'Note (Optional)';
  const notePlaceholder = isLeaveMode 
    ? 'Add a note for this leave period...' 
    : 'Add a description for this closed period...';

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Selected date range:
        </DialogContentText>
        <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2 }}>
          {format(startDate, 'dd/MM/yyyy')} → {format(endDate, 'dd/MM/yyyy')}
        </Typography>
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
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" sx={{ bgcolor: '#9e9e9e', '&:hover': { bgcolor: '#757575' } }}>
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DateSelectionDialog;
