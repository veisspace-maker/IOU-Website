# Leave Owed Feature Implementation Summary

## Overview
Added a new feature to track leave owed between users in the Leave Tracker system. Similar to the debt tracker logic but simpler - when one user takes leave, the other user owes them that amount of leave days.

## Changes Made

### Backend Changes

#### 1. Business Logic (`backend/src/business-logic/calculations.ts`)
- Added `LeaveOwedResult` interface with `debtor`, `creditor`, and `amount` fields
- Implemented `calculateLeaveOwed()` function that:
  - Tracks leave balance per user
  - When a user takes leave, they gain that many days (others owe them)
  - Calculates net leave owed for 2-person systems
  - Returns who owes whom and how many business days

**Logic Example:**
```
Danik takes 5 days leave
Leva takes 2 days leave
Result: Leva owes Danik 3 days
```

#### 2. API Endpoint (`backend/src/routes/leave.ts`)
- Added `GET /api/leave/owed` endpoint
- Fetches all leave records and users
- Calculates and returns leave owed information
- Response format:
  ```json
  {
    "debtor": "user-id",
    "creditor": "user-id",
    "amount": 3
  }
  ```

#### 3. Tests (`backend/src/business-logic/leaveOwedCalculations.test.ts`)
- Created comprehensive test suite with 7 test cases:
  - Zero debt when no leave records exist
  - Debt calculation when one user takes leave
  - Net debt calculation when both users take leave
  - Zero debt when leave is balanced
  - Reverse debt direction handling
  - Multiple leave records per user
  - Non-2-person systems (returns zero)
- All tests passing ✓

### Frontend Changes

#### 1. Leave Summary Cards (`frontend/src/components/LeaveSummaryCards.tsx`)
- Added state for `leaveOwed` and `users`
- Fetches leave owed data from new API endpoint
- Added `getUserName()` helper function to resolve user IDs to names
- Displays leave owed information in an Alert component above the leave cards
- Shows format: "Leva is owed 3 business days by Danik"
- Only displays when there is a non-zero balance
- Updates automatically when leave changes

**UI Layout:**
```
Leave Summary
├── Leave Owed Alert (if amount > 0)
│   └── "Leva is owed 3 business days by Danik"
└── Current/Upcoming Leave Cards
    ├── Card 1: "Danik is on leave"
    └── Card 2: "Leva is on leave"
```

### Documentation Changes

#### 1. LEAVE_TRACKER_README.md
- Updated Features section to include leave owed tracking
- Added Leave Owed Calculation section with algorithm explanation
- Added `GET /api/leave/owed` endpoint documentation
- Updated User Interface section to include Leave Owed Display
- Added example scenarios

## How It Works

### Calculation Logic
1. System tracks leave balance for each user
2. When a user takes leave, they accumulate that many days
3. For a 2-person system, calculates the difference
4. The user with fewer leave days owes the difference to the other user

### User Experience
1. Users book leave as normal
2. System automatically calculates leave owed
3. Home page displays who owes whom in the Leave Summary section
4. Updates in real-time as leave is added, edited, or deleted

## Testing

### Backend Tests
```bash
cd backend
npm test -- leaveOwedCalculations.test.ts
```
All 7 tests passing ✓

### Manual Testing Checklist
- [ ] Book leave for User 1
- [ ] Verify leave owed shows User 2 owes User 1
- [ ] Book leave for User 2
- [ ] Verify leave owed updates to show net difference
- [ ] Balance the leave (equal days)
- [ ] Verify leave owed shows zero or disappears
- [ ] Edit existing leave
- [ ] Verify leave owed recalculates correctly
- [ ] Delete leave
- [ ] Verify leave owed updates accordingly

## API Usage Examples

### Get Leave Owed
```bash
GET /api/leave/owed
```

**Response when Danik owes Leva:**
```json
{
  "debtor": "danik-user-id",
  "creditor": "leva-user-id",
  "amount": 3
}
```

**Response when balanced:**
```json
{
  "debtor": null,
  "creditor": null,
  "amount": 0
}
```

## Future Enhancements
- Add leave owed history tracking
- Support for more than 2 users with pairwise calculations
- Leave owed notifications
- Export leave owed reports
- Integration with leave approval workflow
- Leave owed settlement tracking

## Notes
- Feature only works for 2-person systems (returns zero for other configurations)
- Leave owed is calculated from all historical leave records
- No database schema changes required (uses existing leave_records table)
- Calculation is performed on-demand (not stored in database)
- Similar pattern to debt tracker but simpler (no split transactions)
