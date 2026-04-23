# Implementation Plan: Company Tracker

## Overview

This implementation plan breaks down the Company Tracker application into discrete coding tasks. The approach follows a layered architecture: database schema → backend API → frontend components → integration. Each task builds incrementally, with testing integrated throughout to validate correctness early.

## Tasks

- [x] 1. Project Setup and Database Schema
  - Initialize TypeScript project with React frontend and Node.js/Express backend
  - Set up PostgreSQL database with timezone support
  - Create database schema for all entities (users, personal transactions, company transactions, leave, holidays, closed dates, birthdays)
  - Configure development environment with hot reload
  - _Requirements: 13.1, 13.2_

- [x] 2. Core Business Logic - Net Balance Calculation (Personal Transactions)
  - [x] 2.1 Implement net balance calculation function for personal transactions
    - Write `calculateNetBalance(userAId, userBId, personalTransactions)` function
    - Handle bidirectional transactions correctly
    - _Requirements: 3.2, 4.17_

  - [x] 2.2 Write property test for net balance calculation

    - **Property 1: Net Balance Calculation Correctness**
    - **Validates: Requirements 3.2, 4.17, 13.4**

  - [x] 2.3 Write unit tests for net balance edge cases

    - Test zero balance scenario
    - Test single transaction
    - Test multiple transactions in both directions
    - _Requirements: 3.2_

- [ ] 2.5. Core Business Logic - Company Debt Calculation
  - [x] 2.5.1 Implement company debt calculation function
    - Write `calculateCompanyDebt(userAId, userBId, companyTransactions)` function
    - Handle all four transaction types: personal_for_company, company_for_personal, company_income_personal, company_for_company
    - Implement 50/50 ownership split logic
    - Round to nearest cent
    - _Requirements: 5.9, 5.10, 5.11, 5.12, 5.13, 5.14, 5.15_

  - [x] 2.5.2 Write property test for personal-for-company debt calculation
    - **Property 51: Company Debt Calculation - Personal for Company**
    - **Validates: Requirements 5.10**

  - [x] 2.5.3 Write property test for company-for-personal debt calculation
    - **Property 52: Company Debt Calculation - Company for Personal**
    - **Validates: Requirements 5.11**

  - [x] 2.5.4 Write property test for company-income-personal debt calculation
    - **Property 53: Company Debt Calculation - Company Income Personal**
    - **Validates: Requirements 5.12**

  - [x] 2.5.5 Write property test for company-for-company (no debt)
    - **Property 54: Company Debt Calculation - Company for Company**
    - **Validates: Requirements 5.13**

  - [x] 2.5.6 Write property test for debt rounding
    - **Property 55: Company Debt Rounding**
    - **Validates: Requirements 5.15**

  - [x] 2.5.7 Write unit tests for company debt edge cases
    - Test zero debt scenario
    - Test single company transaction of each type
    - Test multiple mixed company transactions
    - Test odd amounts requiring rounding
    - _Requirements: 5.14, 5.15_

- [ ] 2.6. Core Business Logic - Combined Balance Calculation
  - [x] 2.6.1 Implement combined balance calculation function
    - Write `calculateCombinedBalance(userAId, userBId, personalTransactions, companyTransactions)` function
    - Sum personal net balance and company debt
    - _Requirements: 6.1_

  - [x] 2.6.2 Write property test for combined balance calculation
    - **Property 56: Combined Balance Calculation**
    - **Validates: Requirements 6.1**

  - [-] 2.6.3 Write unit tests for combined balance edge cases
    - Test with only personal transactions
    - Test with only company transactions
    - Test with both types of transactions
    - Test with zero combined balance
    - _Requirements: 6.1_

