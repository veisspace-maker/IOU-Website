# Calendar Date Selection Feature - Design Document

## Overview
This document details the technical design for implementing interactive date selection on the leave calendar, allowing users to click or drag-select dates and navigate to the Closed Dates settings with pre-filled information.

## Architecture

### Component Structure
```
LeaveCalendar (modified)
├── DateSelectionDialog (new)
└── Calendar Grid (modified with selection handlers)

ClosedDatesManager (modified)
└── Pre-population logic from navigation state

SettingsPage (no changes needed)
```

## Detailed Design

### 1. LeaveCalendar Component Modifications

#### 1.1 New State Variables
```typescript
// Selection state
const [isSelecting, setIsSelecting] = useState(false);
const [selectionStart, setSelectionStart] = useState<Date | null>(null);
const [selectionEnd, setSelectionEnd] = useState<Date | null>(null);
const [selectedDates, setSelectedDates] = useState<Date[]>([]);

// Dialog state
const [showSelectionDialog, setShowSelectionDialog] = useState(false);
const [selectionNote, setSelectionNote] = useState('');

// Clicked closed date state
const [clickedClosedDate, setClickedClosedDate] = useState<ClosedDate | null>(null);
```

#### 1.2 Mouse Event Handlers
```typescript
const handleDateMouseDown = (date: Date, event: React.MouseEvent) => {
  // Prevent default to avoid text selection
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
  const start = selectionStart < date ? selectionStart : date;
  const end = selectionStart < date ? date : selectionStart;
  const datesInRange = getWeekdaysInRange(start, end);
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

// Helper function to get weekdays in range
const getWeekdaysInRange = (start: Date, end: Date): Date[] => {
  const dates: Date[] = [];
  let current = new Date(start);
  
  while (current <= end) {
    if (!isWeekend(current)) {
      dates.push(new Date(current));
    }
    current = addDays(current, 1);
  }
  
  return dates;
};
```

#### 1.3 Keyboard Event Handler
```typescript
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isSelecting) {
      // Cancel selection
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      setSelectedDates([]);
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [isSelecting]);
```

#### 1.4 Closed Date Click Handler
```typescript
const handleClosedDateClick = (closedDate: ClosedDate, event: React.MouseEvent) => {
  event.stopPropagation(); // Prevent date selection
  setClickedClosedDate(closedDate);
  
  // Navigate directly to settings with edit mode
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
```

#### 1.5 Visual Feedback for Selection
```typescript
const isDateSelected = (date: Date): boolean => {
  return selectedDates.some(d => isSameDay(d, date));
};

// In the calendar cell rendering:
<Box
  sx={{
    minHeight: '80px',
    border: '1px solid',
    borderColor: isDateSelected(currentDay) ? 'primary.main' : 'divider',
    p: 0.5,
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
>
  {/* ... existing content ... */}
</Box>
```

#### 1.6 Closed Date Chip Modification
```typescript
{/* Closed date indicator */}
{closed && (
  <Chip
    label="Closed"
    size="small"
    onClick={(e) => handleClosedDateClick(closed, e)}
    sx={{
      fontSize: '0.65rem',
      height: '18px',
      mb: 0.5,
      backgroundColor: 'error.light',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: 'error.main',
      },
    }}
  />
)}
```

### 2. DateSelectionDialog Component (New)

#### 2.1 Component Definition
```typescript
interface DateSelectionDialogProps {
  open: boolean;
  startDate: Date;
  endDate: Date;
  onConfirm: (note: string) => void;
  onCancel: () => void;
}

const DateSelectionDialog: React.FC<DateSelectionDialogProps> = ({
  open,
  startDate,
  endDate,
  onConfirm,
  onCancel,
}) => {
  const [note, setNote] = useState('');
  
  const handleConfirm = () => {
    onConfirm(note);
    setNote(''); // Reset for next time
  };
  
  const handleSkip = () => {
    onConfirm(''); // Confirm with empty note
    setNote('');
  };
  
  const handleCancel = () => {
    onCancel();
    setNote('');
  };
  
  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Add Closed Period</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Selected date range:
        </DialogContentText>
        <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2 }}>
          {format(startDate, 'MMM dd, yyyy')} → {format(endDate, 'MMM dd, yyyy')}
        </Typography>
        <TextField
          fullWidth
          label="Note (Optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          multiline
          rows={3}
          placeholder="Add a description for this closed period..."
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSkip} variant="outlined">
          Skip Note
        </Button>
        <Button onClick={handleConfirm} variant="contained">
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

#### 2.2 Integration in LeaveCalendar
```typescript
const handleSelectionConfirm = (note: string) => {
  setShowSelectionDialog(false);
  
  if (selectedDates.length === 0) return;
  
  // Get start and end dates (already sorted)
  const start = selectedDates[0];
  const end = selectedDates[selectedDates.length - 1];
  
  // Navigate to settings with state
  navigate('/settings', {
    state: {
      openTab: 1,
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
      note: note || undefined,
    }
  });
  
  // Reset selection
  setSelectionStart(null);
  setSelectionEnd(null);
  setSelectedDates([]);
  setSelectionNote('');
};

