# Design Document: Company Tracker

## Overview

The Company Tracker is an internal web application for tracking money transactions (both personal and company-related) and employee leave. The system uses a client-server architecture with a React-based frontend and a Node.js/Express backend with PostgreSQL for data persistence. The application emphasizes real-time calculations, data consistency, and an intuitive user interface.

Key design principles:
- **Calculation-driven**: Net balances, company debt, and business day counts are computed dynamically
- **Validation-first**: All inputs are validated before persistence
- **User-centric**: UI adapts to logged-in user context
- **Consistency**: All views reflect the same underlying data state
- **Immutability**: Transactions cannot be edited or deleted after creation

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Auth Layer  │  │  State Mgmt  │  │  UI Components│      │
│  │  (Context)   │  │  (Redux)     │  │  (Material-UI)│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │ HTTPS/REST
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js/Express)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Auth        │  │  Business    │  │  Data Access │      │
│  │  Middleware  │  │  Logic       │  │  Layer       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                     │
│  Users │ Personal Transactions │ Company Transactions │      │
│  Leave │ Holidays │ Closed │ Birthdays                      │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18+ with TypeScript
- Redux Toolkit for state management
- Material-UI (MUI) for component library
- React Router for navigation
- Axios for HTTP requests
- date-fns for date manipulation

**Backend:**
- Node.js with Express
- TypeScript
- Passport.js for authentication
- bcrypt for password hashing
- speakeasy for 2FA
- node-postgres (pg) for database access

**Database:**
- PostgreSQL 14+
- Timezone-aware timestamps

## Components and Interfaces

### Frontend Components

#### 1. Authentication Components

**LoginPage**
- Handles user authentication
- Supports "Remember me" functionality
- Integrates 2FA when enabled
- Validates credentials before submission

**AuthContext**
- Provides logged-in user context throughout the app
- Manages session persistence
- Exposes user identity to all components

#### 2. Home Page Components

**HomePage**
- Container for all home page sections
- Displays user identity at top
- Coordinates card navigation

**MoneyS ummaryCards**
- Fetches and displays net balance cards
- Implements horizontal swipe navigation
- Sorts by largest amount then recent activity
- Handles click navigation to Money page with pre-selection

**LeaveSummaryCards**
- Fetches and displays current/upcoming leave
- Implements horizontal swipe navigation
- Handles click navigation to Leave page with pre-selection

**BirthdayBanner**
- Conditionally renders on matching birthdays
- Calculates age dynamically
- Handles Feb 29 edge case
- Navigates to Settings > Birthdays on click

**PublicHolidayWidget**
- Displays next upcoming public holiday
- Fetches from backend API

#### 3. Money Page Components

**MoneyPage (Personal Money)**
- Container for personal money tracking features
- Manages person selection state
- Displays page switcher arrow to Company Money page

**MoneyPage (Company Money)**
- Container for company money tracking features
- Displays current debt for logged-in user
- Provides swipe/slide widget to view reverse debt
- Displays page switcher arrow to Personal Money page

**PersonSelector**
- Displays left and right person columns
- Handles selection logic (green left, red right)
- Disables selected person on opposite side
- Makes disabled people transparent

**TransactionEntryPanel (Personal Money)**
- Slides down when both people selected
- Accepts: who paid/received, amount, date, optional description
- Validates amount (positive only)
- Shows warning popup for invalid amounts
- Submits personal transaction to backend

**CompanyTransactionEntryPanel (Company Money)**
- Displays when on Company Money page
- Accepts: who paid/received, amount, date, optional description
- Validates amount (positive only)
- Shows warning popup for invalid amounts
- Submits company transaction to backend
- Automatically calculates debt based on 50/50 ownership

**TransactionHistory**
- Displays all transactions (personal and company, latest first)
- Shows separate entries (no aggregation)
- Provides filters for date range, person, and money type
- Displays transactions in AUD currency
- No edit/delete functionality (immutable transactions)

#### 4. Leave Page Components

**LeavePage**
- Container for leave tracking features
- Manages person selection state

**PersonSelector**
- Displays person buttons
- Disables non-selected person (transparent)
- Handles selection state

**LeaveEntryForm**
- Provides date pickers for start/end
- Disables weekends, holidays, closed dates
- Calculates business days automatically
- Labels single-day leave as "Day Off"
- Validates zero business day ranges
- Shows overlap popup with merge/keep separate options
- Shows past date warning popup
- Submits leave record to backend

