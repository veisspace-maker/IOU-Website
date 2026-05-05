# Leave Tracker

## Description

The Leave Tracker is a comprehensive employee leave management system that helps track and manage employee time off. It automatically calculates business days by intelligently excluding weekends, public holidays, and company closure periods. The system provides real-time overlap detection to prevent scheduling conflicts, warns users about past dates, and maintains accurate leave records with a user-friendly calendar interface. All leave calculations are automatically updated when holidays or closed dates change, ensuring data consistency across the organization.

## Overview

The Leave Tracker manages employee leave records with automatic business day calculations that account for weekends, public holidays, and company closure periods. It provides warnings for overlapping leave and ensures accurate leave balance tracking.

## Features

### Leave Management
- Create, edit, and delete leave records
- Date range selection with calendar interface
- Automatic business day calculation
- Overlap detection and warnings
- Past date warnings
- Pagination support (50 records per page)
- **Leave owed tracking**: Automatically calculates and displays leave owed between users

### Business Day Calculation
- Excludes weekends (Saturday and Sunday)
- Excludes public holidays
- Excludes company closed dates
- Automatic recalculation when holidays/closed dates change
- Handles multi-day closure periods

### Leave Owed Calculation
- Tracks leave balance between users
- When one user takes leave, the other user owes them that amount
- Calculates net leave owed (similar to debt tracker logic)
- Displays who owes whom and how many business days
- Updates automatically when leave is added, edited, or deleted

### Smart Features
- Visual calendar for date selection
- Overlap warnings before submission
- Zero business days validation
- Automatic recalculation of existing records
- User-specific leave tracking
- Leave owed summary on home page

## User Interface

### Main Components
1. **Leave Entry Form**: Book new leave with date range
2. **Leave History**: View all leave records
3. **Leave Calendar**: Visual date selection
4. **Summary Cards**: Quick statistics on home page
5. **Leave Owed Display**: Shows who owes whom leave days

### Leave Entry Form
- Start date picker
- End date picker
- Calendar view for easy selection
- Business days preview
- Overlap warnings
- Past date warnings

### Leave History
- Displays all leave records
- Shows: Start Date, End Date, Business Days
- Edit and delete buttons
- Sorted by creation date (newest first)
- Pagination controls

### Leave Owed Display
- Shows on home page in Leave Summary section
- Displays who owes whom and how many business days
- Updates automatically when leave changes
- Only shows when there is a non-zero balance
- Example: "Leva is owed 3 business days by Danik"

### Leave Calendar
- Month view with navigation
- Highlights selected date range
- Shows public holidays
- Shows closed dates
- Color-coded for clarity:
  - Blue: Selected leave dates
  - Red: Public holidays
  - Gray: Closed dates
  - Light gray: Weekends

## Data Model

```typescript
LeaveRecord {
  id: string              // UUID
  userId: string          // User who took leave
  startDate: Date         // First day of leave
  endDate: Date           // Last day of leave
  businessDays: number    // Calculated business days
  createdAt: Date         // Record creation timestamp
  updatedAt: Date         // Last update timestamp
}

PublicHoliday {
  id: string              // UUID
  name: string            // Holiday name
  date: Date              // Holiday date
  createdAt: Date
  updatedAt: Date
}

ClosedDate {
  id: string              // UUID
  startDate: Date         // First day of closure
  endDate: Date           // Last day of closure
  note?: string           // Optional note
  createdAt: Date
  updatedAt: Date
}
```

## API Endpoints

### GET /api/leave
List leave records with pagination.

**Query Parameters:**
- `limit` (optional): Records per page (default: 50, max: 1000)
- `offset` (optional): Records to skip (default: 0)

**Response:**
```json
{
  "leaveRecords": [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "startDate": "2026-05-01",
      "endDate": "2026-05-05",
      "businessDays": 5,
      "createdAt": "2026-04-23T10:00:00Z",
      "updatedAt": "2026-04-23T10:00:00Z"
    }
  ],
  "total": 25,
  "limit": 50,
  "offset": 0
}
```

### GET /api/leave/owed
Calculate leave owed between users.

**Response:**
```json
{
  "debtor": "user-uuid-1",
  "creditor": "user-uuid-2",
  "amount": 3
}
```

