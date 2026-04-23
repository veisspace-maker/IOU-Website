# Calendar Date Selection Feature - Implementation Tasks

## Tasks

- [ ] 1. Create DateSelectionDialog Component
  - Create new file: `frontend/src/components/DateSelectionDialog.tsx`
  - Component should accept props: `open`, `startDate`, `endDate`, `onConfirm`, `onCancel`
  - Display selected date range in readable format
  - Include optional multiline text field for note (3 rows)
  - Three action buttons: Cancel, Skip Note, Continue
  - Reset note state on close/cancel
  - Use Material-UI Dialog, TextField, Button components

- [ ] 2. Add Selection State to LeaveCalendar
  - Add state variables for selection tracking: `isSelecting`, `selectionStart`, `selectionEnd`, `selectedDates`
  - Add state for dialog: `showSelectionDialog`, `selectionNote`
  - Add state for clicked closed dates: `clickedClosedDate`
  - Import `useNavigate` from react-router-dom

- [ ] 3. Implement Date Selection Helper Function
  - Add `getWeekdaysInRange(start: Date, end: Date): Date[]` function
  - Function should iterate from start to end date
  - Skip weekend dates (Saturday, Sunday)
  - Return array of Date objects
  - Handle case where start > end (swap them)

- [ ] 4. Implement Mouse Event Handlers
  - Implement `handleDateMouseDown(date: Date, event: React.MouseEvent)`
  - Implement `handleDateMouseEnter(date: Date)`
  - Implement `handleDateMouseUp()`
  - Single click selects one date
  - Click and drag selects multiple dates
  - Only weekdays in current month can be selected

- [ ] 5. Implement Touch Event Handlers
  - Implement `handleDateTouchStart(date: Date, event: React.TouchEvent)`
  - Implement `handleDateTouchMove(event: React.TouchEvent)`
  - Implement `handleDateTouchEnd()`
  - Add `data-date` attribute to calendar cells
  - Touch and hold starts selection
  - Dragging finger selects multiple dates

- [ ] 6. Implement Keyboard Support
  - Add useEffect hook for keyboard events
  - Listen for 'Escape' key press
  - When ESC pressed during selection: clear all selection state
  - Clean up event listener on unmount

- [ ] 7. Add Visual Feedback for Selection
  - Create `isDateSelected(date: Date): boolean` helper function
  - Update calendar cell Box component styling
  - Add border color change when selected (primary.main)
  - Add background color when selected (primary.light)
  - Add cursor pointer for selectable dates
  - Add hover effect for selectable dates

- [ ] 8. Implement Closed Date Chip Click Handler
  - Implement `handleClosedDateClick(closedDate: ClosedDate, event: React.MouseEvent)`
  - Stop event propagation to prevent date selection
  - Navigate to /settings with state (openTab: 1, startDate, endDate, note, editId)
  - Update Closed chip to be clickable with onClick handler
  - Add cursor pointer style and hover effect

- [ ] 9. Implement Selection Dialog Handlers
  - Implement `handleSelectionConfirm(note: string)`
  - Implement `handleSelectionCancel()`
  - Add DateSelectionDialog component to JSX
  - Navigate to /settings with state on confirm
  - Clear all selection state after navigation

- [ ] 10. Cancel Selection on Month Change
  - Add useEffect hook that watches currentMonth
  - When currentMonth changes and isSelecting is true: clear all selection state

- [ ] 11. Add Navigation State Handling to ClosedDatesManager
  - Import `useLocation` from react-router-dom
  - Add useEffect hook to read location.state on mount
  - Check for state properties: startDate, endDate, note, editId
  - Parse and set form fields from state
  - Clear navigation state after reading using `window.history.replaceState`

- [ ] 12. Write Unit Tests for Date Selection Logic
  - Create test file: `frontend/src/components/LeaveCalendar.test.tsx`
  - Test `getWeekdaysInRange` function
  - Test returns only weekdays
  - Test handles reversed date order
  - Test returns empty array for weekend-only range
  - Test handles single day range and multi-week range

- [ ] 13. Write Property-Based Test for Selection Range Validity
  - Create test file: `frontend/src/components/LeaveCalendar.pbt.test.tsx`
  - Use fast-check library for property testing
  - Test property: "selected dates are always valid weekdays in range"
  - Generate arbitrary start and end dates
  - Verify all returned dates are weekdays, within range, no duplicates, sorted

- [ ] 14. Write Integration Test for Click Selection Flow
  - Create test file: `frontend/src/components/DateSelection.integration.test.tsx`
  - Test scenario: Render LeaveCalendar, click date, verify dialog, enter note, click Continue
  - Verify navigation to settings with correct state
  - Mock useNavigate and useLocation

- [ ] 15. Write Integration Test for Drag Selection Flow
  - Test scenario: mouseDown on first date, mouseEnter on subsequent dates, mouseUp
  - Verify dialog shows correct date range
  - Click Continue and verify navigation with correct dates

- [ ] 16. Write Integration Test for Closed Date Click
  - Test scenario: Render LeaveCalendar with closed dates, click "Closed" chip
  - Verify navigation to settings with edit state
  - Verify editId is included in state

- [ ] 17. Manual Testing on Desktop
  - Test in Chrome, Firefox, Safari, Edge
  - Test single date click, multi-date drag, ESC cancellation, closed date chip click
  - Test dialog interactions and form pre-population
  - Verify visual feedback and check for console errors

- [ ] 18. Manual Testing on Mobile
  - Test on iOS and Android devices
  - Test touch and hold to select, drag to select multiple dates
  - Test dialog interactions on small screen
  - Test in portrait and landscape modes

- [ ] 19. Accessibility Testing
  - Test with keyboard only: Tab navigation, ESC key, dialog keyboard navigation
  - Test with screen reader: date cells announced, selection state announced
  - Verify focus management and color contrast

- [ ] 20. Performance Testing
  - Test with React DevTools Profiler
  - Measure render time during date selection drag, month navigation, dialog open/close
  - Check for unnecessary re-renders
  - Verify selection updates at 60fps
