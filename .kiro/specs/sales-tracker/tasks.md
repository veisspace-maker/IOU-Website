# Implementation Plan: Sales Tracker

## Overview

This implementation plan breaks down the Sales Tracker feature into discrete coding tasks. The approach follows an incremental pattern: database → API → frontend components → integration. Each task builds on previous work, with testing integrated throughout to catch errors early.

## Tasks

- [x] 1. Set up database schema and migration
  - Create migration script for `sales_transactions` table with fields: id (UUID string), item (string), price (number), date (string), description (nullable string), createdBy (string)
  - Add indexes for common queries (id, createdBy)
  - Run migration and verify table structure
  - _Requirements: 9.1, 9.2_

- [x] 2. Implement backend API endpoints and business logic
  - [x] 2.1 Create sales transaction routes file
    - Implement GET /api/sales endpoint to return all transactions
    - Implement POST /api/sales endpoint with input validation and item trimming
    - Implement PUT /api/sales/:id endpoint with input validation and item trimming
    - Implement DELETE /api/sales/:id endpoint
    - Add authentication middleware to extract user ID
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 1.1, 1.4, 4.1, 4.2, 5.1_
  
  - [x] 2.2 Create business logic utility functions
    - Implement `normalizeItem(item: string)` function for trim + lowercase
    - Implement `calculateItemStats(transactions)` function for per-item aggregation
    - Implement `filterByItem(transactions, filterItem)` function
    - _Requirements: 3.5, 7.1, 7.2, 7.3_
  
  - [x] 2.3 Write property test for transaction creation invariants
    - **Property 1: Transaction Creation Invariants**
    - **Validates: Requirements 1.1, 1.3, 1.4, 1.5**
  
  - [x] 2.4 Write property test for item normalization consistency
    - **Property 7: Item Normalization Consistency**
    - **Validates: Requirements 3.5, 7.1**
  
  - [x] 2.5 Write property test for per-item statistics accuracy
    - **Property 12: Per-Item Statistics Accuracy**
    - **Validates: Requirements 7.1, 7.2, 7.3**
  
  - [x] 2.6 Write unit tests for API endpoints
    - Test input validation (missing fields, invalid types)
    - Test error responses (404 for non-existent IDs, 400 for bad input)
    - Test authentication requirements
    - _Requirements: 10.5_

- [x] 3. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Create frontend navigation and page structure
  - [x] 4.1 Add Sales navigation item
    - Add "Sales" link to main navigation bar at same level as Money Tracker and Leave Tracker
    - Create route for /sales page
    - _Requirements: 11.1, 11.2, 11.3_
  
  - [x] 4.2 Create SalesPage component with tab structure
    - Implement tabbed interface with "Transactions" and "Stats" tabs
    - Add tab state management
    - Create placeholder content for each tab
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [x] 4.3 Write unit tests for navigation and page structure
    - Test navigation item appears in correct position
    - Test tab switching behavior
    - Test route navigation

- [x] 5. Implement Transactions tab components
  - [x] 5.1 Create API client functions
    - Implement `fetchSales()` function
    - Implement `createSale(data)` function
    - Implement `updateSale(id, data)` function
    - Implement `deleteSale(id)` function
    - Add error handling for network failures
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [x] 5.2 Create SalesTransactionList component
    - Adapt TransactionHistory.tsx pattern for sales
    - Display item, price, date, description for each transaction
    - Add edit and delete controls
    - Implement loading and error states
    - _Requirements: 2.1, 2.2_
  
  - [x] 5.3 Create AddTransactionForm component
    - Add form fields for item, price, date, description
    - Implement client-side validation
    - Handle form submission and API calls
    - Clear form after successful submission
    - _Requirements: 1.1, 1.2_
  
  - [x] 5.4 Create ItemFilter component
    - Extract unique item names from transactions using normalization
    - Generate filter options with "All" as first option
    - Implement filter selection state
    - Apply filter to transaction list
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 5.5 Write property test for filter behavior correctness
    - **Property 6: Filter Behavior Correctness**
    - **Validates: Requirements 3.3, 3.4, 3.5**
  
  - [x] 5.6 Write property test for transaction display completeness
    - **Property 4: Transaction Display Completeness**
    - **Validates: Requirements 2.1**
  
  - [x] 5.7 Write unit tests for transaction components
    - Test form validation and submission
    - Test edit and delete interactions
    - Test empty state display
    - Test error handling

