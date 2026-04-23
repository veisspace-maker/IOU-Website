# Implementation Plan: Debt Tracker V2

## Overview

This implementation plan breaks down the Debt Tracker V2 system into discrete coding tasks. The system will be built incrementally, starting with core data models and business logic, then adding database persistence, and finally implementing the UI layer. Each task builds on previous work to ensure continuous integration.

## Tasks

- [x] 1. Set up project structure and core types
  - Create TypeScript interfaces for Transaction, DebtResult, ValidationResult
  - Define entity type union: 'lev' | 'danik' | '2masters'
  - Set up testing framework (Jest and fast-check for property-based testing)
  - Configure test environment with minimum 100 iterations for property tests
  - _Requirements: 1.1, 2.1, 2.2_

- [ ] 2. Implement transaction validation logic
  - [x] 2.1 Create TransactionValidator module
    - Implement validation for entity names (must be 'lev', 'danik', or '2masters')
    - Implement validation for self-transactions (from !== to)
    - Implement validation for positive amounts
    - Implement validation for valid timestamps
    - Return ValidationResult with errors array
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ]* 2.2 Write property test for invalid entity rejection
    - **Property 4: Invalid Entity Rejection**
    - **Validates: Requirements 2.1, 2.2**
  
  - [ ]* 2.3 Write property test for self-transaction rejection
    - **Property 5: Self-Transaction Rejection**
    - **Validates: Requirements 2.3**
  
  - [ ]* 2.4 Write property test for non-positive amount rejection
    - **Property 6: Non-Positive Amount Rejection**
    - **Validates: Requirements 2.4**
  
  - [ ]* 2.5 Write property test for invalid timestamp rejection
    - **Property 7: Invalid Timestamp Rejection**
    - **Validates: Requirements 2.5**
  
  - [ ]* 2.6 Write unit tests for validation edge cases
    - Test empty strings, null values, undefined
    - Test boundary values (zero, negative, very large numbers)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 3. Implement debt calculation logic
  - [x] 3.1 Create DebtCalculator module
    - Implement calculateNetDebt function that processes transaction array
    - Initialize debt accumulator (levOwes = 0)
    - Apply calculation rules for all six transaction types:
      - lev → danik: levOwes -= amount
      - danik → lev: levOwes += amount
      - lev → 2masters: levOwes -= amount / 2
      - 2masters → lev: levOwes += amount / 2
      - danik → 2masters: levOwes += amount / 2
      - 2masters → danik: levOwes -= amount / 2
    - Return DebtResult with debtor, creditor, and amount
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 5.1, 5.2_
  
  - [ ]* 3.2 Write property test for direct transaction debt (lev to danik)
    - **Property 8: Direct Transaction Debt Calculation (Lev to Danik)**
    - **Validates: Requirements 3.1**
  
  - [ ]* 3.3 Write property test for direct transaction debt (danik to lev)
    - **Property 9: Direct Transaction Debt Calculation (Danik to Lev)**
    - **Validates: Requirements 3.2**
  
  - [ ]* 3.4 Write property test for debt calculation additivity
    - **Property 10: Debt Calculation Additivity**
    - **Validates: Requirements 3.3, 4.3, 5.3**
  
  - [ ]* 3.5 Write property test for single net debt result
    - **Property 11: Single Net Debt Result**
    - **Validates: Requirements 3.4**
  
  - [ ]* 3.6 Write property test for lev to 2masters debt calculation
    - **Property 12: Lev to 2Masters Debt Calculation**
    - **Validates: Requirements 4.1**
  
  - [ ]* 3.7 Write property test for 2masters to lev debt calculation
    - **Property 13: 2Masters to Lev Debt Calculation**
    - **Validates: Requirements 4.2**
  
  - [ ]* 3.8 Write property test for danik to 2masters debt calculation
    - **Property 14: Danik to 2Masters Debt Calculation**
    - **Validates: Requirements 5.1**
  
  - [ ]* 3.9 Write property test for 2masters to danik debt calculation
    - **Property 15: 2Masters to Danik Debt Calculation**
    - **Validates: Requirements 5.2**
  
  - [ ]* 3.10 Write unit tests for debt calculation edge cases
    - Test zero debt (transactions that cancel out)
    - Test single transaction of each type
    - Test very large amounts
    - Test very small amounts (rounding)
    - _Requirements: 3.1, 3.2, 4.1, 4.2, 5.1, 5.2_

