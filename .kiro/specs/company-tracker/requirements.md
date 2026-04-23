# Requirements Document

## Introduction

This document specifies requirements for an internal company web application that tracks money owed between employees (both personal and company-related), manages employee leave using business days, and provides company-wide context including public holidays, company closure dates, and birthdays. The application is designed for internal use by a two-person company owned 50/50 by Leva and Danik.

## Glossary

- **System**: The internal company web application
- **User**: An authenticated employee (Leva or Danik)
- **Business_Day**: A Monday-Friday weekday that is not a public holiday or company closure date
- **Personal_Transaction**: A record of a value transfer between two users for personal purposes
- **Company_Transaction**: A record of a company expense or income that affects debt based on 50/50 ownership
- **Net_Balance**: The calculated sum of all transactions between two users, determining who owes whom
- **Company_Debt**: Debt created when one owner pays/receives more than their 50% ownership share
- **Leave_Record**: A record of employee absence spanning business days
- **Public_Holiday**: A nationally recognized holiday that is not a business day
- **Closed_Date**: A date when the company is closed and not a business day
- **Birthday_Record**: A stored date of birth for calculating age dynamically
- **Day_Off**: A single business day leave entry where start date equals end date
- **Settlement_Transaction**: A transaction that reduces debt without being an expense or income

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to log in to the system, so that I can access company tracking features securely.

#### Acceptance Criteria

1. THE System SHALL require authentication before allowing access to any features
2. THE System SHALL support exactly two users: Leva and Danik
3. THE System SHALL pre-configure both users at system initialization
4. WHEN a user successfully authenticates, THE System SHALL maintain the logged-in user context throughout the session
5. THE System SHALL persist sessions until logout or manual clearing
6. THE System SHALL display the logged-in user's identity at the top of the application
7. THE System SHALL support "Remember me" functionality on trusted devices
8. THE System SHALL allow unlimited failed login attempts
9. THE System SHALL enforce strong password requirements
10. WHERE two-factor authentication is enabled, THE System SHALL support authentication via auth app
11. WHEN a user logs out, THE System SHALL clear the user context and return to the login screen

### Requirement 2: Account Management

**User Story:** As a user, I want to manage my account settings, so that I can update my credentials and control my session.

#### Acceptance Criteria

1. THE System SHALL provide a settings menu accessible from the top-right corner of the application
2. WHEN a user accesses settings, THE System SHALL display options for change password, edit username, and log out
3. THE System SHALL allow any authenticated user to edit their username
4. THE System SHALL block duplicate usernames
5. WHEN a user changes their password, THE System SHALL require confirmation before saving
6. WHEN a user logs out, THE System SHALL terminate the session and return to login

### Requirement 3: Money Tracking Summary

**User Story:** As a user, I want to see a summary of combined net money balances (personal and company), so that I can quickly understand who owes whom overall.

#### Acceptance Criteria

1. THE System SHALL display combined money summary cards on the home page showing total debt across both personal and company transactions
2. THE System SHALL calculate net balances dynamically based on all personal and company transactions between two users
3. WHEN the combined net balance between two users is zero, THE System SHALL either display "Settled" on the card or hide the card entirely
4. THE System SHALL adapt money summary content based on the logged-in user context
5. WHEN displaying net balances, THE System SHALL show cards in the format "[Person A] owes [Person B] $[Net Amount]"
6. THE System SHALL order summary cards by largest net amount owed first, then by most recent activity
7. THE System SHALL make money summary cards horizontally swipeable
8. WHEN a user clicks a money summary card, THE System SHALL navigate to the Money page with both people pre-selected

### Requirement 4: Personal Money Transaction Management

**User Story:** As a user, I want to record and manage personal money transactions, so that I can track value transfers between people for personal purposes.

#### Acceptance Criteria

1. THE System SHALL provide a Personal Money page accessible via navigation
2. THE System SHALL display a page switcher arrow in the top corner to navigate to Company Money page
3. THE System SHALL provide selectable people in left and right columns
4. WHEN a user selects a person on the left, THE System SHALL highlight that person in green and disable them on the right
5. WHEN a user selects a person on the right, THE System SHALL highlight that person in red
6. THE System SHALL make non-selectable or disabled users transparent
7. THE System SHALL provide smooth hover and focus animations to make selection obvious
8. WHEN both people are selected, THE System SHALL display a transaction entry panel
9. THE System SHALL accept transaction inputs: who paid/received, amount, date, and optional description
10. THE System SHALL require transaction amounts to be positive numbers greater than zero
11. IF a user attempts to enter zero or negative amount, THEN THE System SHALL display a warning popup and prevent saving
12. WHEN a transaction is confirmed, THE System SHALL save the record representing a value transfer from left person to right person
13. THE System SHALL display combined transaction history (personal and company) ordered from latest to oldest
14. THE System SHALL show all transactions separately in the history
15. THE System SHALL allow filtering by date range, person, and money type (personal or company)
16. THE System SHALL display transactions in AUD currency
17. WHEN transactions change, THE System SHALL recalculate net balances dynamically and update all summaries
18. THE System SHALL NOT allow editing or deleting transactions after creation