- [ ] 6. Implement Stats tab components
  - [x] 6.1 Create SalesStatsCards component
    - Adapt MoneySummaryCards.tsx pattern for sales
    - Display Total Revenue card (sum of all prices)
    - Display Total Items Sold card (count of all transactions)
    - _Requirements: 6.1, 6.2_
  
  - [x] 6.2 Create ItemBreakdownTable component
    - Calculate per-item statistics using normalization
    - Display item name, total revenue, and count for each item
    - Sort items by revenue in descending order
    - Make rows clickable for drill-down
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x] 6.3 Create DrillDownView component
    - Display selected item's total revenue and count
    - Show filtered transaction list for selected item
    - Add close/back button to return to breakdown view
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ] 6.4 Write property test for overall statistics accuracy
    - **Property 11: Overall Statistics Accuracy**
    - **Validates: Requirements 6.1, 6.2**
  
  - [ ] 6.5 Write property test for item breakdown sorting
    - **Property 13: Item Breakdown Sorting**
    - **Validates: Requirements 7.4**
  
  - [ ] 6.6 Write property test for drill-down correctness
    - **Property 14: Drill-Down Correctness**
    - **Validates: Requirements 8.1, 8.2, 8.3**
  
  - [ ] 6.7 Write unit tests for stats components
    - Test empty transaction list handling
    - Test single item statistics
    - Test drill-down open/close behavior

- [ ] 7. Checkpoint - Ensure frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement CRUD operations and state management
  - [x] 8.1 Wire up transaction creation
    - Connect AddTransactionForm to API client
    - Update transaction list after successful creation
    - Show success/error feedback
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 8.2 Wire up transaction updates
    - Connect edit controls to API client
    - Update transaction list after successful update
    - Preserve id and createdBy fields
    - Show success/error feedback
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 8.3 Wire up transaction deletion
    - Connect delete controls to API client
    - Remove transaction from list after successful deletion
    - Add confirmation dialog
    - Show success/error feedback
    - _Requirements: 5.1, 5.2_
  
  - [ ] 8.4 Write property test for transaction update preservation
    - **Property 8: Transaction Update Preservation**
    - **Validates: Requirements 4.1, 4.2, 4.3**
  
  - [ ] 8.5 Write property test for transaction deletion completeness
    - **Property 9: Transaction Deletion Completeness**
    - **Validates: Requirements 5.1**
  
  - [ ] 8.6 Write property test for cross-user deletion permission
    - **Property 10: Cross-User Deletion Permission**
    - **Validates: Requirements 5.2**

- [ ] 9. Implement persistence and data consistency
  - [ ] 9.1 Add database persistence verification
    - Ensure all CRUD operations persist to database
    - Verify changes are immediately reflected in queries
    - _Requirements: 9.3_
  
  - [ ] 9.2 Write property test for persistence immediacy
    - **Property 16: Persistence Immediacy**
    - **Validates: Requirements 9.3**
  
  - [ ] 9.3 Write property test for schema compliance
    - **Property 15: Schema Compliance**
    - **Validates: Requirements 9.2**

- [ ] 10. Final integration and polish
  - [ ] 10.1 Add error handling throughout
    - Implement error boundaries in React components
    - Add user-friendly error messages
    - Add retry mechanisms for failed requests
    - _Requirements: All error scenarios from design_
  
  - [ ] 10.2 Verify visual consistency with Money Tracker
    - Ensure layout matches Money Tracker patterns
    - Verify responsive behavior
    - Test on different screen sizes
    - _Requirements: 2.3_
  
  - [ ] 10.3 Write integration tests
    - Test complete create → read → update → delete flow
    - Test filter and stats calculations with real data
    - Test navigation and tab switching
  
  - [ ] 10.4 Write property test for API response correctness
    - **Property 17: API Response Correctness**
    - **Validates: Requirements 10.5**

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with minimum 100 iterations each
- Unit tests validate specific examples, edge cases, and error conditions
- The implementation reuses Money Tracker patterns (TransactionHistory.tsx, MoneySummaryCards.tsx) for consistency
- Item normalization (trim + lowercase) is critical for filtering and grouping logic
