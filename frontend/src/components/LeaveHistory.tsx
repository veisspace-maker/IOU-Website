import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  CircularProgress,
  Chip,
  Collapse,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { format, isBefore, startOfDay, isWeekend } from 'date-fns';

interface LeaveRecord {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  businessDays: number;
  createdAt: string;
  updatedAt: string;
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

interface LeaveHistoryProps {
  refreshKey: number;
}

const LeaveHistory: React.FC<LeaveHistoryProps> = ({
  refreshKey,
}) => {
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  // Expanded leave state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Edit form state
  const [isEditing, setIsEditing] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [businessDays, setBusinessDays] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Confirmation dialogs
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmEdit, setShowConfirmEdit] = useState(false);
  const [leaveToDelete, setLeaveToDelete] = useState<LeaveRecord | null>(null);

  // Disabled dates
  const [holidays, setHolidays] = useState<Date[]>([]);
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Save scroll position before refresh
        if (scrollContainerRef.current) {
          scrollPositionRef.current = scrollContainerRef.current.scrollTop;
        }

        setLoading(true);
        setLeaveRecords([]);
        setHasMore(true);

        // Fetch leave records with pagination
        const limit = 50;
        const offset = 0;
        const leaveResponse = await axios.get(
          `/api/leave?limit=${limit}&offset=${offset}`,
          { withCredentials: true }
        );
        
        const leaveData = leaveResponse.data.leaveRecords || leaveResponse.data;
        const total = leaveResponse.data.total || 0;
        
        setLeaveRecords(Array.isArray(leaveData) ? leaveData : []);
        setHasMore(leaveData.length === limit && offset + limit < total);

        // Fetch users
        const usersResponse = await axios.get(
          '/api/users',
          { withCredentials: true }
        );
        // Backend returns { users: [...] }
        const usersData = usersResponse.data.users || usersResponse.data;
        setUsers(Array.isArray(usersData) ? usersData : []);