- [x] 3. Core Business Logic - Business Day Calculation
  - [x] 3.1 Implement business day calculation function
    - Write `calculateBusinessDays(startDate, endDate, holidays, closedDates)` function
    - Exclude weekends (Saturday, Sunday)
    - Exclude public holidays
    - Exclude closed date periods
    - _Requirements: 8.3, 8.4, 8.5, 8.12_

  - [x] 3.2 Write property test for weekend exclusion

    - **Property 8: Business Day Calculation Excludes Weekends**
    - **Validates: Requirements 8.3**

  - [ ]* 3.3 Write property test for holiday exclusion
    - **Property 9: Business Day Calculation Excludes Holidays**
    - **Validates: Requirements 8.4, 10.3**

  - [ ]* 3.4 Write property test for closed date exclusion
    - **Property 10: Business Day Calculation Excludes Closed Dates**
    - **Validates: Requirements 8.5, 11.3**

  - [ ]* 3.5 Write property test for complete business day calculation
    - **Property 11: Business Day Calculation Completeness**
    - **Validates: Requirements 8.3, 8.4, 8.5, 8.12**

  - [ ]* 3.6 Write unit tests for business day edge cases
    - Test single day (start = end)
    - Test zero business days scenario
    - Test multi-month span
    - _Requirements: 8.13, 8.14, 8.15_

- [x] 4. Core Business Logic - Age and Birthday Calculation
  - [x] 4.1 Implement age calculation function
    - Write `calculateAge(dateOfBirth, currentDate)` function
    - Handle February 29 birthdays in non-leap years
    - _Requirements: 9.2, 9.6_

  - [x] 4.2 Implement birthday detection function
    - Write `isBirthdayToday(dateOfBirth, currentDate)` function
    - Handle February 29 edge case
    - _Requirements: 9.3, 9.6_

  - [ ]* 4.3 Write property test for age calculation
    - **Property 22: Age Calculation Correctness**
    - **Validates: Requirements 9.2**

  - [ ]* 4.4 Write unit test for February 29 birthday handling
    - **Property 23: February 29 Birthday Handling**
    - **Validates: Requirements 9.6**

- [x] 5. Core Business Logic - Overlap and Conflict Detection
  - [x] 5.1 Implement leave overlap detection
    - Write `checkLeaveOverlap(userId, startDate, endDate, existingLeave)` function
    - Return overlapping leave records
    - _Requirements: 8.16_

  - [x] 5.2 Implement closed date overlap detection
    - Write `checkClosedDateOverlap(startDate, endDate, existingClosed)` function
    - Return overlapping closed periods
    - _Requirements: 11.4_

  - [x] 5.3 Implement closed date leave conflict detection
    - Write `checkClosedDateLeaveConflict(closedStart, closedEnd, existingLeave)` function
    - Return conflicting leave records
    - _Requirements: 11.5_

  - [ ]* 5.4 Write property test for leave overlap detection
    - **Property 16: Leave Overlap Detection**
    - **Validates: Requirements 8.16**

  - [ ]* 5.5 Write property test for closed date overlap detection
    - **Property 20: Closed Date Overlap Detection**
    - **Validates: Requirements 11.4**

  - [ ]* 5.6 Write property test for closed date leave conflict detection
    - **Property 21: Closed Date Leave Conflict Detection**
    - **Validates: Requirements 11.5**

- [x] 6. Checkpoint - Core Business Logic Complete
  - Ensure all core calculation tests pass
  - Verify business day, net balance, age, and overlap functions work correctly
  - Ask the user if questions arise

- [x] 7. Backend - Authentication and User Management
  - [x] 7.1 Implement authentication middleware with Passport.js
    - Set up session management
    - Implement login endpoint
    - Implement logout endpoint
    - Support "remember me" functionality
    - _Requirements: 1.1, 1.4, 1.5, 1.7, 1.11_

  - [x] 7.2 Implement password validation
    - Enforce strong password requirements
    - Hash passwords with bcrypt
    - _Requirements: 1.9_

  - [x] 7.3 Implement 2FA support with speakeasy
    - Optional 2FA via auth app
    - _Requirements: 1.10_

  - [x] 7.4 Implement user management endpoints
    - GET /api/users - List all users
    - PUT /api/users/:id - Update username/password
    - Validate username uniqueness
    - _Requirements: 2.3, 2.4_

  - [ ]* 7.5 Write property test for username uniqueness
    - **Property 29: Username Uniqueness Validation**
    - **Validates: Requirements 2.4**

  - [ ]* 7.6 Write property test for password strength validation
    - **Property 32: Password Strength Validation**
    - **Validates: Requirements 1.9**

  - [ ]* 7.7 Write property test for unlimited login attempts
    - **Property 33: Unlimited Login Attempts**
    - **Validates: Requirements 1.8**