### Requirement 5: Company Money Transaction Management and Debt Tracking

**User Story:** As a company owner, I want to track company expenses and income with automatic debt calculation based on 50/50 ownership, so that I always know who owes whom when the "wrong" money is used.

#### Acceptance Criteria

1. THE System SHALL provide a Company Money page accessible via navigation
2. THE System SHALL display a page switcher arrow in the top corner to navigate to Personal Money page
3. THE System SHALL hard-code 50/50 ownership split between Leva and Danik
4. THE System SHALL display current debt at the top showing how much the logged-in user owes the other person
5. THE System SHALL provide a swipe/slide widget to view how much the other person owes the logged-in user
6. THE System SHALL provide a transaction entry form with fields: who paid/received, amount, date, and optional description
7. THE System SHALL require transaction amounts to be positive numbers greater than zero
8. THE System SHALL display transactions in AUD currency
9. WHEN a user records a company transaction, THE System SHALL automatically calculate debt based on the 50/50 ownership rule
10. WHEN personal money is used for company expense, THE System SHALL create debt equal to half the amount owed to the payer
11. WHEN company money is used for personal expense, THE System SHALL create debt equal to half the amount owed by the beneficiary
12. WHEN company income is received by one person, THE System SHALL create debt equal to half the amount owed to the other person
13. WHEN company money is used for company expense, THE System SHALL NOT create any debt
14. THE System SHALL calculate net company debt as a single combined number per user pair
15. THE System SHALL round debt calculations to the nearest cent
16. THE System SHALL display combined transaction history (personal and company) ordered from latest to oldest
17. THE System SHALL show all transactions separately in the history
18. THE System SHALL allow filtering by date range, person, and money type (personal or company)
19. WHEN company transactions change, THE System SHALL recalculate company debt dynamically and update all summaries
20. THE System SHALL NOT allow editing or deleting transactions after creation
21. THE System SHALL NOT provide warnings or confirmations when "wrong" money is used
22. THE System SHALL NOT track payment sources (cash vs card) or company bank account balances

### Requirement 6: Combined Debt Display

**User Story:** As a user, I want to see combined debt from both personal and company transactions, so that I have a complete picture of who owes whom.

#### Acceptance Criteria

1. THE System SHALL calculate combined net debt by summing personal transaction debt and company transaction debt
2. THE System SHALL display combined debt on home page summary cards
3. THE System SHALL display combined transaction history on both Personal Money and Company Money pages
4. WHEN filtering by money type, THE System SHALL show only transactions of the selected type
5. THE System SHALL update combined debt dynamically when any transaction (personal or company) changes

### Requirement 7: Leave Tracking Summary

**User Story:** As a user, I want to see a summary of employee leave, so that I can quickly know who is absent.

#### Acceptance Criteria

1. THE System SHALL display leave summary cards on the home page
2. THE System SHALL show leave cards in the format "[Person] is on leave from [Start Date] → [End Date] ([X] business days)"
3. THE System SHALL only display current or upcoming leave records
4. THE System SHALL make leave summary cards horizontally swipeable
5. WHEN a user clicks a leave summary card, THE System SHALL navigate to the Leave page with the selected person pre-selected, filtered view active, and calendar scrolled to that person's leave

### Requirement 8: Business Day Leave Management

**User Story:** As a user, I want to record employee leave using business days only, so that leave calculations exclude weekends and holidays.

#### Acceptance Criteria

1. THE System SHALL count leave only in business days
2. THE System SHALL define business days as Monday through Friday
3. THE System SHALL exclude weekends from business day calculations
4. THE System SHALL exclude public holidays from business day calculations
5. THE System SHALL exclude company closed dates from business day calculations
6. THE System SHALL provide a Leave page with person selection buttons
7. WHEN a user selects a person, THE System SHALL make that person active and make the other person disabled and transparent
8. THE System SHALL provide smooth hover and focus animations to make person selection obvious
9. THE System SHALL provide start date and end date inputs for leave entry
10. THE System SHALL only allow selection of valid business days in the date picker
11. THE System SHALL visually grey out or disable weekends, public holidays, and closed dates in the date picker
12. WHEN dates are selected, THE System SHALL automatically calculate and display total business days
13. WHEN start date equals end date and is a business day, THE System SHALL label the leave as "Day Off"
14. IF a user selects a date range with zero business days, THEN THE System SHALL display an error message and prevent saving
15. THE System SHALL support leave entries spanning multiple months or years
16. IF a user attempts to book leave that overlaps with their own existing leave, THEN THE System SHALL display a popup showing which leave overlaps and allow the user to merge or keep separate
17. WHEN a user books leave in the past, THE System SHALL display a warning popup and require confirmation
18. THE System SHALL allow leave entries of any duration with no maximum limit
19. WHEN a user confirms leave entry, THE System SHALL save the leave record
20. WHEN public holidays or closed dates change, THE System SHALL automatically recalculate business day counts for all leave records
21. THE System SHALL display a monthly calendar view showing leave ranges and disabled days
22. THE System SHALL use customizable colors per person in the calendar
23. THE System SHALL display leave history with person, date range, and business day count
24. WHEN a user clicks a leave record, THE System SHALL provide a combined popup with edit, delete, and cancel options requiring confirmation