        setError(null);
      } catch (err) {
        console.error('Error fetching leave history:', err);
        setError('Failed to load leave history');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshKey]);

  // Restore scroll position after data loads
  useEffect(() => {
    if (!loading && scrollContainerRef.current && scrollPositionRef.current > 0) {
      scrollContainerRef.current.scrollTop = scrollPositionRef.current;
    }
  }, [loading, leaveRecords]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      
      const limit = 50;
      const offset = leaveRecords.length;
      
      const leaveResponse = await axios.get(
        `/api/leave?limit=${limit}&offset=${offset}`,
        { withCredentials: true }
      );
      
      const leaveData = leaveResponse.data.leaveRecords || leaveResponse.data;
      const total = leaveResponse.data.total || 0;
      
      setLeaveRecords(prev => [...prev, ...(Array.isArray(leaveData) ? leaveData : [])]);
      setHasMore(leaveData.length === limit && offset + limit < total);
    } catch (err) {
      console.error('Error loading more leave records:', err);
      setError('Failed to load more leave records');
    } finally {
      setLoadingMore(false);
    }
  };

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
        setFormError(null);
      } catch (err: any) {
        console.error('Error calculating business days:', err);
        setFormError(err.response?.data?.error || 'Failed to calculate business days');
        setBusinessDays(null);
      } finally {
        setCalculating(false);
      }
    };

    calculateBusinessDays();
  }, [startDate, endDate, isEditing]);

  const getUserName = (userId: string): string => {
    const user = users.find((u) => u.id === userId);
    return user?.username || 'Unknown';
  };

  const formatLeaveLabel = (leave: LeaveRecord): string => {
    if (leave.businessDays === 1) {
      return 'Day Off';
    }
    return `${leave.businessDays} business days`;
  };

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

  const handleLeaveClick = (leave: LeaveRecord) => {
    if (expandedId === leave.id) {
      // Collapse if already expanded
      setExpandedId(null);
      setIsEditing(false);
    } else {
      // Expand and populate form
      setExpandedId(leave.id);
      setStartDate(new Date(leave.startDate));
      setEndDate(new Date(leave.endDate));
      setBusinessDays(leave.businessDays);
      setIsEditing(false);
      setFormError(null);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    const leave = leaveRecords.find(l => l.id === expandedId);
    if (leave) {
      setStartDate(new Date(leave.startDate));
      setEndDate(new Date(leave.endDate));
      setBusinessDays(leave.businessDays);
    }
    setIsEditing(false);
    setFormError(null);
  };

  const handleSaveEdit = () => {
    // Validate business days
    if (businessDays === null || businessDays === 0) {
      setFormError('Cannot save leave with zero business days');
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
    const leave = leaveRecords.find(l => l.id === expandedId);
    if (!leave || !startDate || !endDate || businessDays === null) {
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

      setShowConfirmEdit(false);
      setExpandedId(null);
      setIsEditing(false);
      
      // Refresh data with pagination
      const limit = 50;
      const offset = 0;
      const leaveResponse = await axios.get(
        `/api/leave?limit=${limit}&offset=${offset}`,
        { withCredentials: true }
      );
      const leaveData = leaveResponse.data.leaveRecords || leaveResponse.data;
      const total = leaveResponse.data.total || 0;
      setLeaveRecords(Array.isArray(leaveData) ? leaveData : []);
      setHasMore(leaveData.length === limit && offset + limit < total);
    } catch (error: any) {
      console.error('Error updating leave:', error);
      setFormError(error.response?.data?.error || 'Failed to update leave');
      setShowConfirmEdit(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (leave: LeaveRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setLeaveToDelete(leave);
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!leaveToDelete) return;

    try {
      setSubmitting(true);

      await axios.delete(`/api/leave/${leaveToDelete.id}`, { withCredentials: true });

      setShowConfirmDelete(false);
      setLeaveToDelete(null);
      setExpandedId(null);
      setIsEditing(false);
      
      // Refresh data with pagination
      const limit = 50;
      const offset = 0;
      const leaveResponse = await axios.get(
        `/api/leave?limit=${limit}&offset=${offset}`,
        { withCredentials: true }
      );
      const leaveData = leaveResponse.data.leaveRecords || leaveResponse.data;
      const total = leaveResponse.data.total || 0;
      setLeaveRecords(Array.isArray(leaveData) ? leaveData : []);
      setHasMore(leaveData.length === limit && offset + limit < total);
    } catch (error: any) {
      console.error('Error deleting leave:', error);
      setFormError(error.response?.data?.error || 'Failed to delete leave');
      setShowConfirmDelete(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmDelete(false);
    setLeaveToDelete(null);
  };

  const handleCancelConfirmEdit = () => {
    setShowConfirmEdit(false);
  };

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  if (leaveRecords.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
          Leave History
        </Typography>
        <Typography color="text.secondary">No leave records found</Typography>
      </Paper>
    );
  }

  return (
    <>
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
          Leave History
        </Typography>

        <Box ref={scrollContainerRef}>
          <List>
            {leaveRecords.map((leave) => {
              const isExpanded = expandedId === leave.id;
              const userName = getUserName(leave.userId);

              return (
                <ListItem 
                  key={leave.id} 
                  sx={{
                    display: 'block',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                    py: { xs: 1.5, sm: 2 },
                    px: { xs: 1, sm: 2 },
                  }}
                  onClick={() => handleLeaveClick(leave)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '44px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', flex: 1 }}>
                      <Typography variant="body1" component="span" sx={{ fontWeight: 'bold', fontSize: { xs: '0.938rem', sm: '1rem' } }}>
                        {userName}
                      </Typography>
                      <Typography variant="body2" component="span" color="text.secondary" sx={{ fontSize: { xs: '0.813rem', sm: '0.875rem' } }}>
                        {format(new Date(leave.startDate), 'dd/MM/yyyy')} → {format(new Date(leave.endDate), 'dd/MM/yyyy')}
                      </Typography>
                      <Chip
                        label={formatLeaveLabel(leave)}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: { xs: '0.688rem', sm: '0.75rem' } }}
                      />
                    </Box>
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </Box>

                  {/* Expanded Edit Form */}
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Box 
                      sx={{ 
                        mt: 3, 
                        pt: 3, 
                        borderTop: '1px solid',
                        borderColor: 'divider',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
                        Leave Details
                      </Typography>

                      {formError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          {formError}
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
                            {formatLeaveLabel(leave)}
                          </Typography>
                        </Box>
                      ) : (
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                                {businessDays === 1 ? 'Day Off' : `${businessDays} business days`}
                              </Typography>
                            ) : null}
                          </Box>
                        </LocalizationProvider>
                      )}

                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                        {!isEditing ? (
                          <>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(leave, e);
                              }}
                              color="error"
                              disabled={submitting}
                            >
                              Delete
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedId(null);
                              }}
                              sx={{ color: 'text.secondary' }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit();
                              }}
                              sx={{ color: 'text.primary' }}
                            >
                              Edit
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelEdit();
                              }}
                              sx={{ color: 'text.secondary' }}
                              disabled={submitting}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveEdit();
                              }}
                              sx={{ color: 'text.primary' }}
                              disabled={calculating || businessDays === null || businessDays === 0 || submitting}
                            >
                              Save
                            </Button>
                          </>
                        )}
                      </Box>
                    </Box>
                  </Collapse>
                </ListItem>
              );
            })}
          </List>
        </Box>

        {/* Load More Button */}
        {hasMore && !loading && leaveRecords.length > 0 && (
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
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showConfirmDelete} onClose={handleCancelDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          {leaveToDelete && (
            <Typography variant="body2" color="text.secondary">
              <Box component="span" sx={{ fontWeight: 'bold' }}>
                {getUserName(leaveToDelete.userId)}
              </Box>
              {' - '}
              {format(new Date(leaveToDelete.startDate), 'dd/MM/yyyy')} → {format(new Date(leaveToDelete.endDate), 'dd/MM/yyyy')}
              {' ('}
              {formatLeaveLabel(leaveToDelete)}
              {')'}
            </Typography>
          )}
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

      {/* Edit Confirmation Dialog */}
      <Dialog open={showConfirmEdit} onClose={handleCancelConfirmEdit}>
        <DialogTitle>Confirm Edit</DialogTitle>
        <DialogContent>
          {startDate && isBefore(startOfDay(startDate), startOfDay(new Date())) && (
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
    </>
  );
};

export default LeaveHistory;