- [ ] 8. Backend - Personal Transaction Endpoints
  - [ ] 8.1 Implement personal transaction CRUD endpoints
    - POST /api/transactions/personal - Create personal transaction
    - GET /api/transactions/personal - List all personal transactions
    - Validate amount > 0
    - Store in AUD currency
    - Transactions are immutable (no update/delete)
    - _Requirements: 4.10, 4.11, 4.16, 4.18_

  - [ ] 8.2 Implement personal net balance calculation endpoint
    - GET /api/transactions/personal/net-balances - Calculate all personal net balances
    - Use calculateNetBalance function
    - _Requirements: 3.2, 4.17_

  - [ ]* 8.3 Write property test for transaction amount validation
    - **Property 3: Transaction Amount Validation**
    - **Validates: Requirements 4.10, 4.11**

  - [ ]* 8.4 Write property test for transaction persistence
    - **Property 4: Transaction Persistence**
    - **Validates: Requirements 4.12, 13.1**

  - [ ]* 8.5 Write property test for transaction immutability
    - **Property 58: Transaction Immutability**
    - **Validates: Requirements 4.18**

- [ ] 8.5. Backend - Company Transaction Endpoints
  - [ ] 8.5.1 Implement company transaction CRUD endpoints
    - POST /api/transactions/company - Create company transaction
    - GET /api/transactions/company - List all company transactions
    - Validate amount > 0
    - Store in AUD currency
    - Determine transaction type based on context
    - Transactions are immutable (no update/delete)
    - _Requirements: 5.7, 5.8, 5.20_

  - [ ] 8.5.2 Implement company debt calculation endpoint
    - GET /api/transactions/company/debt - Calculate company debt for all user pairs
    - Use calculateCompanyDebt function
    - _Requirements: 5.9, 5.14_

  - [ ] 8.5.3 Implement combined balance calculation endpoint
    - GET /api/transactions/combined-balances - Calculate combined balances (personal + company)
    - Use calculateCombinedBalance function
    - _Requirements: 6.1, 6.2_

  - [ ] 8.5.4 Implement transaction listing endpoint
    - GET /api/transactions/all - List all transactions (personal and company)
    - Support filtering by date range, person, and money type
    - Order by date descending
    - _Requirements: 4.13, 4.14, 4.15, 5.16, 5.17, 5.18_

  - [ ]* 8.5.5 Write property test for combined balance reactivity
    - **Property 57: Combined Balance Reactivity**
    - **Validates: Requirements 6.5, 13.4, 13.5**

  - [ ]* 8.5.6 Write property test for currency display consistency
    - **Property 59: Currency Display Consistency**
    - **Validates: Requirements 4.16, 5.8, 14.8**

  - [ ]* 8.5.7 Write property test for transaction type filtering
    - **Property 60: Transaction Type Filtering**
    - **Validates: Requirements 4.15, 5.18, 6.4**

- [x] 9. Backend - Leave Endpoints
  - [x] 9.1 Implement leave CRUD endpoints
    - POST /api/leave - Create leave record
    - GET /api/leave - List all leave records
    - PUT /api/leave/:id - Update leave record
    - DELETE /api/leave/:id - Delete leave record
    - Calculate business days on create/update
    - _Requirements: 8.19_

  - [x] 9.2 Implement leave calculation helper endpoints
    - POST /api/leave/calculate-business-days - Calculate business days for date range
    - POST /api/leave/check-overlap - Check for overlapping leave
    - _Requirements: 8.12, 8.16_

  - [ ]* 9.3 Write property test for leave persistence
    - **Property 17: Leave Persistence**
    - **Validates: Requirements 8.19, 13.1**

  - [ ]* 9.4 Write property test for business day recalculation on holiday changes
    - **Property 12: Business Day Recalculation on Holiday Changes**
    - **Validates: Requirements 8.20, 13.3**

  - [ ]* 9.5 Write property test for business day recalculation on closed date changes
    - **Property 13: Business Day Recalculation on Closed Date Changes**
    - **Validates: Requirements 8.20, 13.3**

