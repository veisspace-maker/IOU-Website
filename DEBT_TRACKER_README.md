# Debt Tracker

A simplified debt tracking system for managing money owed between Lev and Danik, including shared expenses through the "2masters" entity representing 50/50 splits.

## Overview

The Debt Tracker maintains accurate records of all financial transactions between Lev and Danik, automatically calculating net debt positions. It supports direct transactions and shared expenses (50/50 split via 2masters), providing a clear picture of who owes whom. The system stores transactions in their original form and calculates debt on-demand using split transaction logic.

## Features

### Transaction Management
- Create, edit, and delete debt transactions
- Support for three entities: Lev, Danik, and 2masters (shared 50/50)
- Timestamp-based transaction ordering (newest first)
- Optional descriptions for context
- Automatic pagination (100 transactions per page)
- Transactions stored in original form (not converted)
- Entity selector with validation (prevents same entity selection)

### Debt Calculation
- Real-time net debt calculation with 50/50 split logic
- Automatic handling of split transactions involving 2masters
- Clear debtor/creditor identification
- Historical transaction tracking
- Balance verification with property-based tests

### Smart Features
- Self-transaction prevention (from and to must be different)
- Positive amount validation
- Timestamp validation (no future dates)
- Entity name normalization (case-insensitive: 'Lev', 'lev', 'LEV' all accepted)
- Automatic debt display updates after any transaction change
- Integration with Sales Tracker (sales auto-create debt transactions: 2masters → seller)

## User Interface

### Main Components
1. **Debt Display**: Shows current net debt status with color coding
2. **Transaction Form**: Create new transactions with entity selectors
3. **Transaction History**: View all past transactions with pagination
4. **Summary Card**: Quick overview on home page
5. **Edit Dialog**: Modal for editing existing transactions

### Debt Display
- Shows who owes whom with clear messaging
- Displays amount in AUD currency format
- Color-coded for clarity:
  - Green: Positive balance (you are owed money)
  - Red: Negative balance (you owe money)
  - Gray: Zero balance (no debt)
- Updates automatically after any transaction change

### Transaction Form
- From entity selector (Lev, Danik, 2masters) with visual buttons
- To entity selector (Lev, Danik, 2masters) with visual buttons
- Amount input (must be positive, AUD)
- Optional description field
- Automatic timestamp (current time)
- Entity validation (prevents selecting same entity for from and to)
- Visual dimming of invalid entity selections

### Transaction History
- Reverse chronological order (newest first)
- Shows: From → To, Amount (AUD), Date/Time, Description
- Edit and delete buttons for each transaction
- Swipe-to-delete on mobile devices
- Pagination controls (100 per page)
- Scroll position preservation during updates

## Data Model

```typescript
Transaction {
  id: string              // UUID
  from: Entity            // 'lev' | 'danik' | '2masters'
  to: Entity              // 'lev' | 'danik' | '2masters'
  amount: number          // Must be > 0 (AUD)
  timestamp: number       // Unix milliseconds
  description?: string    // Optional description
}

Entity = 'lev' | 'danik' | '2masters'

DebtResult {
  debtor: 'lev' | 'danik' | 'none'
  creditor: 'lev' | 'danik' | 'none'
  amount: number          // Absolute debt amount
}
```

**Important**: The "2masters" entity is NOT a person or wallet - it's a UI/UX concept representing 50/50 split transactions. Transactions are stored in their original form with "2masters" preserved, and the 50/50 split logic is applied only during debt calculation.

## API Endpoints

### POST /api/debt-transactions-v2
Create a new debt transaction.

**Request Body:**
```json
{
  "from": "lev",
  "to": "danik",
  "amount": 50.00,
  "timestamp": 1713852000000,
  "description": "Lunch payment"
}
```

**Response:**
```json
{
  "transaction": {
    "id": "uuid",
    "from": "lev",
    "to": "danik",
    "amount": 50.00,
    "timestamp": 1713852000000,
    "description": "Lunch payment"
  },
  "message": "Transaction created successfully"
}
```