**Logic:**
- When a user takes leave, they gain that many days (others owe them)
- For a 2-person system, calculates net leave owed
- If User A took 5 days and User B took 2 days, User B owes User A 3 days
- Returns `null` for debtor/creditor and `0` for amount if balanced or not a 2-person system

### POST /api/leave
Create a new leave record.

**Request Body:**
```json
{
  "startDate": "2026-05-01",
  "endDate": "2026-05-05"
}
```

**Response:**
```json
{
  "leaveRecord": { /* leave record object */ },
  "message": "Leave record created successfully"
}
```

**Error Responses:**
- `400`: Invalid date range, zero business days, or overlapping leave
- `401`: Unauthorized (not authenticated)
- `500`: Server error

### PUT /api/leave/:id
Update an existing leave record.

**Request Body:** Same as POST

**Response:**
```json
{
  "leaveRecord": { /* updated leave record */ },
  "message": "Leave record updated successfully"
}
```

### DELETE /api/leave/:id
Delete a leave record.

**Response:**
```json
{
  "message": "Leave record deleted successfully"
}
```

### POST /api/leave/calculate-business-days
Calculate business days for a date range.

**Request Body:**
```json
{
  "startDate": "2026-05-01",
  "endDate": "2026-05-05"
}
```

**Response:**
```json
{
  "businessDays": 5,
  "startDate": "2026-05-01",
  "endDate": "2026-05-05"
}
```

### POST /api/leave/check-overlap
Check for overlapping leave records.

**Request Body:**
```json
{
  "startDate": "2026-05-01",
  "endDate": "2026-05-05",
  "excludeId": "uuid-to-exclude"  // Optional, for edit operations
}
```

**Response:**
```json
{
  "hasOverlap": false,
  "overlappingRecords": []
}
```

Or if overlap exists:
```json
{
  "hasOverlap": true,
  "overlappingRecords": [
    {
      "id": "uuid",
      "startDate": "2026-05-03",
      "endDate": "2026-05-10",
      "businessDays": 6
    }
  ]
}
```

## Business Logic

### Business Day Calculation Algorithm

```typescript
function calculateBusinessDays(
  startDate: Date,
  endDate: Date,
  holidays: PublicHoliday[],
  closedDates: ClosedDate[]
): number {
  let businessDays = 0;
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // Skip weekends
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Check if it's a public holiday
      const isHoliday = holidays.some(h => 
        isSameDay(h.date, currentDate)
      );
      
      // Check if it's a closed date
      const isClosed = closedDates.some(cd =>
        currentDate >= cd.startDate && currentDate <= cd.endDate
      );
      
      if (!isHoliday && !isClosed) {
        businessDays++;
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return businessDays;
}
```

### Leave Owed Calculation Algorithm

```typescript
function calculateLeaveOwed(
  leaveRecords: LeaveRecord[],
  users: User[]
): LeaveOwedResult {
  // Track leave balance per user
  const leaveBalance = new Map<string, number>();
  
  // Initialize all users with 0 balance
  users.forEach(user => {
    leaveBalance.set(user.id, 0);
  });
  
  // When a user takes leave, they gain that many days
  leaveRecords.forEach(leave => {
    const currentBalance = leaveBalance.get(leave.userId) || 0;
    leaveBalance.set(leave.userId, currentBalance + leave.businessDays);
  });
  
  // For a 2-person system, calculate net leave owed
  if (users.length === 2) {
    const [user1, user2] = users;
    const balance1 = leaveBalance.get(user1.id) || 0;
    const balance2 = leaveBalance.get(user2.id) || 0;
    
    const netDifference = balance1 - balance2;
    
    if (netDifference > 0) {
      // User1 took more leave, so User2 owes User1
      return { debtor: user2.id, creditor: user1.id, amount: netDifference };
    } else if (netDifference < 0) {
      // User2 took more leave, so User1 owes User2
      return { debtor: user1.id, creditor: user2.id, amount: Math.abs(netDifference) };
    }
  }
  
  // No debt or not a 2-person system
  return { debtor: null, creditor: null, amount: 0 };
}
```

**Example:**
```
Danik takes 5 days leave
Leva takes 2 days leave
Result: Leva owes Danik 3 days
```

### Overlap Detection