- [x] 10. Backend - Holiday, Closed Date, and Birthday Endpoints
  - [x] 10.1 Implement public holiday endpoints
    - POST /api/holidays - Create holiday
    - GET /api/holidays - List all holidays
    - PUT /api/holidays/:id - Update holiday
    - DELETE /api/holidays/:id - Delete holiday
    - GET /api/holidays/next - Get next upcoming holiday
    - _Requirements: 10.1, 10.7_

  - [x] 10.2 Implement closed date endpoints
    - POST /api/closed-dates - Create closed period
    - GET /api/closed-dates - List all closed periods
    - PUT /api/closed-dates/:id - Update closed period
    - DELETE /api/closed-dates/:id - Delete closed period
    - POST /api/closed-dates/check-overlap - Check for overlaps
    - POST /api/closed-dates/check-leave-conflict - Check for leave conflicts
    - _Requirements: 11.1, 11.7_

  - [x] 10.3 Implement birthday endpoints
    - POST /api/birthdays - Create birthday
    - GET /api/birthdays - List all birthdays
    - PUT /api/birthdays/:id - Update birthday
    - DELETE /api/birthdays/:id - Delete birthday
    - GET /api/birthdays/today - Get today's birthdays with calculated ages
    - _Requirements: 9.9, 9.10_

  - [ ]* 10.4 Write property test for next public holiday selection
    - **Property 26: Next Public Holiday Selection**
    - **Validates: Requirements 10.5**

  - [ ]* 10.5 Write property test for birthday storage without age
    - **Property 49: Birthday Storage Without Age**
    - **Validates: Requirements 9.1**

- [x] 11. Checkpoint - Backend API Complete
  - Ensure all backend endpoints work correctly
  - Verify all property tests pass
  - Test API with Postman or similar tool
  - Ask the user if questions arise

- [x] 12. Frontend - Authentication Components
  - [x] 12.1 Create LoginPage component
    - Implement login form with username/password
    - Add "remember me" checkbox
    - Handle 2FA flow if enabled
    - Display error messages
    - _Requirements: 1.1, 1.7, 1.10_

  - [x] 12.2 Create AuthContext for user session management
    - Provide logged-in user context throughout app
    - Persist session state
    - Handle logout
    - _Requirements: 1.4, 1.5, 1.11_

  - [ ]* 12.3 Write property test for session persistence
    - **Property 30: Session Persistence**
    - **Validates: Requirements 1.4, 1.5**

  - [ ]* 12.4 Write property test for session clearing on logout
    - **Property 31: Session Clearing on Logout**
    - **Validates: Requirements 1.11, 2.6**

  - [ ]* 12.5 Write property test for user identity display
    - **Property 34: User Identity Display**
    - **Validates: Requirements 1.6**

- [x] 13. Frontend - Home Page Components
  - [x] 13.1 Create HomePage container component
    - Display user identity at top
    - Include settings menu icon in top-right corner
    - Render all home page sections
    - _Requirements: 1.6, 2.1_

  - [ ] 13.2 Create MoneySummaryCards component (updated for combined balances)
    - Fetch combined balances (personal + company) from API
    - Display cards with horizontal swipe navigation
    - Format cards as "[Debtor] owes [Creditor] $[Amount]"
    - Sort by largest amount then recent activity
    - Display in AUD currency
    - Handle click to navigate to Money page with pre-selection
    - _Requirements: 3.1, 3.2, 3.5, 3.6, 3.7, 3.8, 6.2, 14.8_

  - [ ]* 13.3 Write property test for money summary card ordering
    - **Property 6: Money Summary Card Ordering**
    - **Validates: Requirements 3.6**

  - [ ]* 13.4 Write property test for money summary card formatting
    - **Property 7: Money Summary Card Formatting**
    - **Validates: Requirements 3.5**

  - [x] 13.5 Create LeaveSummaryCards component
    - Fetch leave records from API
    - Filter to current/upcoming leave only
    - Display cards with horizontal swipe navigation
    - Format cards as "[Person] is on leave from [Start] → [End] ([X] business days)"
    - Handle click to navigate to Leave page with pre-selection
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 13.6 Write property test for leave summary filtering
    - **Property 18: Leave Summary Filtering**
    - **Validates: Requirements 7.3**

  - [ ]* 13.7 Write property test for leave summary card formatting
    - **Property 19: Leave Summary Card Formatting**
    - **Validates: Requirements 7.2**

  - [x] 13.8 Create BirthdayBanner component
    - Fetch today's birthdays from API
    - Display banner only when birthdays match today
    - Format as "🎉 Today is [Name]'s birthday – turning [Age]"
    - Handle multiple birthdays on same day
    - Navigate to Settings > Birthdays on click
    - _Requirements: 9.3, 9.4, 9.5, 9.7, 9.8_

  - [ ]* 13.9 Write property test for birthday banner display
    - **Property 24: Birthday Banner Display**
    - **Validates: Requirements 9.3, 9.4, 9.5**

  - [ ]* 13.10 Write property test for birthday banner formatting
    - **Property 25: Birthday Banner Formatting**
    - **Validates: Requirements 9.7**

  - [x] 13.11 Create PublicHolidayWidget component
    - Fetch next upcoming holiday from API
    - Format as "Next public holiday: [Name] – [Date]"
    - _Requirements: 10.5, 10.6_

  - [ ]* 13.12 Write property test for public holiday widget formatting
    - **Property 27: Public Holiday Widget Formatting**
    - **Validates: Requirements 10.6**

