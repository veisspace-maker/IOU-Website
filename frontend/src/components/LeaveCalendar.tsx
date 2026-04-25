import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Grid,
  Chip,
  Button,
  Popover,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  isWeekend,
  parseISO,
} from 'date-fns';
import DateSelectionDialog from './DateSelectionDialog';

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

interface LeaveCalendarProps {
  selectedPersonId: string | null;
  refreshKey: number;
}

// Hardcoded colors for users
const USER_COLORS: { [key: string]: string } = {
  'Leva': '#4caf50',    // Green
  'Danik': '#2196f3',   // Blue
  '2 Masters': '#ff9800', // Orange
};

const DEFAULT_COLOR = '#4caf50';

const LeaveCalendar: React.FC<LeaveCalendarProps> = ({
  selectedPersonId,
  refreshKey,
}) => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [datePickerAnchor, setDatePickerAnchor] = useState<HTMLElement | null>(null);

  // Selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  // Dialog state
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);

  // Clicked closed date state
  const [clickedClosedDate, setClickedClosedDate] = useState<ClosedDate | null>(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch leave records
        const leaveResponse = await axios.get(
          '/api/leave',
          { withCredentials: true }
        );
        // Backend returns { leaveRecords: [...] }
        const leaveData = leaveResponse.data.leaveRecords || leaveResponse.data;
        setLeaveRecords(Array.isArray(leaveData) ? leaveData : []);

        // Fetch users
        const usersResponse = await axios.get(
          '/api/users',
          { withCredentials: true }
        );
        // Backend returns { users: [...] }
        const usersData = usersResponse.data.users || usersResponse.data;
        setUsers(Array.isArray(usersData) ? usersData : []);

        // Fetch holidays
        const holidaysResponse = await axios.get(
          '/api/holidays',
          { withCredentials: true }
        );
        // Backend returns { holidays: [...] }
        const holidaysData = holidaysResponse.data.holidays || holidaysResponse.data;
        setHolidays(Array.isArray(holidaysData) ? holidaysData : []);

        // Fetch closed dates
        const closedResponse = await axios.get(
          '/api/closed-dates',
          { withCredentials: true }
        );
        // Backend returns { closedDates: [...] }
        const closedData = closedResponse.data.closedDates || closedResponse.data;
        setClosedDates(Array.isArray(closedData) ? closedData : []);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshKey]);

  // Scroll to selected person's leave when selected
  useEffect(() => {
    if (selectedPersonId) {
      const personLeave = leaveRecords.filter(
        (leave) => leave.userId === selectedPersonId
      );
      if (personLeave.length > 0) {
        // Find the earliest upcoming or current leave
        const now = new Date();
        const upcomingLeave = personLeave
          .filter((leave) => new Date(leave.endDate) >= now)
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        
        if (upcomingLeave.length > 0) {
          setCurrentMonth(new Date(upcomingLeave[0].startDate));
        }
      }
    }
  }, [selectedPersonId, leaveRecords]);

  // Keyboard support - ESC to cancel selection
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSelecting) {
        setIsSelecting(false);
        setSelectionStart(null);
        setSelectionEnd(null);
        setSelectedDates([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelecting]);

  // Cancel selection on month change
  useEffect(() => {
    if (isSelecting) {
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      setSelectedDates([]);
    }
  }, [currentMonth]);

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleOpenDatePicker = (event: React.MouseEvent<HTMLElement>) => {
    setDatePickerAnchor(event.currentTarget);
  };

  const handleCloseDatePicker = () => {
    setDatePickerAnchor(null);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(event.target.value);
    if (!isNaN(selectedDate.getTime())) {
      setCurrentMonth(selectedDate);
      handleCloseDatePicker();
    }
  };

  const handleMonthChange = (month: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(month);
    setCurrentMonth(newDate);
  };

  const handleYearChange = (year: number) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(year);
    setCurrentMonth(newDate);
  };

  const handleDayChange = (day: number) => {
    const newDate = new Date(currentMonth);
    newDate.setDate(day);
    setCurrentMonth(newDate);
  };

  // Generate year options (current year ± 10 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
  
  // Generate day options based on current month
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const dayOptions = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Check if date is a holiday
  const isHoliday = (date: Date): PublicHoliday | null => {
    const holiday = holidays.find((h) => {
      const holidayDate = new Date(h.date);
      return isSameDay(holidayDate, date);
    });
    return holiday || null;
  };

  // Check if date is in a closed period
  const isClosedDate = (date: Date): ClosedDate | null => {
    const closed = closedDates.find((c) => {
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      return date >= start && date <= end;
    });
    return closed || null;
  };

  // Check if date is in a leave period
  const getLeaveForDate = (date: Date): LeaveRecord[] => {
    return leaveRecords.filter((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      return date >= start && date <= end;
    });
  };

  // Get user color based on username
  const getUserColor = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    if (user && USER_COLORS[user.username]) {
      return USER_COLORS[user.username];
    }
    return DEFAULT_COLOR;
  };

  // Helper function to get weekdays in range
  const getWeekdaysInRange = (start: Date, end: Date): Date[] => {
    const dates: Date[] = [];
    // Ensure start is before end
    const actualStart = start < end ? start : end;
    const actualEnd = start < end ? end : start;
    let current = new Date(actualStart);

    while (current <= actualEnd) {
      if (!isWeekend(current)) {
        dates.push(new Date(current));
      }
      current = addDays(current, 1);
    }

    return dates;
  };

  // Check if date is selected
  const isDateSelected = (date: Date): boolean => {
    return selectedDates.some(d => isSameDay(d, date));
  };

  // Mouse event handlers for date selection
  const handleDateMouseDown = (date: Date, event: React.MouseEvent) => {
    event.preventDefault();

    // Only allow selection on weekdays in current month
    if (isWeekend(date) || !isSameMonth(date, currentMonth)) {
      return;
    }

    setIsSelecting(true);
    setSelectionStart(date);
    setSelectionEnd(date);
    setSelectedDates([date]);
  };

  const handleDateMouseEnter = (date: Date) => {
    if (!isSelecting || !selectionStart) return;

    // Only allow selection on weekdays in current month
    if (isWeekend(date) || !isSameMonth(date, currentMonth)) {
      return;
    }

    setSelectionEnd(date);

    // Calculate all dates in range
    const datesInRange = getWeekdaysInRange(selectionStart, date);
    setSelectedDates(datesInRange);
  };

  const handleDateMouseUp = () => {
    if (!isSelecting) return;

    setIsSelecting(false);

    // Show dialog if we have selected dates
    if (selectedDates.length > 0) {
      setShowSelectionDialog(true);
    }
  };

  // Touch event handlers for mobile
  const handleDateTouchStart = (date: Date, event: React.TouchEvent) => {
    event.preventDefault();

    if (isWeekend(date) || !isSameMonth(date, currentMonth)) {
      return;
    }

    setIsSelecting(true);
    setSelectionStart(date);
    setSelectionEnd(date);
    setSelectedDates([date]);
  };

  const handleDateTouchMove = (event: React.TouchEvent) => {
    if (!isSelecting || !selectionStart) return;

    // Get the element under the touch point
    const touch = event.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    // Find the date from the element's data attribute
    const dateStr = element?.getAttribute('data-date');
    if (!dateStr) return;

    const date = parseISO(dateStr);

    if (isWeekend(date) || !isSameMonth(date, currentMonth)) {
      return;
    }

    setSelectionEnd(date);
    const datesInRange = getWeekdaysInRange(selectionStart, date);
    setSelectedDates(datesInRange);
  };

  const handleDateTouchEnd = () => {
    if (!isSelecting) return;

    setIsSelecting(false);

    if (selectedDates.length > 0) {
      setShowSelectionDialog(true);
    }
  };

  // Closed date chip click handler
  const handleClosedDateClick = (closedDate: ClosedDate, event: React.MouseEvent) => {
    event.stopPropagation();
    setClickedClosedDate(closedDate);

    // Navigate to settings with edit mode
    navigate('/settings', {
      state: {
        openTab: 1,
        startDate: closedDate.startDate,
        endDate: closedDate.endDate,
        note: closedDate.note,
        editId: closedDate.id
      }
    });
  };

  // Selection dialog handlers
  const handleSelectionConfirm = (note: string) => {
    setShowSelectionDialog(false);

    if (selectedDates.length === 0) return;

    // Get start and end dates (already sorted)
    const start = selectedDates[0];
    const end = selectedDates[selectedDates.length - 1];

    // For closed dates (no person selected), navigate to settings
    navigate('/settings', {
      state: {
        openTab: 1, // Closed dates tab
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
        note: note || undefined,
      }
    });

    // Reset selection
    setSelectionStart(null);
    setSelectionEnd(null);
    setSelectedDates([]);
  };

  const handleLeaveBooked = () => {
    // Refresh calendar data
    const fetchData = async () => {
      try {
        const leaveResponse = await axios.get(
          '/api/leave',
          { withCredentials: true }
        );
        const leaveData = leaveResponse.data.leaveRecords || leaveResponse.data;
        setLeaveRecords(Array.isArray(leaveData) ? leaveData : []);
      } catch (error) {
        console.error('Error refreshing leave data:', error);
      }
    };

    fetchData();

    // Reset selection
    setSelectionStart(null);
    setSelectionEnd(null);
    setSelectedDates([]);
  };

  const handleSelectionCancel = () => {
    setShowSelectionDialog(false);
    setSelectionStart(null);
    setSelectionEnd(null);
    setSelectedDates([]);
  };

  // Render calendar
  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows: JSX.Element[] = [];
    let days: JSX.Element[] = [];
    let day = startDate;

    // Day headers (Mon-Fri only)
    const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const headerRow = (
      <Grid container key="header" sx={{ mb: 1 }}>
        {dayHeaders.map((dayName) => (
          <Grid item xs={12 / 5} key={dayName}>
            <Box
              sx={{
                textAlign: 'center',
                fontWeight: 'bold',
                color: 'text.secondary',
                fontSize: '0.875rem',
              }}
            >
              {dayName}
            </Box>
          </Grid>
        ))}
      </Grid>
    );

    rows.push(headerRow);

    // Calendar days (Mon-Fri only)
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const dayOfWeek = currentDay.getDay(); // 0 = Sunday, 6 = Saturday
        
        // Skip weekends
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          const isCurrentMonth = isSameMonth(currentDay, monthStart);
          const isWeekendDay = isWeekend(currentDay);
          const holiday = isHoliday(currentDay);
          const closed = isClosedDate(currentDay);
          const leaveForDay = getLeaveForDate(currentDay);

          // Filter leave by selected person if applicable
          const displayLeave = selectedPersonId
            ? leaveForDay.filter((l) => l.userId === selectedPersonId)
            : leaveForDay;

          days.push(
            <Grid item xs={12 / 5} key={currentDay.toString()}>
            <Box
              data-date={format(currentDay, 'yyyy-MM-dd')}
              sx={{
                minHeight: { xs: '70px', sm: '80px' },
                border: '1px solid',
                borderColor: isDateSelected(currentDay) ? 'primary.main' : 'divider',
                p: { xs: 0.5, sm: 0.5 },
                backgroundColor: isDateSelected(currentDay)
                  ? 'primary.light'
                  : isCurrentMonth
                  ? isWeekendDay || holiday || closed
                    ? 'action.disabledBackground'
                    : 'background.paper'
                  : 'action.hover',
                opacity: isCurrentMonth ? 1 : 0.5,
                cursor: !isWeekendDay && isCurrentMonth ? 'pointer' : 'default',
                '&:hover': !isWeekendDay && isCurrentMonth ? {
                  backgroundColor: isDateSelected(currentDay)
                    ? 'primary.light'
                    : 'action.hover',
                } : {},
              }}
              onMouseDown={(e) => handleDateMouseDown(currentDay, e)}
              onMouseEnter={() => handleDateMouseEnter(currentDay)}
              onMouseUp={handleDateMouseUp}
              onTouchStart={(e) => handleDateTouchStart(currentDay, e)}
              onTouchMove={handleDateTouchMove}
              onTouchEnd={handleDateTouchEnd}
            >
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  textAlign: 'right',
                  fontWeight: isSameDay(currentDay, new Date()) ? 'bold' : 'normal',
                  color: isSameDay(currentDay, new Date())
                    ? 'primary.main'
                    : 'text.primary',
                  fontSize: { xs: '0.75rem', sm: '0.75rem' },
                }}
              >
                {format(currentDay, 'd')}
              </Typography>

              {/* Holiday indicator */}
              {holiday && (
                <Chip
                  label={holiday.name}
                  size="small"
                  sx={{
                    fontSize: { xs: '0.625rem', sm: '0.65rem' },
                    height: { xs: '18px', sm: '18px' },
                    mb: 0.5,
                    backgroundColor: 'warning.light',
                    '& .MuiChip-label': {
                      px: { xs: 0.5, sm: 1 },
                    },
                  }}
                />
              )}

              {/* Closed date indicator */}
              {closed && (
                <Chip
                  label="Closed"
                  size="small"
                  onClick={(e) => handleClosedDateClick(closed, e)}
                  sx={{
                    fontSize: { xs: '0.625rem', sm: '0.65rem' },
                    height: { xs: '18px', sm: '18px' },
                    mb: 0.5,
                    backgroundColor: 'error.light',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'error.main',
                    },
                    '& .MuiChip-label': {
                      px: { xs: 0.5, sm: 1 },
                    },
                  }}
                />
              )}

              {/* Leave indicators */}
              {displayLeave.map((leave) => {
                const user = users.find((u) => u.id === leave.userId);
                return (
                  <Chip
                    key={leave.id}
                    label={user?.username || 'Unknown'}
                    size="small"
                    sx={{
                      fontSize: { xs: '0.625rem', sm: '0.65rem' },
                      height: { xs: '18px', sm: '18px' },
                      mb: 0.5,
                      backgroundColor: getUserColor(leave.userId),
                      color: 'white',
                      '& .MuiChip-label': {
                        px: { xs: 0.5, sm: 1 },
                      },
                    }}
                  />
                );
              })}
            </Box>
          </Grid>
          );
        }

        day = addDays(day, 1);
      }

      // Only push row if it has weekday content
      if (days.length > 0) {
        rows.push(
          <Grid container key={day.toString()}>
            {days}
          </Grid>
        );
      }
      days = [];
    }

    return rows;
  };

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography>Loading calendar...</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <IconButton onClick={handlePreviousMonth} size="small" sx={{ minWidth: '44px', minHeight: '44px' }}>
          <ChevronLeftIcon />
        </IconButton>
        <Button
          onClick={handleOpenDatePicker}
          startIcon={<CalendarTodayIcon sx={{ display: { xs: 'none', sm: 'block' } }} />}
          sx={{ textTransform: 'none', minHeight: '44px' }}
        >
          <Typography variant="h6" sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
            {format(currentMonth, 'MMMM yyyy')}
          </Typography>
        </Button>
        <IconButton onClick={handleNextMonth} size="small" sx={{ minWidth: '44px', minHeight: '44px' }}>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      <Popover
        open={Boolean(datePickerAnchor)}
        anchorEl={datePickerAnchor}
        onClose={handleCloseDatePicker}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, display: 'flex', gap: 2, minWidth: { xs: 280, sm: 400 }, flexDirection: { xs: 'column', sm: 'row' } }}>
          <FormControl sx={{ minWidth: { xs: '100%', sm: 80 } }}>
            <InputLabel>Day</InputLabel>
            <Select
              value={currentMonth.getDate()}
              onChange={(e) => handleDayChange(e.target.value as number)}
              label="Day"
            >
              {dayOptions.map((day) => (
                <MenuItem key={day} value={day}>
                  {day}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Month</InputLabel>
            <Select
              value={currentMonth.getMonth()}
              onChange={(e) => handleMonthChange(e.target.value as number)}
              label="Month"
            >
              <MenuItem value={0}>January</MenuItem>
              <MenuItem value={1}>February</MenuItem>
              <MenuItem value={2}>March</MenuItem>
              <MenuItem value={3}>April</MenuItem>
              <MenuItem value={4}>May</MenuItem>
              <MenuItem value={5}>June</MenuItem>
              <MenuItem value={6}>July</MenuItem>
              <MenuItem value={7}>August</MenuItem>
              <MenuItem value={8}>September</MenuItem>
              <MenuItem value={9}>October</MenuItem>
              <MenuItem value={10}>November</MenuItem>
              <MenuItem value={11}>December</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: { xs: '100%', sm: 100 } }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={currentMonth.getFullYear()}
              onChange={(e) => handleYearChange(e.target.value as number)}
              label="Year"
            >
              {yearOptions.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Popover>

      <Box>{renderCalendar()}</Box>

      {/* Legend */}
      <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Chip label="Weekend/Holiday/Closed" size="small" sx={{ backgroundColor: 'action.disabledBackground' }} />
        {users.map((user) => (
          <Chip
            key={user.id}
            label={user.username}
            size="small"
            sx={{ backgroundColor: getUserColor(user.id), color: 'white' }}
          />
        ))}
      </Box>

      {/* Date Selection Dialog */}
      {selectedDates.length > 0 && (
        <DateSelectionDialog
          open={showSelectionDialog}
          startDate={selectedDates[0]}
          endDate={selectedDates[selectedDates.length - 1]}
          selectedPersonId={selectedPersonId}
          onConfirm={handleSelectionConfirm}
          onCancel={handleSelectionCancel}
          onLeaveBooked={handleLeaveBooked}
        />
      )}
    </Paper>
  );
};

export default LeaveCalendar;
