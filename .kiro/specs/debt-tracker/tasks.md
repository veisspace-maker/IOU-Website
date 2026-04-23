# Implementation Plan: Debt Tracker

## Overview

This implementation plan converts the existing personal and company money tracking system into a simplified debt tracking system between Lev and Danik. The approach is to first create the new system alongside the old one, then perform a clean migration that removes all legacy code and data.

## Tasks

- [ ] 1. Database migration and schema setup
  - [x] 1.1 Create migration script for debt_transactions table
    - Create new table with fields: id, from_entity, to_entity, amount, created_at, updated_at
    - Add check constraints: from_entity ≠ to_entity, amount > 0
    - Add enum constraints for entity values
    - _Requirements: 8.3, 8.4_
  
  - [x] 1.2 Create migration script to remove old tables
    - Drop personal_transactions table
    - Drop company_transactions table
    - Remove any related indexes or constraints
    - _Requirements: 8.1, 8.2, 8.5, 8.6_
  
  - [ ]* 1.3 Write unit tests for migration scripts
    - Test table creation succeeds
    - Test old tables are removed
    - Test schema constraints are enforced
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 2. Backend business logic for debt calculation
  - [x] 2.1 Implement debt calculation function
    - Create calculateNetDebt function that processes transaction list
    - Handle all six transaction type cases (Lev↔Danik, Lev↔2_Masters, Danik↔2_Masters)
    - Return NetDebt object with debtor, creditor, and amount
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  
  - [ ]* 2.2 Write property test for direct transaction debt calculation
    - **Property 5: Debt Calculation Correctness for Direct Transactions**
    - **Validates: Requirements 3.1, 3.2**
  
  - [ ]* 2.3 Write property test for 2_Masters transaction debt calculation
    - **Property 6: Debt Calculation Correctness for 2_Masters Transactions**
    - **Validates: Requirements 3.3, 3.4, 3.5, 3.6**
  
  - [ ]* 2.4 Write property test for debt calculation summation
    - **Property 7: Debt Calculation Summation**
    - **Validates: Requirements 3.7**
  
  - [ ]* 2.5 Write property test for debt calculation inverse symmetry
    - **Property 8: Debt Calculation Inverse Symmetry**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**
  
  - [ ]* 2.6 Write unit tests for debt calculation edge cases
    - Test zero debt scenario
    - Test single transaction scenarios
    - Test large amounts
    - _Requirements: 3.7, 3.10_

- [-] 3. Backend API endpoints
  - [ ] 3.1 Implement POST /api/debt-transactions endpoint
    - Validate entity values
    - Validate from ≠ to
    - Validate amount > 0
    - Store transaction in database
    - Return created transaction
    - _Requirements: 1.1, 1.5, 2.1_
  
  - [ ] 3.2 Implement GET /api/debt-transactions endpoint
    - Retrieve all transactions from database
    - Order by created_at descending
    - Return transaction array
    - _Requirements: 4.4_
  
  - [ ] 3.3 Implement GET /api/debt-transactions/balance endpoint
    - Retrieve all transactions
    - Calculate net debt using business logic
    - Return NetDebt object
    - _Requirements: 3.7, 6.1_
  
  - [ ] 3.4 Implement PUT /api/debt-transactions/:id endpoint
    - Validate entity values
    - Validate from ≠ to
    - Validate amount > 0
    - Update transaction in database
    - Return updated transaction
    - _Requirements: 5.1, 5.3_
  
  - [ ] 3.5 Implement DELETE /api/debt-transactions/:id endpoint
    - Delete transaction from database
    - Return success confirmation
    - _Requirements: 9.1_
  
  - [ ]* 3.6 Write property test for transaction storage preservation
    - **Property 1: Transaction Storage Preserves Original Form**
    - **Validates: Requirements 1.1, 1.2, 1.4**
  
  - [ ]* 3.7 Write property test for entity validation
    - **Property 3: Entity Value Validation**
    - **Validates: Requirements 1.5**
  
  - [ ]* 3.8 Write property test for same entity rejection
    - **Property 4: Same Entity Rejection**
    - **Validates: Requirements 2.1, 2.3, 5.3, 5.5**
  
  - [ ]* 3.9 Write unit tests for API error handling
    - Test invalid entity values return 400
    - Test same entity returns 400
    - Test negative amount returns 400
    - Test non-existent ID returns 404
    - _Requirements: 1.5, 2.1_