- [x] 14. Checkpoint - Home Page Complete
  - Ensure all home page components render correctly
  - Verify navigation from cards works
  - Test with different user contexts
  - Ask the user if questions arise

- [ ] 15. Frontend - Money Page Components (Personal and Company)
  - [ ] 15.1 Create PersonalMoneyPage container component
    - Manage person selection state (left and right)
    - Display page switcher arrow to Company Money page
    - Coordinate PersonSelector and TransactionEntryPanel
    - _Requirements: 4.1, 4.2_

  - [ ] 15.2 Create CompanyMoneyPage container component
    - Display current debt for logged-in user at top
    - Provide swipe/slide widget to view reverse debt
    - Display page switcher arrow to Personal Money page
    - Coordinate CompanyTransactionEntryPanel
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

  - [ ] 15.3 Create PersonSelector component for Money pages
    - Display left and right person columns
    - Highlight selected left person in green
    - Highlight selected right person in red
    - Disable selected person on opposite side
    - Make disabled people transparent
    - _Requirements: 4.3, 4.4, 4.5, 4.6_

  - [ ]* 15.4 Write property test for person selection state management
    - **Property 35: Person Selection State Management**
    - **Validates: Requirements 4.4, 4.5**

  - [ ] 15.5 Create PersonalTransactionEntryPanel component
    - Display panel when both people selected
    - Provide inputs: who paid/received, amount, date, optional description
    - Validate amount > 0, show warning popup for invalid
    - Display in AUD currency
    - Submit personal transaction to API
    - _Requirements: 4.8, 4.9, 4.10, 4.11, 4.12, 4.16_

  - [ ] 15.6 Create CompanyTransactionEntryPanel component
    - Display panel on Company Money page
    - Provide inputs: who paid/received, amount, date, optional description
    - Validate amount > 0, show warning popup for invalid
    - Display in AUD currency
    - Submit company transaction to API
    - _Requirements: 5.6, 5.7, 5.8_

  - [ ]* 15.7 Write property test for transaction panel display
    - **Property 36: Transaction Panel Display**
    - **Validates: Requirements 4.8**

  - [ ] 15.8 Create TransactionHistory component
    - Fetch and display all transactions (personal and company)
    - Sort latest to oldest
    - Show all transactions separately (no aggregation)
    - Provide filters for date range, person, and money type
    - Display in AUD currency
    - No edit/delete functionality (immutable)
    - _Requirements: 4.13, 4.14, 4.15, 4.16, 4.18, 5.16, 5.17, 5.18_

  - [ ]* 15.9 Write property test for transaction history ordering
    - **Property 5: Transaction History Ordering**
    - **Validates: Requirements 4.13**

  - [ ]* 15.10 Write property test for transaction separation
    - **Property 47: Transaction Separation in History**
    - **Validates: Requirements 4.14**