Leave records are considered overlapping if:
- Start date falls within existing leave period
- End date falls within existing leave period
- New leave period completely encompasses existing leave
- Existing leave completely encompasses new leave

### Automatic Recalculation

When public holidays or closed dates are modified:
1. System fetches all leave records
2. Recalculates business days for each record
3. Updates records where business days changed
4. Maintains data consistency

## Validation Rules

1. **Start Date**: Required, must be a valid date
2. **End Date**: Required, must be >= start date
3. **Business Days**: Must be > 0 (calculated, not input)
4. **Date Range**: End date must not be before start date
5. **Overlap**: Warning shown but not blocking
6. **Past Dates**: Warning shown but not blocking

## Testing

### Unit Tests
- `LeaveEntryForm.test.tsx`: Form validation and submission
- `LeaveHistory.test.tsx`: List rendering and interactions
- `LeaveCalendar.test.tsx`: Calendar functionality and date selection
- `calculations.test.ts`: Business day calculations with holidays and closed dates

### Property-Based Tests
- `LeaveCalendar.pbt.test.tsx`: Calendar behavior with random dates
- Uses fast-check library with minimum 100 iterations per property
- Tests tagged with format: `// Feature: leave-tracker, Property {number}: {description}`
- Validates universal properties across all valid inputs
- Covers business day calculation edge cases

## Mobile Responsiveness

- Touch-optimized date pickers
- Responsive calendar layout
- Large touch targets for dates
- Swipe gestures for navigation
- Optimized for 320px+ screens

## Performance Optimizations

- Pagination for large leave lists
- Memoized business day calculations
- Efficient date comparisons
- Cached holiday and closed date data
- Debounced date selection

## Common Use Cases

### Booking Leave
1. Navigate to Leave page
2. Click "Add Leave" or use calendar
3. Select start date
4. Select end date
5. Review business days calculation
6. Check for overlap warnings
7. Click "Submit"

### Viewing Leave History
1. Navigate to Leave page
2. Scroll through leave records
3. Use pagination for older records
4. Check business days for each period

### Editing Leave
1. Find leave record in history
2. Click edit icon
3. Modify start or end date
4. Review recalculated business days
5. Click "Save"

### Checking Leave Balance
1. View summary cards on home page
2. See total business days taken
3. Compare against annual allowance

## Integration with Settings

### Public Holidays
- Managed in Settings → Public Holidays
- Automatically excluded from business day calculations
- Can be added, edited, or deleted
- Changes trigger recalculation of all leave records

### Closed Dates
- Managed in Settings → Closed Dates
- Represent company-wide closures
- Support date ranges (e.g., Christmas shutdown)
- Automatically excluded from business day calculations

## Database Schema

```sql
CREATE TABLE leave_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  business_days INTEGER NOT NULL CHECK (business_days > 0),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_date_range CHECK (start_date <= end_date)
);

CREATE TABLE public_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE closed_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_closed_date_range CHECK (start_date <= end_date)
);

CREATE INDEX idx_leave_dates ON leave_records(start_date, end_date);
CREATE INDEX idx_leave_user ON leave_records(user_id);
CREATE INDEX idx_holiday_date ON public_holidays(date);
CREATE INDEX idx_closed_dates ON closed_dates(start_date, end_date);
```

## Timezone Handling

All dates are handled in the configured timezone (default: Australia/Melbourne):
- Database stores dates in configured timezone
- Frontend displays dates in local timezone
- Business day calculations use configured timezone
- Consistent handling across all operations

## Future Enhancements

- Leave balance tracking per employee with annual allowances
- Annual leave allowance management and configuration
- Leave approval workflow with manager approval
- Email notifications for leave requests and approvals
- Calendar export (iCal format) for external calendar apps
- Leave type categorization (annual, sick, personal, unpaid, parental)
- Half-day leave support with morning/afternoon options
- Team leave calendar view showing all employees
- Leave request comments and notes for context
- Manager approval system with multi-level approval
- Leave balance reports and analytics
- Carry-over leave tracking year-to-year
- Leave accrual calculations based on tenure
- Public holiday substitution (when holiday falls on weekend)
- Leave conflict resolution for overlapping requests
- Automatic leave balance deduction
- Leave history export to PDF/Excel