const handleSelectionCancel = () => {
  setShowSelectionDialog(false);
  setSelectionStart(null);
  setSelectionEnd(null);
  setSelectedDates([]);
  setSelectionNote('');
};

// In JSX:
<DateSelectionDialog
  open={showSelectionDialog}
  startDate={selectedDates[0] || new Date()}
  endDate={selectedDates[selectedDates.length - 1] || new Date()}
  onConfirm={handleSelectionConfirm}
  onCancel={handleSelectionCancel}
/>
```

### 3. ClosedDatesManager Component Modifications

#### 3.1 Read Navigation State
```typescript
import { useLocation } from 'react-router-dom';

const ClosedDatesManager: React.FC = () => {
  const location = useLocation();
  
  // ... existing state ...
  
  // Handle navigation state on mount
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
  
  // ... rest of component ...
};
```

### 4. Touch Support for Mobile

#### 4.1 Touch Event Handlers
```typescript
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
  const start = selectionStart < date ? selectionStart : date;
  const end = selectionStart < date ? date : selectionStart;
  const datesInRange = getWeekdaysInRange(start, end);
  setSelectedDates(datesInRange);
};

const handleDateTouchEnd = () => {
  if (!isSelecting) return;
  
  setIsSelecting(false);
  
  if (selectedDates.length > 0) {
    setShowSelectionDialog(true);
  }
};

// Add to calendar cell:
<Box
  data-date={format(currentDay, 'yyyy-MM-dd')}
  onTouchStart={(e) => handleDateTouchStart(currentDay, e)}
  onTouchMove={handleDateTouchMove}
  onTouchEnd={handleDateTouchEnd}
  // ... other props ...
>
```

## Data Flow

### Selection Flow
```
1. User clicks/touches date
   → handleDateMouseDown/handleDateTouchStart
   → Set isSelecting = true, selectionStart = date

2. User drags to other dates
   → handleDateMouseEnter/handleDateTouchMove
   → Update selectionEnd, calculate selectedDates array

3. User releases mouse/touch
   → handleDateMouseUp/handleDateTouchEnd
   → Set isSelecting = false
   → Show DateSelectionDialog

4. User adds optional note and confirms
   → handleSelectionConfirm
   → Navigate to /settings with state

5. SettingsPage receives navigation
   → Opens tab 1 (Closed Dates)
   → ClosedDatesManager reads state
   → Pre-fills form fields
```

### Closed Date Click Flow
```
1. User clicks "Closed" chip
   → handleClosedDateClick
   → Navigate to /settings with state (including editId)

2. SettingsPage receives navigation
   → Opens tab 1 (Closed Dates)
   → ClosedDatesManager reads state
   → Pre-fills form in edit mode
```

## Styling Considerations

### Selection Visual Feedback
- Selected dates: `backgroundColor: 'primary.light'`, `borderColor: 'primary.main'`
- Hover state: `backgroundColor: 'action.hover'`, `cursor: 'pointer'`
- Disabled dates (weekends): `cursor: 'default'`, no hover effect

### Dialog Styling
- Max width: `sm` (600px)
- Full width on mobile
- Note field: 3 rows, multiline
- Three action buttons: Cancel (text), Skip Note (outlined), Continue (contained)

## Performance Considerations

1. **Debouncing**: Mouse enter events fire frequently during drag - consider debouncing if performance issues arise
2. **Memoization**: Use `useMemo` for `getWeekdaysInRange` if calculating large date ranges
3. **Event Listeners**: Clean up keyboard event listener on unmount
4. **State Updates**: Batch state updates where possible to minimize re-renders

## Accessibility

### Keyboard Support
- ESC key cancels selection
- Future enhancement: Arrow keys for keyboard-only date selection
- Tab navigation through dialog buttons

### Screen Reader Support
```typescript
<Box
  role="button"
  aria-label={`Select date ${format(currentDay, 'MMMM d, yyyy')}`}
  tabIndex={!isWeekendDay && isCurrentMonth ? 0 : -1}
  // ... other props ...