- [-] 16. Frontend - Leave Page Components
  - [ ] 16.1 Create LeavePage container component
    - Manage person selection state
    - Coordinate PersonSelector, LeaveEntryForm, LeaveCalendar, LeaveHistory
    - _Requirements: 6.6_

  - [x] 16.2 Create PersonSelector component for Leave page
    - Display person buttons
    - Make selected person active
    - Make non-selected person disabled and transparent
    - _Requirements: 6.6, 6.7_

  - [ ]* 16.3 Write property test for leave person selection state
    - **Property 37: Leave Person Selection State**
    - **Validates: Requirements 6.7**

  - [x] 16.4 Create LeaveEntryForm component
    - Provide start and end date pickers
    - Disable weekends, holidays, closed dates in picker
    - Calculate and display business days automatically
    - Label single-day leave as "Day Off"
    - Show error for zero business days
    - Detect overlap, show popup with merge/keep separate options
    - Show warning for past dates
    - Submit leave to API
    - _Requirements: 6.9, 6.10, 6.11, 6.12, 6.13, 6.14, 6.16, 6.17, 6.19_

  - [ ]* 16.5 Write property test for date picker business day restriction
    - **Property 38: Date Picker Business Day Restriction**
    - **Validates: Requirements 6.10, 9.2**

  - [ ]* 16.6 Write property test for public holiday date picker restriction
    - **Property 39: Public Holiday Date Picker Restriction**
    - **Validates: Requirements 8.4**

  - [ ]* 16.7 Write unit test for single day leave labeling
    - **Property 15: Single Day Leave Labeling**
    - **Validates: Requirements 6.13**

  - [ ]* 16.8 Write property test for zero business days rejection
    - **Property 14: Zero Business Days Rejection**
    - **Validates: Requirements 6.14**

  - [ ]* 16.9 Write property test for past leave warning
    - **Property 44: Past Leave Warning**
    - **Validates: Requirements 6.17**

  - [ ]* 16.10 Write property test for multi-month leave support
    - **Property 46: Multi-Month Leave Support**
    - **Validates: Requirements 6.15**

  - [x] 16.11 Create LeaveCalendar component
    - Display monthly calendar view
    - Show leave ranges with customizable colors per person
    - Display disabled days (weekends, holidays, closed dates)
    - Scroll to selected person's leave
    - _Requirements: 6.21, 6.22_

  - [x] 16.12 Create LeaveHistory component
    - Fetch and display all leave records
    - Show person, date range, business day count
    - Handle click to open LeaveModal
    - _Requirements: 6.23, 6.24_

  - [ ]* 16.13 Write property test for leave history display completeness
    - **Property 48: Leave History Display Completeness**
    - **Validates: Requirements 6.23**

  - [x] 16.14 Create LeaveModal component
    - Combined popup with edit, delete, cancel options
    - Require confirmation for changes
    - _Requirements: 6.24_

- [x] 17. Checkpoint - Money and Leave Pages Complete
  - Ensure all Money and Leave page components work correctly
  - Verify person selection, form validation, and modals
  - Test navigation from home page
  - Ask the user if questions arise

- [x] 18. Frontend - Settings Components
  - [x] 18.1 Create SettingsMenu component
    - Accessible from top-right corner
    - Tabbed interface for Account, Closed Dates, Public Holidays, Birthdays
    - _Requirements: 2.1_

  - [x] 18.2 Create AccountSettings component
    - Change password form
    - Edit username form with uniqueness validation
    - Logout button
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 18.3 Create ClosedDatesManager component
    - Add closed period form (start, end, optional note)
    - List of closed periods with edit/delete
    - Detect overlap, show popup with merge/keep separate
    - Detect leave conflict, show warning popup
    - Show warning for past dates
    - _Requirements: 9.1, 9.2, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [ ]* 18.4 Write property test for past closed date warning
    - **Property 45: Past Closed Date Warning**
    - **Validates: Requirements 9.6**

  - [x] 18.5 Create PublicHolidaysManager component
    - Add/edit/delete public holidays
    - List view of all holidays
    - _Requirements: 8.7_

  - [ ]* 18.6 Write property test for public holiday equality
    - **Property 50: Public Holiday Equality**
    - **Validates: Requirements 8.2**

  - [x] 18.7 Create BirthdaysManager component
    - Add birthday form (name, date of birth only)
    - List of all birthdays with calculated ages
    - Edit/delete with confirmation
    - _Requirements: 7.9, 7.10, 7.11_

  - [x] 18.8 Create customizable calendar color settings
    - Allow users to choose colors per person
    - _Requirements: 12.7_