**Error Codes:**
- `MISSING_FIELDS`: Required fields missing
- `INVALID_ENTITY`: Invalid entity name
- `SELF_TRANSACTION`: From and to are the same
- `INVALID_AMOUNT`: Amount is not positive
- `INVALID_TIMESTAMP`: Timestamp is invalid or in future

### GET /api/debt-transactions-v2
List debt transactions with pagination.

**Query Parameters:**
- `limit` (optional): Records per page (default: 100, max: 1000)
- `offset` (optional): Records to skip (default: 0)

**Response:**
```json
{
  "transactions": [ /* array of transactions */ ],
  "total": 250,
  "limit": 100,
  "offset": 0
}
```

### GET /api/debt-transactions-v2/net-debt
Calculate current net debt between Lev and Danik.

**Response:**
```json
{
  "debtor": "lev",
  "creditor": "danik",
  "amount": 125.50
}
```

### PUT /api/debt-transactions-v2/:id
Update an existing transaction.

**Request Body:** Same as POST

**Response:**
```json
{
  "transaction": { /* updated transaction */ },
  "message": "Transaction updated successfully"
}
```

### DELETE /api/debt-transactions-v2/:id
Delete a transaction.

**Response:**
```json
{
  "message": "Transaction deleted successfully"
}
```

## Business Logic

### Direct Transactions
Money flows directly between Lev and Danik:
- **Lev → Danik**: Lev paid Danik (Lev owes less or Danik owes more)
- **Danik → Lev**: Danik paid Lev (Danik owes less or Lev owes more)

### Split Transactions (2masters)
Shared expenses are split 50/50:
- **Lev → 2masters**: Lev paid for shared expense (Danik owes Lev half)
- **Danik → 2masters**: Danik paid for shared expense (Lev owes Danik half)
- **2masters → Lev**: Shared money given to Lev (Lev owes Danik half)
- **2masters → Danik**: Shared money given to Danik (Danik owes Lev half)

### Net Debt Calculation
The system calculates net debt by:
1. Summing all direct transactions (Lev ↔ Danik)
2. Adding half of all split transactions involving 2masters
3. Determining final debtor and creditor
4. Returning absolute amount owed

**Example:**
```
Lev → Danik: $100 (Lev owes $100)
Danik → Lev: $50 (Lev owes $50)
Lev → 2masters: $60 (Danik owes Lev $30)
Net: Lev owes Danik $20
```

## Validation Rules

1. **From Entity**: Required, must be 'lev', 'danik', or '2masters'
2. **To Entity**: Required, must be 'lev', 'danik', or '2masters'
3. **Self-Transaction**: From and to cannot be the same
4. **Amount**: Required, must be > 0
5. **Timestamp**: Optional, defaults to current time, cannot be in future
6. **Description**: Optional, can be empty

## Entity Name Formatting

Entity names are automatically normalized:
- Input: Case-insensitive ('Lev', 'LEV', 'lev' all accepted)
- Storage: Lowercase ('lev', 'danik', '2masters')
- Display: Capitalized ('Lev', 'Danik', '2Masters')

## Testing

### Unit Tests
- `TransactionForm.test.tsx`: Form validation and submission
- `TransactionHistory.test.tsx`: List rendering and interactions
- `DebtDisplay.test.tsx`: Debt calculation display
- `EditTransactionDialog.test.tsx`: Edit functionality
- `EntitySelector.test.tsx`: Entity selection component
- `debtCalculations.test.ts`: Business logic calculations
- `DebtCalculator.test.ts`: Net debt calculation with split logic
- `TransactionValidator.test.ts`: Input validation
- `formatters.test.ts`: Display formatting utilities
- `debtTracker.test.ts`: Type definitions and interfaces

### Property-Based Tests
- Uses fast-check library for property-based testing
- Each property test runs minimum 100 iterations
- Tests tagged with format: `// Feature: debt-tracker, Property {number}: {description}`
- Validates universal properties across all valid inputs
- Covers transaction storage, debt calculation, and split transaction logic

### Integration Tests
- `debtTransactionsV2.test.ts`: API endpoint testing
- `TransactionRepository.test.ts`: Database operations
- End-to-end transaction flows (create → read → update → delete)

## Mobile Responsiveness