### Requirement 9: Birthday Tracking and Display

**User Story:** As a user, I want to track employee birthdays, so that the system can display birthday notifications.

#### Acceptance Criteria

1. THE System SHALL store birthday records with name and date of birth
2. THE System SHALL calculate turning age dynamically based on current date
3. WHEN the current date matches a stored birthday, THE System SHALL display a birthday banner on the home page
4. WHEN multiple people share the same birthday, THE System SHALL display all birthdays in the banner
5. THE System SHALL display birthday banners even if the person is on leave
6. WHEN a birthday falls on February 29 and the current year is not a leap year, THE System SHALL celebrate the birthday on February 28
7. THE System SHALL format the birthday banner as "[Emoji] Today is [Name]'s birthday – turning [Age]"
8. WHEN a user clicks the birthday banner, THE System SHALL navigate to Settings and open the Birthdays section
9. THE System SHALL provide functionality to add birthdays with name and date of birth fields
10. THE System SHALL provide functionality to manage birthdays with edit and delete options
11. WHEN a user edits or deletes a birthday, THE System SHALL require confirmation

### Requirement 10: Public Holiday Management

**User Story:** As a user, I want to manage public holidays, so that leave calculations and calendars reflect non-working days.

#### Acceptance Criteria

1. THE System SHALL store and manage public holiday records
2. THE System SHALL apply public holidays equally to all users
3. THE System SHALL use public holidays in leave calculations
4. THE System SHALL disable public holidays in leave calendar date pickers
5. THE System SHALL display the next upcoming public holiday on the home page
6. THE System SHALL format the public holiday widget as "Next public holiday: [Name] – [Date]"
7. THE System SHALL allow users to add, edit, and delete public holidays
8. WHEN a public holiday and closed date fall on the same day, THE System SHALL give priority to closed date but display both in the UI

### Requirement 11: Company Closed Dates Management

**User Story:** As a user, I want to define company-wide closure periods, so that these dates are excluded from leave calculations.

#### Acceptance Criteria

1. THE System SHALL provide functionality to add closed periods with start date, end date, and optional note
2. THE System SHALL prevent selection of closed dates in leave calendars
3. THE System SHALL exclude closed dates from business day calculations
4. IF closed periods overlap, THEN THE System SHALL display a popup showing which dates overlap and allow the user to merge or keep separate
5. IF a closed date conflicts with existing leave, THEN THE System SHALL display a warning popup and require confirmation
6. WHEN a user adds closed dates in the past, THE System SHALL display a warning popup and require confirmation
7. THE System SHALL provide functionality to manage closed periods with edit and delete options
8. WHEN a user edits or deletes a closed period, THE System SHALL require confirmation
9. WHEN a public holiday and closed date fall on the same day, THE System SHALL give priority to closed date but display both in the UI

### Requirement 12: Navigation and Deep Linking

**User Story:** As a user, I want to navigate between pages efficiently, so that I can access features quickly from contextual links.

#### Acceptance Criteria

1. THE System SHALL provide navigation buttons for Personal Money, Company Money, and Leave on the home page
2. THE System SHALL provide page switcher arrows between Personal Money and Company Money pages
3. WHEN a user clicks a money summary card, THE System SHALL navigate to the Money page with relevant people pre-selected
4. WHEN a user clicks a leave summary card, THE System SHALL navigate to the Leave page with the selected person pre-selected, filtered view active, and calendar scrolled to that person's leave
5. WHEN a user clicks the birthday banner, THE System SHALL navigate to Settings and open Birthdays
6. THE System SHALL keep Money and Leave pages fully accessible via main navigation buttons

### Requirement 13: Data Persistence and Real-Time Updates

**User Story:** As a user, I want all data to persist and update automatically, so that information remains consistent across the application.

#### Acceptance Criteria

1. THE System SHALL persist users, personal transactions, company transactions, leave records, public holidays, closed dates, and birthdays
2. THE System SHALL use a single consistent company timezone for all dates
3. WHEN holidays or closed dates change, THE System SHALL automatically recalculate leave business day counts
4. WHEN personal or company transaction data changes, THE System SHALL automatically recalculate net balances
5. WHEN data changes, THE System SHALL instantly update home summaries, swipe cards, and calendars
6. THE System SHALL maintain data consistency across all views

### Requirement 14: User Interface and Experience

**User Story:** As a user, I want a clear and intuitive interface, so that I can use the application efficiently.

#### Acceptance Criteria

1. THE System SHALL use green color to indicate "owes" or "selected left"
2. THE System SHALL use red color to indicate "owed" or "selected right"
3. THE System SHALL clearly display disabled dates in calendars
4. THE System SHALL provide smooth animations for panels, modals, and card navigation
5. THE System SHALL make disabled people transparent in selection interfaces
6. THE System SHALL provide horizontal swipe navigation for cards
7. THE System SHALL allow users to customize calendar colors per person in settings
8. THE System SHALL display all monetary amounts in AUD currency
9. THE System SHALL provide page switcher arrows between Personal Money and Company Money pages