- [x] 19. Frontend - Navigation and State Management
  - [ ] 19.1 Implement React Router navigation
    - Set up routes for Home, Personal Money, Company Money, Leave, Settings
    - Handle navigation with state preservation
    - Implement page switcher arrows between Personal and Company Money pages
    - _Requirements: 12.1, 12.2, 12.6, 14.9_

  - [ ]* 19.2 Write property test for navigation state preservation
    - **Property 40: Navigation State Preservation**
    - **Validates: Requirements 3.8, 7.5, 12.3, 12.4**

  - [ ] 19.3 Implement Redux store for global state
    - User context
    - Personal transactions
    - Company transactions
    - Leave records
    - Holidays, closed dates, birthdays
    - _Requirements: 13.5_

  - [ ]* 19.4 Write property test for net balance reactivity
    - **Property 2: Net Balance Reactivity**
    - **Validates: Requirements 4.17, 13.4, 13.5**

- [x] 20. Frontend - UI Styling and Animations
  - [x] 20.1 Implement color coding system
    - Green for "owes" / "selected left"
    - Red for "owed" / "selected right"
    - _Requirements: 14.1, 14.2_

  - [ ]* 20.2 Write property test for color coding consistency
    - **Property 43: Color Coding Consistency**
    - **Validates: Requirements 14.1, 14.2**

  - [x] 20.3 Implement smooth animations
    - Panel slide animations
    - Modal fade animations
    - Card swipe animations
    - _Requirements: 14.4, 14.6_

  - [x] 20.4 Style disabled elements
    - Make disabled people transparent
    - Grey out disabled dates in calendars
    - _Requirements: 4.6, 8.11, 14.3, 14.5_

  - [ ] 20.5 Implement page switcher arrows
    - Add arrow in top corner of Personal Money page to Company Money page
    - Add arrow in top corner of Company Money page to Personal Money page
    - _Requirements: 4.2, 5.2, 14.9_

  - [ ] 20.6 Implement AUD currency display
    - Ensure all monetary amounts display in AUD
    - _Requirements: 4.16, 5.8, 14.8_

- [ ] 21. Integration and Data Consistency
  - [ ] 21.1 Implement reactive data updates
    - When personal or company transactions change, update net balances and combined balances everywhere
    - When holidays/closed dates change, recalculate leave business days
    - Update all views instantly
    - _Requirements: 13.3, 13.4, 13.5_

  - [x] 21.2 Implement timezone consistency
    - Ensure all dates use company timezone
    - Configure PostgreSQL timezone
    - Configure frontend date handling
    - _Requirements: 13.2_

  - [ ]* 21.3 Write property test for data persistence completeness
    - **Property 41: Data Persistence Completeness**
    - **Validates: Requirements 13.1**

  - [ ]* 21.4 Write property test for timezone consistency
    - **Property 42: Timezone Consistency**
    - **Validates: Requirements 13.2**

  - [x] 21.5 Implement holiday and closed date priority handling
    - When date is both holiday and closed, prioritize closed but show both
    - _Requirements: 10.8, 11.9_

  - [ ]* 21.6 Write property test for holiday and closed date priority
    - **Property 28: Holiday and Closed Date Priority**
    - **Validates: Requirements 10.8, 11.9**

- [ ] 22. Final Checkpoint - Integration Complete
  - Run all tests (unit and property-based)
  - Verify all 60 correctness properties pass
  - Test end-to-end user flows for both personal and company money
  - Verify data consistency across all views
  - Test page switching between Personal and Company Money
  - Verify combined balance calculations
  - Ensure all requirements are met
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript for both frontend (React) and backend (Node.js/Express)
- Property-based testing uses fast-check library with minimum 100 iterations per test
- The system now supports two users (Leva and Danik) instead of three
- Transactions are immutable - no editing or deleting after creation
- All monetary amounts are displayed in AUD currency
- Company money logic implements automatic debt calculation based on 50/50 ownership