**LeaveCalendar**
- Monthly calendar view
- Shows leave ranges with customizable colors
- Displays disabled days clearly
- Scrolls to selected person's leave

**LeaveHistory**
- Lists all leave records
- Shows person, date range, business day count
- Opens edit/delete popup on click

**LeaveModal**
- Combined popup for edit/delete/cancel
- Requires confirmation for changes

#### 5. Settings Components

**SettingsMenu**
- Accessible from top-right corner
- Tabbed interface for sections

**AccountSettings**
- Change password form
- Edit username form (validates uniqueness)
- Logout button

**ClosedDatesManager**
- Add closed period form
- List of closed periods
- Edit/delete with confirmation
- Overlap detection with merge/keep separate popup
- Conflict detection with leave warning
- Past date warning popup

**PublicHolidaysManager**
- Add/edit/delete public holidays
- List view of all holidays

**BirthdaysManager**
- Add birthday form (name, date of birth)
- List of all birthdays
- Edit/delete with confirmation
- Calculates age dynamically (never stores age)

### Backend API Endpoints

#### Authentication
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/logout` - End session
- `POST /api/auth/verify-2fa` - Verify 2FA code
- `GET /api/auth/me` - Get current user

#### Users
- `GET /api/users` - List all users
- `PUT /api/users/:id` - Update user (username, password)

#### Transactions (Personal)
- `GET /api/transactions/personal` - List all personal transactions
- `POST /api/transactions/personal` - Create personal transaction
- `GET /api/transactions/personal/net-balances` - Get net balances for personal transactions

#### Transactions (Company)
- `GET /api/transactions/company` - List all company transactions
- `POST /api/transactions/company` - Create company transaction
- `GET /api/transactions/company/debt` - Get company debt for all user pairs
- `POST /api/transactions/company/calculate-debt` - Calculate debt for a specific transaction

#### Transactions (Combined)
- `GET /api/transactions/all` - List all transactions (personal and company)
- `GET /api/transactions/combined-balances` - Get combined net balances (personal + company debt)

#### Leave
- `GET /api/leave` - List all leave records
- `POST /api/leave` - Create leave record
- `PUT /api/leave/:id` - Update leave record
- `DELETE /api/leave/:id` - Delete leave record
- `POST /api/leave/calculate-business-days` - Calculate business days for date range
- `POST /api/leave/check-overlap` - Check for overlapping leave

#### Public Holidays
- `GET /api/holidays` - List all public holidays
- `POST /api/holidays` - Create public holiday
- `PUT /api/holidays/:id` - Update public holiday
- `DELETE /api/holidays/:id` - Delete public holiday
- `GET /api/holidays/next` - Get next upcoming holiday

#### Closed Dates
- `GET /api/closed-dates` - List all closed periods
- `POST /api/closed-dates` - Create closed period
- `PUT /api/closed-dates/:id` - Update closed period
- `DELETE /api/closed-dates/:id` - Delete closed period
- `POST /api/closed-dates/check-overlap` - Check for overlapping periods
- `POST /api/closed-dates/check-leave-conflict` - Check for leave conflicts

#### Birthdays
- `GET /api/birthdays` - List all birthdays
- `POST /api/birthdays` - Create birthday
- `PUT /api/birthdays/:id` - Update birthday
- `DELETE /api/birthdays/:id` - Delete birthday
- `GET /api/birthdays/today` - Get today's birthdays with calculated ages

## Data Models

### User
```typescript
interface User {
  id: string;
  username: string;
  passwordHash: string;
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### PersonalTransaction
```typescript
interface PersonalTransaction {
  id: string;
  fromUserId: string;  // Person who received value (left person)
  toUserId: string;    // Person who provided value (right person)
  amount: number;      // Must be > 0, in AUD
  date: Date;
  description?: string;
  createdAt: Date;
}
```

### CompanyTransaction
```typescript
interface CompanyTransaction {
  id: string;
  userId: string;      // Person who paid or received
  amount: number;      // Must be > 0, in AUD
  date: Date;
  description?: string;
  transactionType: 'personal_for_company' | 'company_for_personal' | 'company_income_personal' | 'company_for_company';
  createdAt: Date;
}
```

### NetBalance
```typescript
interface NetBalance {
  userAId: string;
  userBId: string;
  netAmount: number;      // Positive = A owes B, Negative = B owes A
  lastTransactionDate: Date;
}
```

### CompanyDebt
```typescript
interface CompanyDebt {
  userAId: string;
  userBId: string;
  debtAmount: number;     // Positive = A owes B, Negative = B owes A
  lastTransactionDate: Date;
}
```

### CombinedBalance
```typescript
interface CombinedBalance {
  userAId: string;
  userBId: string;
  personalBalance: number;
  companyDebt: number;
  combinedBalance: number;  // personalBalance + companyDebt
  lastTransactionDate: Date;
}
```

### LeaveRecord
```typescript
interface LeaveRecord {
  id: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  businessDays: number;  // Calculated field
  createdAt: Date;
  updatedAt: Date;
}
```

### PublicHoliday
```typescript
interface PublicHoliday {
  id: string;
  name: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### ClosedDate
```typescript
interface ClosedDate {
  id: string;
  startDate: Date;
  endDate: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Birthday
```typescript
interface Birthday {
  id: string;
  name: string;
  dateOfBirth: Date;  // Store only date, not age
  createdAt: Date;
  updatedAt: Date;
}
```

### Calculated Birthday
```typescript
interface BirthdayWithAge {
  id: string;
  name: string;
  dateOfBirth: Date;
  turningAge: number;  // Calculated dynamically
  isToday: boolean;
}
```

## Core Algorithms

### 1. Net Balance Calculation (Personal Transactions)

```typescript
function calculateNetBalance(userAId: string, userBId: string, transactions: PersonalTransaction[]): NetBalance {
  // Filter transactions between these two users
  const relevantTransactions = transactions.filter(t => 
    (t.fromUserId === userAId && t.toUserId === userBId) ||
    (t.fromUserId === userBId && t.toUserId === userAId)
  );
  
  // Calculate net: positive = A owes B, negative = B owes A
  let netAmount = 0;
  let lastDate = new Date(0);
  
  for (const transaction of relevantTransactions) {
    if (transaction.fromUserId === userAId) {
      // A received value from B, so A owes B
      netAmount += transaction.amount;
    } else {
      // B received value from A, so B owes A (negative for A)
      netAmount -= transaction.amount;
    }
    
    if (transaction.date > lastDate) {
      lastDate = transaction.date;
    }
  }
  
  return {
    userAId,
    userBId,
    netAmount,
    lastTransactionDate: lastDate
  };
}
```

### 2. Company Debt Calculation

```typescript
function calculateCompanyDebt(userAId: string, userBId: string, transactions: CompanyTransaction[]): CompanyDebt {
  // Filter company transactions involving these two users
  const relevantTransactions = transactions.filter(t => 
    t.userId === userAId || t.userId === userBId
  );
  
  // Calculate debt based on 50/50 ownership
  let debtAmount = 0;
  let lastDate = new Date(0);
  
  for (const transaction of relevantTransactions) {
    const halfAmount = Math.round(transaction.amount * 50) / 100; // Round to nearest cent
    
    if (transaction.transactionType === 'personal_for_company') {
      // Personal money used for company expense
      // The payer covered the other person's 50% share
      if (transaction.userId === userAId) {
        // A paid personal for company, B owes A half
        debtAmount -= halfAmount;
      } else {
        // B paid personal for company, A owes B half
        debtAmount += halfAmount;
      }
    } else if (transaction.transactionType === 'company_for_personal') {
      // Company money used for personal expense
      // The beneficiary owes the other person half
      if (transaction.userId === userAId) {
        // A used company for personal, A owes B half
        debtAmount += halfAmount;
      } else {
        // B used company for personal, B owes A half
        debtAmount -= halfAmount;
      }
    } else if (transaction.transactionType === 'company_income_personal') {
      // Company income received by one person
      // The receiver owes the other person half
      if (transaction.userId === userAId) {
        // A received company income, A owes B half
        debtAmount += halfAmount;
      } else {
        // B received company income, B owes A half
        debtAmount -= halfAmount;
      }
    }
    // 'company_for_company' creates no debt, so we skip it
    
    if (transaction.date > lastDate) {
      lastDate = transaction.date;
    }
  }
  
  return {
    userAId,
    userBId,
    debtAmount,
    lastTransactionDate: lastDate
  };
}
```

### 3. Combined Balance Calculation

```typescript
function calculateCombinedBalance(
  userAId: string,
  userBId: string,
  personalTransactions: PersonalTransaction[],
  companyTransactions: CompanyTransaction[]
): CombinedBalance {
  const personalBalance = calculateNetBalance(userAId, userBId, personalTransactions);
  const companyDebt = calculateCompanyDebt(userAId, userBId, companyTransactions);
  
  const lastDate = personalBalance.lastTransactionDate > companyDebt.lastTransactionDate
    ? personalBalance.lastTransactionDate
    : companyDebt.lastTransactionDate;
  
  return {
    userAId,
    userBId,
    personalBalance: personalBalance.netAmount,
    companyDebt: companyDebt.debtAmount,
    combinedBalance: personalBalance.netAmount + companyDebt.debtAmount,
    lastTransactionDate: lastDate
  };
}
```

### 4. Business Day Calculation

```typescript
function calculateBusinessDays(
  startDate: Date,
  endDate: Date,
  publicHolidays: Date[],
  closedDates: ClosedDate[]
): number {
  if (startDate > endDate) {
    throw new Error("Start date must be before or equal to end date");
  }
  
  let businessDays = 0;
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // Check if it's a weekday (Monday = 1, Friday = 5)
    const dayOfWeek = currentDate.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    
    if (isWeekday) {
      // Check if it's not a public holiday
      const isPublicHoliday = publicHolidays.some(holiday => 
        isSameDay(holiday, currentDate)
      );
      
      // Check if it's not a closed date
      const isClosedDate = closedDates.some(closed => 
        currentDate >= closed.startDate && currentDate <= closed.endDate
      );
      
      if (!isPublicHoliday && !isClosedDate) {
        businessDays++;
      }
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return businessDays;
}
```

### 5. Age Calculation with Feb 29 Handling

```typescript
function calculateAge(dateOfBirth: Date, currentDate: Date): number {
  let age = currentDate.getFullYear() - dateOfBirth.getFullYear();
  
  // Handle Feb 29 birthdays in non-leap years
  let celebrationMonth = dateOfBirth.getMonth();
  let celebrationDay = dateOfBirth.getDate();
  
  if (celebrationMonth === 1 && celebrationDay === 29 && !isLeapYear(currentDate.getFullYear())) {
    // Celebrate on Feb 28
    celebrationMonth = 1;
    celebrationDay = 28;
  }
  
  // Check if birthday has occurred this year
  const birthdayThisYear = new Date(currentDate.getFullYear(), celebrationMonth, celebrationDay);
  
  if (currentDate < birthdayThisYear) {
    age--;
  }
  
  return age;
}

function isBirthdayToday(dateOfBirth: Date, currentDate: Date): boolean {
  let celebrationMonth = dateOfBirth.getMonth();
  let celebrationDay = dateOfBirth.getDate();
  
  // Handle Feb 29 in non-leap years
  if (celebrationMonth === 1 && celebrationDay === 29 && !isLeapYear(currentDate.getFullYear())) {
    celebrationMonth = 1;
    celebrationDay = 28;
  }
  
  return currentDate.getMonth() === celebrationMonth && 
         currentDate.getDate() === celebrationDay;
}
```

### 6. Leave Overlap Detection

```typescript
function checkLeaveOverlap(
  userId: string,
  startDate: Date,
  endDate: Date,
  existingLeave: LeaveRecord[]
): LeaveRecord[] {
  return existingLeave.filter(leave => {
    // Only check same user's leave
    if (leave.userId !== userId) return false;
    
    // Check if date ranges overlap
    return startDate <= leave.endDate && endDate >= leave.startDate;
  });
}
```

### 7. Closed Date Overlap Detection

```typescript
function checkClosedDateOverlap(
  startDate: Date,
  endDate: Date,
  existingClosed: ClosedDate[]
): ClosedDate[] {
  return existingClosed.filter(closed => {
    return startDate <= closed.endDate && endDate >= closed.startDate;
  });
}
```

### 8. Closed Date Leave Conflict Detection

```typescript
function checkClosedDateLeaveConflict(
  closedStartDate: Date,
  closedEndDate: Date,
  existingLeave: LeaveRecord[]
): LeaveRecord[] {
  return existingLeave.filter(leave => {
    return closedStartDate <= leave.endDate && closedEndDate >= leave.startDate;
  });
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Net Balance Calculation Correctness

*For any* two users and any set of transactions between them, the calculated net balance must equal the sum of all transactions where transactions from user A to user B are positive and transactions from user B to user A are negative.

**Validates: Requirements 3.2, 4.15, 11.4**

### Property 2: Net Balance Reactivity

*For any* existing set of transactions, when a new transaction is added, edited, or deleted, the net balance between the affected users must be recalculated and all views displaying that balance must update.

**Validates: Requirements 4.15, 11.4, 11.5**

### Property 3: Transaction Amount Validation

*For any* transaction amount input, if the amount is less than or equal to zero, the system must reject the transaction and display a warning popup.

**Validates: Requirements 4.8, 4.9**

### Property 4: Transaction Persistence

*For any* valid transaction (positive amount, valid users, valid date), when confirmed, the transaction must be persisted and appear in the transaction history.

**Validates: Requirements 4.10, 11.1**

### Property 5: Transaction History Ordering

*For any* set of transactions, the transaction history must be ordered from most recent date to oldest date.

**Validates: Requirements 4.11**

### Property 6: Money Summary Card Ordering

*For any* set of net balances, the money summary cards must be ordered first by largest absolute net amount, then by most recent transaction date.

**Validates: Requirements 3.6**

### Property 7: Money Summary Card Formatting

*For any* non-zero net balance between two users, the summary card must contain the debtor's name, the creditor's name, and the net amount in the format "[Debtor] owes [Creditor] $[Amount]".

**Validates: Requirements 3.5**

### Property 8: Business Day Calculation Excludes Weekends

*For any* date range, the business day count must exclude all Saturdays and Sundays.

**Validates: Requirements 6.3**

### Property 9: Business Day Calculation Excludes Holidays

*For any* date range and any set of public holidays, the business day count must exclude all dates that match public holidays.

**Validates: Requirements 6.4, 8.3**

### Property 10: Business Day Calculation Excludes Closed Dates

*For any* date range and any set of closed date periods, the business day count must exclude all dates that fall within closed periods.

**Validates: Requirements 6.5, 9.3**

### Property 11: Business Day Calculation Completeness

*For any* date range, the business day count must equal the number of Monday-Friday dates that are not public holidays and not within closed date periods.

**Validates: Requirements 6.3, 6.4, 6.5, 6.12**

### Property 12: Business Day Recalculation on Holiday Changes

*For any* existing leave record, when a public holiday is added or removed that falls within the leave date range, the business day count for that leave must be recalculated.

**Validates: Requirements 6.20, 11.3**

### Property 13: Business Day Recalculation on Closed Date Changes

*For any* existing leave record, when a closed date period is added, edited, or removed that overlaps with the leave date range, the business day count for that leave must be recalculated.

**Validates: Requirements 6.20, 11.3**

### Property 14: Zero Business Days Rejection

*For any* date range where the business day count equals zero, the system must display an error message and prevent saving the leave record.

**Validates: Requirements 6.14**

### Property 15: Single Day Leave Labeling

*For any* leave record where start date equals end date and that date is a business day, the system must label it as "Day Off".

**Validates: Requirements 6.13**

### Property 16: Leave Overlap Detection

*For any* user and any new leave date range, if there exists a leave record for that user where the date ranges overlap, the system must detect the overlap and return the overlapping leave records.

**Validates: Requirements 6.16**

### Property 17: Leave Persistence

*For any* valid leave entry (valid user, valid date range, positive business days), when confirmed, the leave record must be persisted and appear in the leave history.

**Validates: Requirements 6.19, 11.1**

### Property 18: Leave Summary Filtering

*For any* set of leave records, the leave summary cards must only include records where the end date is greater than or equal to the current date.

**Validates: Requirements 5.3**

### Property 19: Leave Summary Card Formatting

*For any* leave record, the summary card must contain the person's name, start date, end date, and business day count in the format "[Person] is on leave from [Start] → [End] ([X] business days)".

**Validates: Requirements 5.2**

### Property 20: Closed Date Overlap Detection

*For any* new closed date period, if there exists a closed date period where the date ranges overlap, the system must detect the overlap and return the overlapping periods.

**Validates: Requirements 9.4**

### Property 21: Closed Date Leave Conflict Detection

*For any* new closed date period, if there exists a leave record where the date ranges overlap, the system must detect the conflict and return the conflicting leave records.

**Validates: Requirements 9.5**

### Property 22: Age Calculation Correctness

*For any* date of birth and current date, the calculated age must equal the number of years between the dates, accounting for whether the birthday has occurred this year.

**Validates: Requirements 7.2**

### Property 23: February 29 Birthday Handling

*For any* birthday with date of birth on February 29, when the current year is not a leap year, the birthday must be celebrated on February 28.

**Validates: Requirements 7.6**

### Property 24: Birthday Banner Display

*For any* set of birthdays, when the current date matches one or more birthdays (accounting for Feb 29 handling), the system must display a birthday banner containing all matching birthdays with their calculated ages.

**Validates: Requirements 7.3, 7.4, 7.5**

### Property 25: Birthday Banner Formatting

*For any* birthday occurring today, the banner must contain the person's name and their turning age in the format "Today is [Name]'s birthday – turning [Age]".

**Validates: Requirements 7.7**

### Property 26: Next Public Holiday Selection

*For any* set of public holidays and current date, the next public holiday widget must display the holiday with the earliest date that is greater than the current date.

**Validates: Requirements 8.5**

### Property 27: Public Holiday Widget Formatting

*For any* upcoming public holiday, the widget must contain the holiday name and date in the format "Next public holiday: [Name] – [Date]".

**Validates: Requirements 8.6**

### Property 28: Holiday and Closed Date Priority

*For any* date that is both a public holiday and within a closed date period, the system must give priority to the closed date but display both in the UI.

**Validates: Requirements 8.8, 9.9**

### Property 29: Username Uniqueness Validation

*For any* username change attempt, if the new username already exists for a different user, the system must reject the change.

**Validates: Requirements 2.4**

### Property 30: Session Persistence

*For any* authenticated user, the session must persist until the user explicitly logs out or manually clears the session.

**Validates: Requirements 1.4, 1.5**

### Property 31: Session Clearing on Logout

*For any* authenticated user, when logout is triggered, the user context must be cleared and the system must return to the login screen.

**Validates: Requirements 1.11, 2.6**

### Property 32: Password Strength Validation

*For any* password input, if the password does not meet strength requirements (minimum length, complexity), the system must reject it.

**Validates: Requirements 1.9**

### Property 33: Unlimited Login Attempts

*For any* number of failed login attempts for a user, the system must continue to allow login attempts without locking the account.

**Validates: Requirements 1.8**

### Property 34: User Identity Display

*For any* authenticated user, the rendered application interface must contain the user's identity at the top.

**Validates: Requirements 1.6**

### Property 35: Person Selection State Management

*For any* person selection on the Money page, when a person is selected on the left (green), that person must be disabled on the right, and vice versa.

**Validates: Requirements 4.2, 4.3**

### Property 36: Transaction Panel Display

*For any* Money page state, when both left and right people are selected, the transaction entry panel must be displayed.

**Validates: Requirements 4.6**

### Property 37: Leave Person Selection State

*For any* person selection on the Leave page, when a person is selected, the other person must be disabled and transparent.

**Validates: Requirements 6.7**

### Property 38: Date Picker Business Day Restriction

*For any* date picker on the Leave page, only dates that are business days (Monday-Friday, not holidays, not closed dates) must be selectable.

**Validates: Requirements 6.10, 9.2**

### Property 39: Public Holiday Date Picker Restriction

*For any* date picker on the Leave page, all public holiday dates must be disabled.

**Validates: Requirements 8.4**

### Property 40: Navigation State Preservation

*For any* navigation from a summary card to a detail page, the relevant entities (people, person) must be pre-selected on the destination page.

**Validates: Requirements 3.8, 5.5, 10.2, 10.3**

### Property 41: Data Persistence Completeness

*For any* create, update, or delete operation on users, transactions, leave records, public holidays, closed dates, or birthdays, the change must be persisted to the database.

**Validates: Requirements 11.1**

### Property 42: Timezone Consistency

*For any* date stored or displayed in the system, it must use the single consistent company timezone.

**Validates: Requirements 11.2**

### Property 43: Color Coding Consistency

*For any* UI element indicating "owes" or "selected left", the color must be green, and for any element indicating "owed" or "selected right", the color must be red.

**Validates: Requirements 12.1, 12.2**

### Property 44: Past Leave Warning

*For any* leave entry where the start date is before the current date, the system must display a warning popup before allowing confirmation.

**Validates: Requirements 6.17**

### Property 45: Past Closed Date Warning

*For any* closed date entry where the start date is before the current date, the system must display a warning popup before allowing confirmation.

**Validates: Requirements 9.6**

### Property 46: Multi-Month Leave Support

*For any* leave entry where the start and end dates span multiple months or years, the system must accept and correctly calculate business days.

**Validates: Requirements 6.15**

### Property 47: Transaction Separation in History

*For any* set of transactions between two users, all transactions must appear as separate entries in the history (no aggregation).

**Validates: Requirements 4.12**

### Property 48: Leave History Display Completeness

*For any* leave record, the leave history must display the person's name, start date, end date, and business day count.

**Validates: Requirements 6.23**

### Property 49: Birthday Storage Without Age

*For any* birthday record, only the name and date of birth must be stored, never the age.

**Validates: Requirements 7.1**

### Property 50: Public Holiday Equality

*For any* public holiday, it must apply equally to all users in leave calculations.

**Validates: Requirements 10.2**

### Property 51: Company Debt Calculation - Personal for Company

*For any* company transaction where personal money is used for a company expense, the calculated debt must equal half the transaction amount owed to the payer.

**Validates: Requirements 5.10**

### Property 52: Company Debt Calculation - Company for Personal

*For any* company transaction where company money is used for a personal expense, the calculated debt must equal half the transaction amount owed by the beneficiary.

**Validates: Requirements 5.11**

### Property 53: Company Debt Calculation - Company Income Personal

*For any* company transaction where company income is received by one person, the calculated debt must equal half the transaction amount owed to the other person.

**Validates: Requirements 5.12**

### Property 54: Company Debt Calculation - Company for Company

*For any* company transaction where company money is used for a company expense, no debt must be created.

**Validates: Requirements 5.13**

### Property 55: Company Debt Rounding

*For any* company transaction with an odd amount, the debt calculation must round to the nearest cent.

**Validates: Requirements 5.15**

### Property 56: Combined Balance Calculation

*For any* two users with both personal and company transactions, the combined balance must equal the sum of personal net balance and company debt.

**Validates: Requirements 6.1**

### Property 57: Combined Balance Reactivity

*For any* existing combined balance, when a new personal or company transaction is added, the combined balance must be recalculated and all views displaying that balance must update.

**Validates: Requirements 6.5, 13.4, 13.5**

### Property 58: Transaction Immutability

*For any* transaction (personal or company) that has been created, the system must not allow editing or deleting that transaction.

**Validates: Requirements 4.18, 5.20**

### Property 59: Currency Display Consistency

*For any* monetary amount displayed in the system, it must be shown in AUD currency.

**Validates: Requirements 4.16, 5.8, 14.8**

### Property 60: Transaction Type Filtering

*For any* transaction history view with a money type filter applied, only transactions of the selected type (personal or company) must be displayed.

**Validates: Requirements 4.15, 5.18, 6.4**

## Error Handling

### Input Validation Errors

**Invalid Transaction Amount**
- Trigger: User enters amount ≤ 0
- Response: Display warning popup, prevent save
- Recovery: User must enter valid positive amount

**Zero Business Days**
- Trigger: Selected date range has no business days
- Response: Display error message, prevent save
- Recovery: User must select different dates

**Invalid Password**
- Trigger: Password doesn't meet strength requirements
- Response: Display error message with requirements
- Recovery: User must enter stronger password

**Duplicate Username**
- Trigger: User attempts to change username to existing one
- Response: Display error message
- Recovery: User must choose different username

### Conflict Detection Errors

**Leave Overlap**
- Trigger: New leave overlaps with existing leave for same user
- Response: Display popup showing overlapping leave with merge/keep separate options
- Recovery: User chooses to merge or keep separate

**Closed Date Overlap**
- Trigger: New closed period overlaps with existing closed period
- Response: Display popup showing overlapping periods with merge/keep separate options
- Recovery: User chooses to merge or keep separate

**Closed Date Leave Conflict**
- Trigger: New closed period overlaps with existing leave
- Response: Display warning popup with confirmation required
- Recovery: User confirms or cancels

### Warning Conditions

**Past Leave Entry**
- Trigger: Leave start date is in the past
- Response: Display warning popup, require confirmation
- Recovery: User confirms or cancels

**Past Closed Date Entry**
- Trigger: Closed date start is in the past
- Response: Display warning popup, require confirmation
- Recovery: User confirms or cancels

### System Errors

**Database Connection Failure**
- Response: Display error message, retry connection
- Recovery: Automatic retry with exponential backoff

**Authentication Failure**
- Response: Display error message
- Recovery: User re-enters credentials

**Session Expiration**
- Response: Redirect to login
- Recovery: User re-authenticates

## Testing Strategy

### Dual Testing Approach

The system will be tested using both unit tests and property-based tests:

**Unit Tests**: Verify specific examples, edge cases, and error conditions
- Specific transaction scenarios (e.g., Danik owes Leva $100, then Danik pays $150)
- Edge cases (Feb 29 birthdays, single-day leave, zero balance)
- Error conditions (invalid amounts, duplicate usernames)
- Integration points between components
- UI component rendering

**Property-Based Tests**: Verify universal properties across all inputs
- Net balance calculations with random transaction sets
- Company debt calculations with random company transactions
- Combined balance calculations with mixed transaction types
- Business day calculations with random date ranges and holidays
- Age calculations with random dates of birth
- Overlap detection with random date ranges
- Sorting and filtering with random data sets

Both testing approaches are complementary and necessary for comprehensive coverage. Unit tests catch concrete bugs in specific scenarios, while property-based tests verify general correctness across the input space.

### Property-Based Testing Configuration

**Framework**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**:
- Minimum 100 iterations per property test
- Each property test must reference its design document property
- Tag format: `// Feature: company-tracker, Property {number}: {property_text}`

**Example Property Test Structure**:
```typescript
import fc from 'fast-check';

// Feature: company-tracker, Property 1: Net Balance Calculation Correctness
test('net balance equals sum of directional transactions', () => {
  fc.assert(
    fc.property(
      fc.array(transactionArbitrary),
      (transactions) => {
        const netBalance = calculateNetBalance('user1', 'user2', transactions);
        const expectedBalance = transactions.reduce((sum, t) => {
          if (t.fromUserId === 'user1') return sum + t.amount;
          if (t.fromUserId === 'user2') return sum - t.amount;
          return sum;
        }, 0);
        expect(netBalance.netAmount).toBe(expectedBalance);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Coverage Requirements

**Core Business Logic** (Property-Based Tests):
- Net balance calculation (Properties 1, 2)
- Company debt calculation (Properties 51-55)
- Combined balance calculation (Properties 56, 57)
- Business day calculation (Properties 8-13)
- Age calculation (Properties 22, 23)
- Overlap detection (Properties 16, 20, 21)
- Sorting and filtering (Properties 5, 6, 18, 60)

**Validation Logic** (Property-Based Tests):
- Transaction amount validation (Property 3)
- Transaction immutability (Property 58)
- Password strength validation (Property 32)
- Username uniqueness (Property 29)
- Date picker restrictions (Properties 38, 39)
- Currency display consistency (Property 59)

**Edge Cases** (Unit Tests):
- Feb 29 birthdays in non-leap years
- Single-day leave ("Day Off")
- Zero net balance display
- Empty transaction/leave lists
- Boundary dates (year transitions)
- Odd amount company transactions (rounding)
- Mixed personal and company transactions

**Integration Tests** (Unit Tests):
- Authentication flow
- Navigation with state preservation
- CRUD operations for all entities (except transaction edit/delete)
- Reactive updates across views
- Page switching between Personal and Company Money

### Testing Best Practices

1. **Smart Generators**: Write generators that constrain to valid input space
   - Transaction amounts: positive numbers
   - Dates: valid date ranges
   - User IDs: from predefined set (Leva, Danik)
   - Transaction types: valid company transaction types
   - Currency: AUD only

2. **Shrinking**: Leverage fast-check's shrinking to find minimal failing examples

3. **Deterministic Tests**: Use seeded random generation for reproducibility

4. **Test Isolation**: Each test should be independent and not rely on shared state

5. **Clear Assertions**: Property tests should have clear, understandable assertions

6. **Performance**: Property tests with 100+ iterations should complete in reasonable time (<5s per test)