- Touch-optimized entity selectors
- Swipe gestures for delete
- Responsive form layouts
- Large touch targets
- Optimized for 320px+ screens

## Performance Optimizations

- Pagination for large transaction lists
- Memoized debt calculations
- Efficient database queries with indexes
- Scroll position preservation
- Debounced form inputs

## Common Use Cases

### Recording a Payment
1. Navigate to Debt Tracker page
2. Select "From" entity (who paid)
3. Select "To" entity (who received)
4. Enter amount
5. Add optional description
6. Click "Add Transaction"

### Checking Current Debt
1. View Debt Display at top of page
2. See who owes whom and how much
3. Or check Summary Card on home page

### Recording Shared Expense
1. If Lev paid for shared item:
   - From: Lev
   - To: 2masters
   - Amount: Total paid
2. If Danik paid for shared item:
   - From: Danik
   - To: 2masters
   - Amount: Total paid

### Editing a Transaction
1. Find transaction in history
2. Click edit icon
3. Modify fields as needed
4. Click "Save"

### Settling Debt
1. Record payment transaction
2. From: Debtor
3. To: Creditor
4. Amount: Settlement amount
5. Description: "Debt settlement"

## Database Schema

```sql
CREATE TABLE debt_transactions_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_entity VARCHAR(50) NOT NULL CHECK (from_entity IN ('lev', 'danik', '2masters')),
  to_entity VARCHAR(50) NOT NULL CHECK (to_entity IN ('lev', 'danik', '2masters')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  timestamp BIGINT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT different_entities CHECK (from_entity != to_entity)
);

CREATE INDEX idx_debt_timestamp ON debt_transactions_v2(timestamp DESC);
CREATE INDEX idx_debt_entities ON debt_transactions_v2(from_entity, to_entity);
```

## Integration with Sales Tracker

When a sale is recorded:
1. Sales Tracker creates the sale transaction with item, price, quantity, seller, and date
2. Calculates total amount: `price × quantity`
3. Automatically creates debt transaction: `2masters → seller` for the total amount
4. Debt description includes: `Sale: {item} (Qty: {quantity} × ${price} = ${total}) - {description}`
5. This represents that the seller received company money (including the other person's 50% share)
6. The Debt Tracker applies 50/50 split logic during calculation:
   - Transaction `2masters → lev` means Lev received shared money, so Danik owes Lev half
   - Transaction `2masters → danik` means Danik received shared money, so Lev owes Danik half
7. Net debt updates automatically to reflect the sale

**Example**: If Leva sells 3 widgets at $10 each:
- Sales transaction: 3 widgets @ $10 = $30 by Leva
- Debt transaction: `2masters → lev` for $30 with description "Sale: widget (Qty: 3 × $10.00 = $30.00)"
- Debt calculation: Danik owes Lev $15 (his half of the company money that Lev received)
- If Lev already owed Danik $20, the new net debt would be: Lev owes Danik $5

This ensures financial records stay synchronized between sales and debts, with automatic 50/50 split calculations.

## Utilities

### debtTrackerUtils.ts
- `formatEntityName()`: Convert entity to display format
- `formatCurrency()`: Format amounts as AUD currency
- `formatDebtDisplay()`: Create readable debt strings
- `formatTimestamp()`: Convert Unix timestamp to date string

### DebtCalculator.ts
- `calculateNetDebt()`: Compute net debt from transactions
- Handles direct and split transactions
- Returns debtor, creditor, and amount

### TransactionValidator.ts
- `validate()`: Validate transaction data
- Returns validation result with errors
- Checks all business rules

## Future Enhancements

- Transaction categories and tags for better organization
- Recurring transactions (e.g., monthly rent split)
- Payment reminders and notifications
- Export to CSV/Excel for record keeping
- Transaction search and advanced filtering
- Date range filtering for historical analysis
- Multi-currency support with exchange rates
- Receipt photo attachments
- Settlement history tracking with timestamps
- Analytics dashboard with charts and graphs
- Transaction notes and threaded comments
- Bulk transaction import from CSV
- Scheduled transactions (future-dated)
- Transaction templates for common expenses
- Split percentage customization (not just 50/50)
