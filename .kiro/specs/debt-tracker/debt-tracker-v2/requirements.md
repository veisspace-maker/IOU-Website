# Requirements Document: Debt Tracker V2

## Introduction

The Debt Tracker V2 is a transaction-based debt tracking system that replaces the old money tracking system. It tracks raw transactions between entities and derives who owes whom through calculation, rather than storing balances. The system handles three entities: Lev, Danik, and 2Masters (representing shared money split 50/50 between Lev and Danik). All transactions ultimately resolve to a final debt between Lev and Danik only.

## Glossary

- **Transaction**: A record of money movement from one entity to another, including amount, timestamp, and optional description
- **Entity**: One of three participants in transactions: "lev", "danik", or "2masters"
- **2Masters**: A special entity representing shared money that is always split 50/50 between Lev and Danik
- **Net_Debt**: The calculated result showing who owes whom after processing all transactions
- **System**: The Debt Tracker V2 application
- **Database**: The persistent storage layer for transactions
- **UI**: The user interface for interacting with the system

## Requirements

### Requirement 1: Store Raw Transactions

**User Story:** As a user, I want to store raw transaction data, so that I have an accurate record of all money movements without derived calculations.

#### Acceptance Criteria

1. WHEN a transaction is created, THE System SHALL store the from entity, to entity, amount, timestamp, and optional description
2. THE System SHALL store entity names as "lev", "danik", or "2masters" in lowercase
3. WHEN storing a transaction, THE System SHALL NOT modify or convert the input data
4. THE System SHALL assign a unique identifier to each transaction
5. WHEN a transaction is stored, THE System SHALL preserve the exact amount provided by the user

### Requirement 2: Validate Transaction Entities

**User Story:** As a user, I want the system to prevent invalid transactions, so that I don't create meaningless records.

#### Acceptance Criteria

1. WHEN a transaction is submitted, THE System SHALL validate that the from entity is one of "lev", "danik", or "2masters"
2. WHEN a transaction is submitted, THE System SHALL validate that the to entity is one of "lev", "danik", or "2masters"
3. IF the from entity equals the to entity, THEN THE System SHALL reject the transaction and return an error
4. WHEN a transaction amount is provided, THE System SHALL validate that it is a positive number
5. WHEN a transaction timestamp is provided, THE System SHALL validate that it is a valid timestamp

### Requirement 3: Calculate Net Debt for Direct Transactions

**User Story:** As a user, I want to see who owes whom for direct transactions between Lev and Danik, so that I can track personal debts.

#### Acceptance Criteria

1. WHEN a transaction from "lev" to "danik" exists, THE System SHALL calculate that Danik owes Lev the transaction amount
2. WHEN a transaction from "danik" to "lev" exists, THE System SHALL calculate that Lev owes Danik the transaction amount
3. WHEN multiple direct transactions exist, THE System SHALL sum all amounts to calculate the net debt
4. THE System SHALL express the final result as a single debt from one person to the other

### Requirement 4: Calculate Net Debt for Lev and 2Masters Transactions

**User Story:** As a user, I want to track when Lev pays for or receives shared expenses, so that debts are split fairly with Danik.

#### Acceptance Criteria

1. WHEN a transaction from "lev" to "2masters" exists, THE System SHALL calculate that Danik owes Lev half the transaction amount
2. WHEN a transaction from "2masters" to "lev" exists, THE System SHALL calculate that Lev owes Danik half the transaction amount
3. WHEN multiple transactions between "lev" and "2masters" exist, THE System SHALL sum all calculated debts to determine the net debt
4. THE System SHALL divide the transaction amount by 2 when calculating debt for 2masters transactions

### Requirement 5: Calculate Net Debt for Danik and 2Masters Transactions

**User Story:** As a user, I want to track when Danik pays for or receives shared expenses, so that debts are split fairly with Lev.

#### Acceptance Criteria

1. WHEN a transaction from "danik" to "2masters" exists, THE System SHALL calculate that Lev owes Danik half the transaction amount
2. WHEN a transaction from "2masters" to "danik" exists, THE System SHALL calculate that Danik owes Lev half the transaction amount
3. WHEN multiple transactions between "danik" and "2masters" exist, THE System SHALL sum all calculated debts to determine the net debt
4. THE System SHALL divide the transaction amount by 2 when calculating debt for 2masters transactions

### Requirement 6: Display Net Debt Result

**User Story:** As a user, I want to see a clear summary of who owes whom, so that I can quickly understand the current debt situation.

#### Acceptance Criteria

1. WHEN displaying the net debt, THE System SHALL show the result in the format "Danik owes Lev $X" or "Lev owes Danik $X"
2. WHEN the net debt is zero, THE System SHALL display that no one owes anyone
3. WHEN displaying amounts, THE System SHALL format them with appropriate currency symbols and decimal places
4. THE System SHALL update the net debt display whenever transactions are added, edited, or deleted

### Requirement 7: Provide Two-Column Entity Selection UI

**User Story:** As a user, I want to select sender and receiver entities in a clear two-column layout, so that I can easily create transactions.

#### Acceptance Criteria

1. THE UI SHALL display a left column for selecting the sender entity with options "lev", "danik", and "2masters"
2. THE UI SHALL display a right column for selecting the receiver entity with options "lev", "danik", and "2masters"
3. WHEN displaying entity options, THE UI SHALL show "2 Masters" as the display text for the "2masters" entity
4. WHEN an entity is selected in the left column, THE UI SHALL dim other options in the left column
5. WHEN an entity is selected in the left column, THE UI SHALL dim the same entity in the right column to prevent self-transactions

### Requirement 8: Display Transaction History

**User Story:** As a user, I want to view all raw transactions, so that I can review the complete history of money movements.

#### Acceptance Criteria

1. THE UI SHALL display a list of all transactions in chronological order
2. WHEN displaying a transaction, THE UI SHALL show the from entity, to entity, amount, timestamp, and description
3. WHEN displaying entity names in the transaction history, THE UI SHALL show "2 Masters" for the "2masters" entity
4. THE UI SHALL format timestamps in a human-readable format
5. THE UI SHALL display the most recent transactions first

### Requirement 9: Support Transaction CRUD Operations

**User Story:** As a user, I want to create, read, update, and delete transactions, so that I can manage the transaction history.

#### Acceptance Criteria

1. WHEN a user submits a new transaction, THE System SHALL create and store it in the Database
2. WHEN a user requests transaction history, THE System SHALL retrieve and display all transactions
3. WHEN a user edits a transaction, THE System SHALL update the transaction in the Database and recalculate the net debt
4. WHEN a user deletes a transaction, THE System SHALL remove it from the Database and recalculate the net debt
5. WHEN a transaction is modified or deleted, THE System SHALL maintain data integrity across all records

### Requirement 10: Persist Transactions in Database

**User Story:** As a developer, I want transactions stored in a database, so that data persists across application restarts.

#### Acceptance Criteria

1. THE Database SHALL store transactions with fields: id, from, to, amount, timestamp, and description
2. WHEN the application starts, THE System SHALL retrieve all transactions from the Database
3. WHEN a transaction is created, THE System SHALL persist it to the Database immediately
4. WHEN a transaction is updated, THE System SHALL persist the changes to the Database immediately
5. WHEN a transaction is deleted, THE System SHALL remove it from the Database immediately
