import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EntitySelector from './EntitySelector';
import { Entity, formatEntityName, formatCurrency } from '../utils/debtTrackerUtils';
import {
  DebtRecurrenceTemplate,
  listDebtRecurrenceTemplates,
  createDebtRecurrenceTemplate,
  updateDebtRecurrenceTemplate,
  deleteDebtRecurrenceTemplate,
} from '../api/debtTrackerApi';

const dayWarning = (day: number): string | null =>
  day > 28
    ? 'Days after the 28th are clamped in short months (for example February).'
    : null;

const MonthlyRecurrencePanel: React.FC = () => {
  const [templates, setTemplates] = useState<DebtRecurrenceTemplate[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const [senderEntity, setSenderEntity] = useState<Entity | null>(null);
  const [receiverEntity, setReceiverEntity] = useState<Entity | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<DebtRecurrenceTemplate | null>(null);
  const [editDay, setEditDay] = useState('1');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editSender, setEditSender] = useState<Entity | null>(null);
  const [editReceiver, setEditReceiver] = useState<Entity | null>(null);

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      const list = await listDebtRecurrenceTemplates();
      setTemplates(list);
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load templates');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const domNum = parseInt(dayOfMonth, 10);
  const formDayWarning = !Number.isNaN(domNum) ? dayWarning(domNum) : null;

  const handleCreate = async () => {
    if (!senderEntity || !receiverEntity) {
      setWarnings(['Select both sender and receiver.']);
      return;
    }
    const amt = parseFloat(amount);
    if (Number.isNaN(amt) || amt <= 0) {
      setWarnings(['Amount must be a positive number.']);
      return;
    }
    const dom = parseInt(dayOfMonth, 10);
    if (!Number.isInteger(dom) || dom < 1 || dom > 31) {
      setWarnings(['Day of month must be between 1 and 31.']);
      return;
    }
    try {
      setSubmitting(true);
      setWarnings([]);
      const { warnings: w } = await createDebtRecurrenceTemplate({
        from: senderEntity,
        to: receiverEntity,
        amount: amt,
        description: description.trim() || undefined,
        dayOfMonth: dom,
        startDate,
        endDate: endDate.trim() ? endDate.trim() : null,
      });
      setWarnings(w);
      setSenderEntity(null);
      setReceiverEntity(null);
      setAmount('');
      setDescription('');
      setDayOfMonth('1');
      setEndDate('');
      await load();
    } catch (e: unknown) {
      setWarnings([e instanceof Error ? e.message : 'Create failed']);
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (t: DebtRecurrenceTemplate) => {
    setEditing(t);
    setEditSender(t.from);
    setEditReceiver(t.to);
    setEditAmount(String(t.amount));
    setEditDesc(t.description ?? '');
    setEditDay(String(t.dayOfMonth));
    setEditStart(t.startDate);
    setEditEnd(t.endDate ?? '');
    setEditActive(t.active);
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editing || !editSender || !editReceiver) return;
    const amt = parseFloat(editAmount);
    if (Number.isNaN(amt) || amt <= 0) {
      setWarnings(['Amount must be a positive number.']);
      return;
    }
    const dom = parseInt(editDay, 10);
    if (!Number.isInteger(dom) || dom < 1 || dom > 31) {
      setWarnings(['Day of month must be between 1 and 31.']);
      return;
    }
    try {
      setSubmitting(true);
      setWarnings([]);
      const { warnings: w } = await updateDebtRecurrenceTemplate(editing.id, {
        from: editSender,
        to: editReceiver,
        amount: amt,
        description: editDesc.trim() || null,
        dayOfMonth: dom,
        startDate: editStart,
        endDate: editEnd.trim() ? editEnd.trim() : null,
        active: editActive,
      });
      setWarnings(w);
      setEditOpen(false);
      setEditing(null);
      await load();
    } catch (e: unknown) {
      setWarnings([e instanceof Error ? e.message : 'Update failed']);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (t: DebtRecurrenceTemplate) => {
    if (
      !window.confirm(
        `Delete monthly recurrence (${formatEntityName(t.from)} → ${formatEntityName(t.to)}, day ${t.dayOfMonth})?`
      )
    ) {
      return;
    }
    try {
      setWarnings([]);
      await deleteDebtRecurrenceTemplate(t.id);
      await load();
    } catch (e: unknown) {
      setWarnings([e instanceof Error ? e.message : 'Delete failed']);
    }
  };

  const handleToggleActive = async (t: DebtRecurrenceTemplate, active: boolean) => {
    try {
      setWarnings([]);
      const { warnings: w } = await updateDebtRecurrenceTemplate(t.id, { active });
      setWarnings(w);
      await load();
    } catch (e: unknown) {
      setWarnings([e instanceof Error ? e.message : 'Update failed']);
    }
  };

  const editDom = parseInt(editDay, 10);
  const editDayAlert = !Number.isNaN(editDom) && editDom > 0 ? dayWarning(editDom) : null;

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Monthly recurring charges
      </Typography>
      {/* <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        The server creates one debt transaction per calendar month per template (after the scheduled day has passed).
        Missed months are backfilled when the daily job runs at 00:05 local time.
      </Typography> */}

      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      )}
      {warnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setWarnings([])}>
          {warnings.map((w) => (
            <Box key={w}>{w}</Box>
          ))}
        </Alert>
      )}
      {formDayWarning && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {formDayWarning}
        </Alert>
      )}

      <Typography variant="subtitle2" gutterBottom>
        New template
      </Typography>
      <Box sx={{ mb: 2 }}>
        <EntitySelector
          senderEntity={senderEntity}
          receiverEntity={receiverEntity}
          onSenderSelect={setSenderEntity}
          onReceiverSelect={setReceiverEntity}
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <TextField
          label="Amount ($)"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          sx={{ minWidth: 140 }}
          inputProps={{ min: 0, step: 0.01 }}
        />
        <TextField
          label="Day of month"
          type="number"
          value={dayOfMonth}
          onChange={(e) => setDayOfMonth(e.target.value)}
          sx={{ width: 120 }}
          inputProps={{ min: 1, max: 31 }}
        />
        <TextField
          label="Start date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="End date (optional)"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Box>
      <TextField
        label="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
        multiline
        rows={2}
      />
      <Button variant="contained" onClick={() => void handleCreate()} disabled={submitting}>
        {submitting ? 'Saving…' : 'Create template'}
      </Button>

      <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
        Existing templates
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>From → To</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Day</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>End</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography variant="body2" color="text.secondary">
                    No templates yet.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    {formatEntityName(t.from)} → {formatEntityName(t.to)}
                  </TableCell>
                  <TableCell align="right">{formatCurrency(t.amount)}</TableCell>
                  <TableCell>{t.dayOfMonth}</TableCell>
                  <TableCell>{t.startDate}</TableCell>
                  <TableCell>{t.endDate ?? '—'}</TableCell>
                  <TableCell>
                    <Tooltip title="Pause or resume future months">
                      <Switch
                        size="small"
                        checked={t.active}
                        onChange={(_, v) => void handleToggleActive(t, v)}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit (future runs only)">
                      <IconButton size="small" onClick={() => openEdit(t)} aria-label="edit">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete template">
                      <IconButton size="small" onClick={() => void handleDelete(t)} aria-label="delete">
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit monthly template</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <EntitySelector
              senderEntity={editSender}
              receiverEntity={editReceiver}
              onSenderSelect={setEditSender}
              onReceiverSelect={setEditReceiver}
            />
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
              <TextField
                label="Amount ($)"
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
              />
              <TextField
                label="Day of month"
                type="number"
                value={editDay}
                onChange={(e) => setEditDay(e.target.value)}
                inputProps={{ min: 1, max: 31 }}
              />
              <TextField
                label="Start date"
                type="date"
                value={editStart}
                onChange={(e) => setEditStart(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="End date (optional)"
                type="date"
                value={editEnd}
                onChange={(e) => setEditEnd(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            {editDayAlert && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {editDayAlert}
              </Alert>
            )}
            <TextField
              label="Description"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
              multiline
              rows={2}
            />
            <FormControlLabel
              control={<Switch checked={editActive} onChange={(_, v) => setEditActive(v)} />}
              label="Active"
              sx={{ mt: 1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => void handleSaveEdit()} disabled={submitting}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default MonthlyRecurrencePanel;
