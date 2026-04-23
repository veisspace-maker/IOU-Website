# Company Tracker Spec Update Summary

## Overview

The company-tracker spec has been successfully updated to incorporate the new **Company vs Personal Money Logic** with automatic debt tracking based on 50/50 ownership between Leva and Danik.

## Key Changes

### 1. System Scope
- **Removed**: "2 Masters" user account (now only Leva and Danik)
- **Added**: Distinction between Personal Money and Company Money transactions
- **Added**: Automatic debt calculation based on 50/50 company ownership

### 2. New Requirements Added

**Requirement 5: Company Money Transaction Management and Debt Tracking**
- Automatic debt calculation when "wrong" money is used
- Four transaction scenarios:
  - Personal money for company expense → Creates debt
  - Company money for personal expense → Creates debt
  - Company income received personally → Creates debt
  - Company money for company expense → No debt
- Hard-coded 50/50 ownership split
- Debt rounded to nearest cent

**Requirement 6: Combined Debt Display**
- Combines personal transaction debt and company transaction debt
- Single unified view of who owes whom

### 3. Updated Requirements

**Requirement 3**: Money summary cards now show combined debt (personal + company)

**Requirement 4**: Renamed to "Personal Money Transaction Management"
- Added page switcher to Company Money page
- Added optional description field
- Transactions are immutable (no edit/delete)
- All amounts in AUD currency
- Combined transaction history with filtering

### 4. Data Model Changes

**New Models**:
- `PersonalTransaction`: Tracks personal money transfers
- `CompanyTransaction`: Tracks company expenses/income with transaction type
- `CompanyDebt`: Calculated debt based on 50/50 ownership
- `CombinedBalance`: Sum of personal balance and company debt

**Transaction Types**:
- `personal_for_company`: Personal money used for company expense
- `company_for_personal`: Company money used for personal expense
- `company_income_personal`: Company income received by one person
- `company_for_company`: Company money for company expense (no debt)

### 5. New Algorithms

**Company Debt Calculation**:
```typescript
function calculateCompanyDebt(userAId, userBId, companyTransactions)
```
- Implements 50/50 ownership logic
- Handles all four transaction types
- Rounds to nearest cent

**Combined Balance Calculation**:
```typescript
function calculateCombinedBalance(userAId, userBId, personalTransactions, companyTransactions)
```
- Sums personal net balance and company debt
- Provides unified debt view

### 6. New Correctness Properties

Added 10 new properties (51-60):
- Property 51-54: Company debt calculation for each transaction type
- Property 55: Company debt rounding
- Property 56-57: Combined balance calculation and reactivity
- Property 58: Transaction immutability
- Property 59: Currency display consistency (AUD)
- Property 60: Transaction type filtering

### 7. UI Changes

**New Pages**:
- Personal Money Page (replaces old Money page)
- Company Money Page (new)

**Navigation**:
- Page switcher arrows between Personal and Company Money pages
- Combined transaction history on both pages
- Filters for date range, person, and money type

**Company Money Page Features**:
- Current debt display at top
- Swipe/slide widget to view reverse debt
- Transaction entry form
- No warnings when "wrong" money is used

**Transaction History**:
- Shows both personal and company transactions
- Filterable by money type
- No edit/delete buttons (immutable)
- All amounts in AUD

### 8. Backend API Changes

**New Endpoints**:
- `POST /api/transactions/personal` - Create personal transaction
- `GET /api/transactions/personal` - List personal transactions
- `GET /api/transactions/personal/net-balances` - Get personal net balances
- `POST /api/transactions/company` - Create company transaction
- `GET /api/transactions/company` - List company transactions
- `GET /api/transactions/company/debt` - Get company debt
- `GET /api/transactions/all` - List all transactions with filtering
- `GET /api/transactions/combined-balances` - Get combined balances

**Removed Endpoints**:
- `PUT /api/transactions/:id` - No longer needed (immutable)
- `DELETE /api/transactions/:id` - No longer needed (immutable)

### 9. New Implementation Tasks

Added tasks for:
- Company debt calculation logic (2.5.1 - 2.5.7)
- Combined balance calculation logic (2.6.1 - 2.6.3)
- Personal transaction endpoints (8.1 - 8.5)
- Company transaction endpoints (8.5.1 - 8.5.7)
- Personal Money Page components (15.1 - 15.10)
- Company Money Page components (included in 15.1 - 15.10)
- Page switcher implementation (20.5)
- AUD currency display (20.6)

### 10. Design Principles

**New Principles Added**:
- **Immutability**: Transactions cannot be edited or deleted after creation
- **Automatic Debt Calculation**: System automatically calculates debt based on 50/50 ownership
- **No Warnings**: System doesn't warn when "wrong" money is used, just calculates debt

**Maintained Principles**:
- Calculation-driven
- Validation-first
- User-centric
- Consistency

## Implementation Status

All existing completed tasks remain marked as complete. New tasks are marked as incomplete and ready for implementation:

- ✅ Core business logic for personal transactions (existing)
- ⬜ Core business logic for company debt calculation (new)
- ⬜ Core business logic for combined balance calculation (new)
- ⬜ Backend endpoints for personal transactions (new)
- ⬜ Backend endpoints for company transactions (new)
- ⬜ Frontend Personal Money page (updated)
- ⬜ Frontend Company Money page (new)
- ⬜ Page switcher implementation (new)
- ⬜ Combined balance display on home page (updated)

## Next Steps

1. Review the updated requirements, design, and tasks documents
2. Begin implementation with task 2.5 (Company Debt Calculation)
3. Follow the task list sequentially for best results
4. Run property-based tests to verify correctness properties

## Files Updated

- `.kiro/specs/company-tracker/requirements.md` - Updated with new requirements
- `.kiro/specs/company-tracker/design.md` - Updated with new data models, algorithms, and properties
- `.kiro/specs/company-tracker/tasks.md` - Updated with new implementation tasks

All changes maintain backward compatibility with existing completed work while adding the new company money functionality.