- [x] 4. Checkpoint - Ensure core business logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement database layer
  - [x] 5.1 Create database schema and migration
    - Create transactions table with fields: id, from_entity, to_entity, amount, timestamp, description
    - Add CHECK constraints for valid entities and positive amounts
    - Add CHECK constraint to prevent self-transactions
    - Create index on timestamp for efficient chronological queries
    - _Requirements: 10.1_
  
  - [x] 5.2 Implement TransactionRepository
    - Implement create() method with ID generation
    - Implement getAll() method with timestamp ordering
    - Implement update() method
    - Implement delete() method
    - Use parameterized queries to prevent SQL injection
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 5.3 Write property test for transaction storage round trip
    - **Property 1: Transaction Storage Round Trip**
    - **Validates: Requirements 1.1, 1.3, 1.5**
  
  - [ ]* 5.4 Write property test for unique transaction identifiers
    - **Property 2: Unique Transaction Identifiers**
    - **Validates: Requirements 1.4**
  
  - [ ]* 5.5 Write property test for entity name normalization
    - **Property 3: Entity Name Normalization**
    - **Validates: Requirements 1.2**
  
  - [ ]* 5.6 Write property test for transaction retrieval completeness
    - **Property 24: Transaction Retrieval Completeness**
    - **Validates: Requirements 9.2**
  
  - [ ]* 5.7 Write property test for transaction update persistence
    - **Property 25: Transaction Update Persistence**
    - **Validates: Requirements 9.3**
  
  - [ ]* 5.8 Write property test for transaction deletion removal
    - **Property 26: Transaction Deletion Removal**
    - **Validates: Requirements 9.4**
  
  - [ ]* 5.9 Write unit tests for database operations
    - Test empty database retrieval
    - Test transactions with missing optional fields
    - Test database error handling
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 6. Implement backend API routes
  - [x] 6.1 Create REST API endpoints
    - POST /api/debt-transactions - create transaction
    - GET /api/debt-transactions - get all transactions
    - PUT /api/debt-transactions/:id - update transaction
    - DELETE /api/debt-transactions/:id - delete transaction
    - GET /api/debt-transactions/net-debt - calculate and return net debt
    - Integrate TransactionValidator for request validation
    - Integrate TransactionRepository for data operations
    - Integrate DebtCalculator for net debt endpoint
    - Return appropriate error responses with error codes
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [ ]* 6.2 Write integration tests for API endpoints
    - Test full CRUD flow
    - Test error responses for invalid inputs
    - Test net debt calculation endpoint
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 7. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement display formatting utilities
  - [x] 8.1 Create formatting utility functions
    - Implement formatDebtDisplay() - converts DebtResult to display string
    - Implement formatCurrency() - formats amounts with $ and 2 decimals
    - Implement formatEntityName() - converts "2masters" to "2 Masters"
    - Implement formatTimestamp() - converts timestamp to human-readable format
    - _Requirements: 6.1, 6.3, 7.3, 8.3, 8.4_
  
  - [ ]* 8.2 Write property test for debt display format
    - **Property 16: Debt Display Format**
    - **Validates: Requirements 6.1**
  
  - [ ]* 8.3 Write property test for currency formatting
    - **Property 17: Currency Formatting**
    - **Validates: Requirements 6.3**
  
  - [ ]* 8.4 Write property test for entity display name conversion
    - **Property 18: Entity Display Name Conversion**
    - **Validates: Requirements 7.3, 8.3**
  
  - [ ]* 8.5 Write property test for timestamp formatting
    - **Property 23: Timestamp Human-Readable Formatting**
    - **Validates: Requirements 8.4**
  
  - [ ]* 8.6 Write unit tests for formatting edge cases
    - Test zero debt display
    - Test very large amounts
    - Test very small amounts
    - Test edge timestamps (epoch, far future)
    - _Requirements: 6.1, 6.2, 6.3, 8.4_

- [ ] 9. Implement EntitySelector UI component
  - [x] 9.1 Create EntitySelector component
    - Render two-column layout (sender | receiver)
    - Display three entity options in each column: "lev", "danik", "2 Masters"
    - Implement selection state management
    - Implement dimming logic: dim other options in same column when one is selected
    - Implement cross-column dimming: dim same entity in opposite column
    - Prevent selection of same entity in both columns
    - Use formatEntityName() to display "2 Masters"
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ]* 9.2 Write property test for entity selection dimming (same column)
    - **Property 19: Entity Selection Dimming (Same Column)**
    - **Validates: Requirements 7.4**
  
  - [ ]* 9.3 Write property test for entity selection dimming (cross column)
    - **Property 20: Entity Selection Dimming (Cross Column)**
    - **Validates: Requirements 7.5**
  
  - [ ]* 9.4 Write unit tests for EntitySelector
    - Test initial render with all options enabled
    - Test selection state changes
    - Test dimming visual states
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 10. Implement TransactionForm UI component
  - [x] 10.1 Create TransactionForm component
    - Integrate EntitySelector for sender/receiver selection
    - Add amount input field (positive numbers only)
    - Add description input field (optional)
    - Add submit button (disabled if validation fails)
    - Call POST /api/debt-transactions on submit
    - Display validation errors from backend
    - Clear form after successful submission
    - _Requirements: 9.1_
  
  - [ ]* 10.2 Write unit tests for TransactionForm
    - Test form submission with valid data
    - Test form validation
    - Test error display
    - Test form clearing after submission
    - _Requirements: 9.1_