- [ ] 4. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Frontend transaction entry component
  - [ ] 5.1 Create TransactionEntryForm component
    - Implement two-column layout (sender/receiver)
    - Add entity selection buttons (Lev, Danik, 2_Masters)
    - Add amount input field
    - Implement selection state management
    - Implement dimming logic for invalid selections
    - Add submit handler that calls API
    - _Requirements: 7.1, 7.2, 7.3, 2.1_
  
  - [ ] 5.2 Implement entity selection dimming logic
    - Disable selected sender on receiver side
    - Disable selected receiver on sender side
    - Disable other options on same side when one is selected
    - _Requirements: 2.2, 2.4, 2.5_
  
  - [ ]* 5.3 Write unit tests for TransactionEntryForm
    - Test entity selection updates state
    - Test dimming logic works correctly
    - Test form submission calls API
    - Test form validation
    - _Requirements: 2.1, 7.1_

- [ ] 6. Frontend transaction history component
  - [ ] 6.1 Create TransactionHistory component
    - Fetch transactions from API
    - Display transactions in "from → to: $amount" format
    - Show 2_Masters when present
    - Add edit and delete buttons for each transaction
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ]* 6.2 Write property test for transaction history display format
    - **Property 11: Transaction History Display Format**
    - **Validates: Requirements 4.3**
  
  - [ ]* 6.3 Write unit tests for TransactionHistory
    - Test transactions are displayed correctly
    - Test edit button opens modal
    - Test delete button removes transaction
    - _Requirements: 4.1, 4.3_

- [ ] 7. Frontend net debt display component
  - [ ] 7.1 Create NetDebtDisplay component
    - Fetch net debt from API
    - Display in "[Debtor] owes [Creditor] $[Amount]" format
    - Handle zero debt case with "No debt" message
    - Update after any transaction change
    - _Requirements: 3.8, 3.9, 6.1, 6.2, 6.4_
  
  - [ ]* 7.2 Write property test for net debt display format
    - **Property 9: Net Debt Display Format**
    - **Validates: Requirements 3.8, 3.9, 6.2**
  
  - [ ]* 7.3 Write unit tests for NetDebtDisplay
    - Test positive debt displays correctly
    - Test negative debt displays correctly
    - Test zero debt displays "No debt"
    - _Requirements: 3.8, 3.9, 6.4_

- [ ] 8. Frontend transaction edit modal
  - [ ] 8.1 Create TransactionEditModal component
    - Use same layout as TransactionEntryForm
    - Pre-populate with existing transaction data
    - Implement same validation and dimming logic
    - Add save and cancel handlers
    - Call PUT API endpoint on save
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ]* 8.2 Write property test for transaction edit retrieval
    - **Property 13: Transaction Edit Retrieval**
    - **Validates: Requirements 5.1**
  
  - [ ]* 8.3 Write unit tests for TransactionEditModal
    - Test modal pre-populates correctly
    - Test save updates transaction
    - Test cancel closes modal
    - _Requirements: 5.1, 5.3_

- [ ] 9. Frontend state management and integration
  - [ ] 9.1 Implement transaction state management
    - Create hooks or context for transaction data
    - Handle create, update, delete operations
    - Trigger net debt recalculation after changes
    - _Requirements: 6.3, 5.4, 9.2_
  
  - [ ] 9.2 Wire all components together in main page
    - Integrate TransactionEntryForm
    - Integrate TransactionHistory
    - Integrate NetDebtDisplay
    - Integrate TransactionEditModal
    - Ensure data flows correctly between components
    - _Requirements: 6.3_
  
  - [ ]* 9.3 Write property test for debt reflects current transaction set
    - **Property 14: Debt Reflects Current Transaction Set**
    - **Validates: Requirements 5.4, 6.3, 9.2, 9.3**
  
  - [ ]* 9.4 Write integration tests for full user flows
    - Test create transaction updates debt
    - Test edit transaction updates debt
    - Test delete transaction updates debt
    - _Requirements: 5.4, 6.3, 9.2_

- [ ] 10. Remove legacy code and references
  - [ ] 10.1 Remove personal money backend code
    - Remove personal transaction routes
    - Remove personal money calculation logic
    - Remove personal money database queries
    - _Requirements: 8.7_
  
  - [ ] 10.2 Remove company money backend code
    - Remove company transaction routes
    - Remove company money calculation logic
    - Remove company money database queries
    - _Requirements: 8.8_
  
  - [ ] 10.3 Remove personal money frontend code
    - Remove personal money components
    - Remove personal money state management
    - Remove personal money API calls
    - _Requirements: 8.9_
  
  - [ ] 10.4 Remove company money frontend code
    - Remove company money components
    - Remove company money state management
    - Remove company money API calls
    - _Requirements: 8.10_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The migration approach creates the new system first, then removes the old system
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- Backend implementation comes before frontend to enable API-first development