>
```

### Focus Management
- Dialog should trap focus when open
- Focus should return to calendar after dialog closes
- Material-UI Dialog handles this automatically

## Error Handling

### Edge Cases
1. **No dates selected**: Dialog should not appear
2. **Single date selected**: Start and end date are the same
3. **Backward selection**: Dates are automatically sorted
4. **Month navigation during selection**: Cancel selection on month change
5. **Component unmount during selection**: Clean up state

### Implementation
```typescript
// Cancel selection on month change
useEffect(() => {
  if (isSelecting) {
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
    setSelectedDates([]);
  }
}, [currentMonth]);
```

## Testing Strategy

### Unit Tests
1. Date selection logic (getWeekdaysInRange)
2. State updates during selection
3. Navigation state handling in ClosedDatesManager

### Integration Tests
1. Click single date → dialog appears → navigate to settings
2. Drag multiple dates → dialog appears → navigate to settings
3. Click closed date chip → navigate to settings in edit mode
4. ESC key cancels selection
5. Form pre-population from navigation state

### Manual Testing
1. Test on different screen sizes
2. Test touch events on mobile devices
3. Test with screen reader
4. Test keyboard navigation
5. Test rapid clicking/dragging

## Correctness Properties

### Property 1: Selection Range Validity
**Validates: Requirements 2.1, 2.2**

For any date selection operation:
- All selected dates must be weekdays (Monday-Friday)
- All selected dates must be in the current month
- Start date ≤ End date (automatically sorted)
- No duplicate dates in selectedDates array

```typescript
// Property test
property('selected dates are always valid weekdays in range', 
  arbitrary.date(), arbitrary.date(), (start, end) => {
    const sorted = [start, end].sort((a, b) => a.getTime() - b.getTime());
    const result = getWeekdaysInRange(sorted[0], sorted[1]);
    
    return result.every(date => 
      !isWeekend(date) && 
      date >= sorted[0] && 
      date <= sorted[1]
    ) && 
    new Set(result.map(d => d.getTime())).size === result.length;
  }
);
```

### Property 2: Navigation State Preservation
**Validates: Requirements 4.1, 4.2**

When navigating with state:
- All provided state fields are preserved
- ClosedDatesManager correctly reads and applies state
- Form fields match the navigation state values

```typescript
// Property test
property('navigation state is preserved and applied',
  arbitrary.date(), arbitrary.date(), arbitrary.string(), (start, end, note) => {
    const state = {
      openTab: 1,
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
      note: note
    };
    
    // Simulate navigation and state reading
    const appliedState = readNavigationState(state);
    
    return appliedState.startDate === state.startDate &&
           appliedState.endDate === state.endDate &&
           appliedState.note === state.note;
  }
);
```

### Property 3: Selection Cancellation
**Validates: Requirements 3.1**

When selection is cancelled (ESC key or dialog cancel):
- All selection state is cleared
- No navigation occurs
- Calendar returns to normal state

```typescript
// Property test
property('cancelled selection clears all state',
  arbitrary.array(arbitrary.date()), (dates) => {
    // Simulate selection
    setSelectedDates(dates);
    setIsSelecting(true);
    
    // Cancel
    handleSelectionCancel();
    
    return selectedDates.length === 0 &&
           !isSelecting &&
           selectionStart === null &&
           selectionEnd === null;
  }
);
```

## Future Enhancements

1. **Multi-month selection**: Allow selecting dates across month boundaries
2. **Quick actions**: Right-click context menu for quick operations
3. **Drag to edit**: Drag edges of existing closed periods to resize
4. **Bulk operations**: Select multiple closed periods for batch delete
5. **Keyboard shortcuts**: Ctrl+Click for multi-select, Shift+Click for range select
6. **Undo/Redo**: History stack for selection operations

## Dependencies

### Existing Dependencies (No Changes)
- React Router: `useNavigate`, `useLocation`
- Material-UI: Dialog, TextField, Button components
- date-fns: Date manipulation functions

### New Dependencies
None - all functionality uses existing dependencies

## Migration Notes

This is a new feature with no breaking changes. Existing functionality remains unchanged:
- Calendar display works as before
- Closed dates display as before
- Settings page works as before

The new selection feature is purely additive.