- [ ] 11. Implement DebtDisplay UI component
  - [x] 11.1 Create DebtDisplay component
    - Fetch net debt from GET /api/debt-transactions/net-debt
    - Use formatDebtDisplay() to format the result
    - Use formatCurrency() for amount display
    - Display "No debt" when debt is zero
    - Auto-refresh when transactions change
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ]* 11.2 Write unit tests for DebtDisplay
    - Test display with positive debt
    - Test display with negative debt
    - Test display with zero debt
    - Test auto-refresh behavior
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 12. Implement TransactionHistory UI component
  - [x] 12.1 Create TransactionHistory component
    - Fetch transactions from GET /api/debt-transactions
    - Display transactions in chronological order (newest first)
    - For each transaction, display: from, to, amount, timestamp, description
    - Use formatEntityName() to convert "2masters" to "2 Masters"
    - Use formatTimestamp() for human-readable dates
    - Use formatCurrency() for amounts
    - Add edit button for each transaction
    - Add delete button for each transaction
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.3, 9.4_
  
  - [ ]* 12.2 Write property test for transaction history ordering
    - **Property 21: Transaction History Chronological Ordering**
    - **Validates: Requirements 8.1, 8.5**
  
  - [ ]* 12.3 Write property test for transaction display completeness
    - **Property 22: Transaction Display Completeness**
    - **Validates: Requirements 8.2**
  
  - [ ]* 12.4 Write unit tests for TransactionHistory
    - Test empty history display
    - Test single transaction display
    - Test multiple transactions display
    - Test edit action
    - Test delete action
    - _Requirements: 8.1, 8.2, 8.4, 9.3, 9.4_

- [ ] 13. Implement transaction edit functionality
  - [x] 13.1 Create EditTransactionDialog component
    - Pre-fill form with existing transaction data
    - Use EntitySelector for entity selection
    - Call PUT /api/debt-transactions/:id on submit
    - Display validation errors
    - Close dialog after successful update
    - _Requirements: 9.3_
  
  - [ ]* 13.2 Write unit tests for EditTransactionDialog
    - Test form pre-filling
    - Test update submission
    - Test error handling
    - _Requirements: 9.3_

- [ ] 14. Implement transaction delete functionality
  - [x] 14.1 Add delete confirmation
    - Show confirmation dialog before deletion
    - Call DELETE /api/debt-transactions/:id on confirmation
    - Refresh transaction list after deletion
    - Update net debt display after deletion
    - _Requirements: 9.4_
  
  - [ ]* 14.2 Write unit tests for delete functionality
    - Test confirmation dialog
    - Test successful deletion
    - Test list refresh after deletion
    - _Requirements: 9.4_

- [ ] 15. Integrate all components into main page
  - [x] 15.1 Create DebtTrackerPage component
    - Add TransactionForm at the top
    - Add DebtDisplay showing current net debt
    - Add TransactionHistory showing all transactions
    - Wire up state management to refresh all components when transactions change
    - Ensure DebtDisplay updates when transactions are added/edited/deleted
    - _Requirements: 6.4, 9.1, 9.2, 9.3, 9.4_
  
  - [ ]* 15.2 Write integration tests for full page
    - Test end-to-end transaction creation flow
    - Test end-to-end transaction update flow
    - Test end-to-end transaction delete flow
    - Test net debt updates after each operation
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 6.4_

- [x] 16. Final checkpoint - Ensure all tests pass
  - Run full test suite (unit tests and property-based tests)
  - Verify all 26 correctness properties are implemented and passing
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests use fast-check with minimum 100 iterations
- Each property test is tagged with: `Feature: debt-tracker-v2, Property {N}: {property_text}`
- Core business logic (validation and calculation) is tested before database integration
- UI components are built incrementally and tested independently before integration
