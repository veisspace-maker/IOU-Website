# Design Document: Debt Tracker V2

## Overview

The Debt Tracker V2 is a transaction-based debt tracking system that stores raw transactions and derives net debt through calculation. The system handles three entities (Lev, Danik, and 2Masters) and applies specific rules to calculate who owes whom. The architecture follows a clean separation between data storage, business logic, and presentation layers.

The key design principle is to store exactly what the user inputs without conversion, then apply calculation rules at query time to determine the net debt between Lev and Danik.

## Architecture

The system follows a three-tier architecture:

1. **Data Layer**: Stores raw transactions in a database table
2. **Business Logic Layer**: Implements debt calculation rules and transaction validation
3. **Presentation Layer**: Provides UI for transaction management and debt visualization

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│  (UI Components, Entity Selection)  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Business Logic Layer          │
│  (Debt Calculations, Validation)    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│           Data Layer                │
│     (Transaction Storage)           │
└─────────────────────────────────────┘
```

## Components and Interfaces

### Transaction Data Model

```typescript
interface Transaction {
  id: string;
  from: 'lev' | 'danik' | '2masters';
  to: 'lev' | 'danik' | '2masters';
  amount: number;
  timestamp: number;
  description?: string;
}
```

### Debt Calculation Module

The core business logic module that processes transactions and calculates net debt.

```typescript
interface DebtCalculator {
  calculateNetDebt(transactions: Transaction[]): DebtResult;
}

interface DebtResult {
  debtor: 'lev' | 'danik' | 'none';
  creditor: 'lev' | 'danik' | 'none';
  amount: number;
}
```

**Calculation Algorithm:**

1. Initialize debt accumulator: `levOwes = 0` (positive means Lev owes Danik, negative means Danik owes Lev)
2. For each transaction, apply the appropriate rule:
   - **lev → danik**: `levOwes -= amount` (Danik owes Lev)
   - **danik → lev**: `levOwes += amount` (Lev owes Danik)
   - **lev → 2masters**: `levOwes -= amount / 2` (Danik owes Lev half)
   - **2masters → lev**: `levOwes += amount / 2` (Lev owes Danik half)
   - **danik → 2masters**: `levOwes += amount / 2` (Lev owes Danik half)
   - **2masters → danik**: `levOwes -= amount / 2` (Danik owes Lev half)
3. Return result based on final `levOwes` value

### Transaction Validation Module

```typescript
interface TransactionValidator {
  validate(transaction: Omit<Transaction, 'id'>): ValidationResult;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

**Validation Rules:**
- `from` must be one of: 'lev', 'danik', '2masters'
- `to` must be one of: 'lev', 'danik', '2masters'
- `from` must not equal `to`
- `amount` must be a positive number
- `timestamp` must be a valid timestamp

### Transaction Repository

```typescript
interface TransactionRepository {
  create(transaction: Omit<Transaction, 'id'>): Promise<Transaction>;
  getAll(): Promise<Transaction[]>;
  update(id: string, transaction: Partial<Transaction>): Promise<Transaction>;
  delete(id: string): Promise<void>;
}
```

### UI Components

**EntitySelector Component:**
- Two-column layout (sender | receiver)
- Each column displays: "lev", "danik", "2 Masters"
- Implements dimming logic to prevent invalid selections
- Stores "2masters" internally, displays "2 Masters" to user

**TransactionForm Component:**
- Entity selection (sender and receiver)
- Amount input (positive numbers only)
- Description input (optional)
- Submit button (disabled if validation fails)

**DebtDisplay Component:**
- Shows net debt result: "Danik owes Lev $X" or "Lev owes Danik $X"
- Updates automatically when transactions change
- Formats currency with 2 decimal places

**TransactionHistory Component:**
- Lists all transactions chronologically (newest first)
- Displays: from, to, amount, timestamp, description
- Provides edit and delete actions for each transaction
- Converts "2masters" to "2 Masters" for display

## Data Models

### Database Schema

**transactions table:**
```sql
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  from_entity TEXT NOT NULL CHECK(from_entity IN ('lev', 'danik', '2masters')),
  to_entity TEXT NOT NULL CHECK(to_entity IN ('lev', 'danik', '2masters')),
  amount REAL NOT NULL CHECK(amount > 0),
  timestamp INTEGER NOT NULL,
  description TEXT,
  CHECK(from_entity != to_entity)
);

CREATE INDEX idx_transactions_timestamp ON transactions(timestamp DESC);
```

**Design Decisions:**
- Use TEXT for entity names to maintain readability
- Use REAL for amounts to support decimal values
- Use INTEGER for timestamps (Unix epoch milliseconds)
- Add CHECK constraints for data integrity
- Index on timestamp for efficient chronological queries

## Correctness Properties


A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Transaction Storage Round Trip

*For any* valid transaction data (from, to, amount, timestamp, description), storing the transaction then retrieving it should return data that matches the original input exactly.

**Validates: Requirements 1.1, 1.3, 1.5**

### Property 2: Unique Transaction Identifiers

*For any* set of created transactions, all transaction IDs should be unique with no duplicates.

**Validates: Requirements 1.4**

### Property 3: Entity Name Normalization

*For any* transaction with entity names in any case, the system should store them as lowercase ("lev", "danik", "2masters").

**Validates: Requirements 1.2**

### Property 4: Invalid Entity Rejection

*For any* transaction with an entity name that is not one of "lev", "danik", or "2masters", the system should reject the transaction and return an error.

**Validates: Requirements 2.1, 2.2**

### Property 5: Self-Transaction Rejection

*For any* entity, attempting to create a transaction from that entity to itself should be rejected with an error.

**Validates: Requirements 2.3**

### Property 6: Non-Positive Amount Rejection

*For any* transaction with an amount less than or equal to zero, the system should reject the transaction and return an error.

**Validates: Requirements 2.4**

### Property 7: Invalid Timestamp Rejection

*For any* transaction with an invalid timestamp (negative, non-numeric, or NaN), the system should reject the transaction and return an error.

**Validates: Requirements 2.5**

### Property 8: Direct Transaction Debt Calculation (Lev to Danik)

*For any* positive amount X, when a transaction from "lev" to "danik" exists, the calculated debt should show that Danik owes Lev exactly X.

**Validates: Requirements 3.1**

### Property 9: Direct Transaction Debt Calculation (Danik to Lev)

*For any* positive amount X, when a transaction from "danik" to "lev" exists, the calculated debt should show that Lev owes Danik exactly X.

**Validates: Requirements 3.2**

### Property 10: Debt Calculation Additivity

*For any* set of transactions, the net debt should equal the sum of individual debt contributions from each transaction, where opposite-direction transactions cancel each other out.

**Validates: Requirements 3.3, 4.3, 5.3**

### Property 11: Single Net Debt Result

*For any* set of transactions, the calculated result should express exactly one debt relationship (either "Lev owes Danik X", "Danik owes Lev X", or "No debt"), never multiple simultaneous debts.

**Validates: Requirements 3.4**

### Property 12: Lev to 2Masters Debt Calculation

*For any* positive amount X, when a transaction from "lev" to "2masters" exists, the calculated debt should show that Danik owes Lev exactly X/2.

**Validates: Requirements 4.1**

### Property 13: 2Masters to Lev Debt Calculation

*For any* positive amount X, when a transaction from "2masters" to "lev" exists, the calculated debt should show that Lev owes Danik exactly X/2.

**Validates: Requirements 4.2**

### Property 14: Danik to 2Masters Debt Calculation

*For any* positive amount X, when a transaction from "danik" to "2masters" exists, the calculated debt should show that Lev owes Danik exactly X/2.

**Validates: Requirements 5.1**

### Property 15: 2Masters to Danik Debt Calculation

*For any* positive amount X, when a transaction from "2masters" to "danik" exists, the calculated debt should show that Danik owes Lev exactly X/2.

**Validates: Requirements 5.2**

### Property 16: Debt Display Format

*For any* non-zero debt result, the formatted display string should contain the debtor name, creditor name, and amount in the format "[Debtor] owes [Creditor] $[Amount]".

**Validates: Requirements 6.1**

### Property 17: Currency Formatting

*For any* amount, the formatted display should include a currency symbol and exactly 2 decimal places.

**Validates: Requirements 6.3**

### Property 18: Entity Display Name Conversion

*For any* UI rendering that displays entity names, the entity "2masters" should be displayed as "2 Masters" to the user.

**Validates: Requirements 7.3, 8.3**

### Property 19: Entity Selection Dimming (Same Column)

*For any* selected entity in a column, all other entities in the same column should be visually dimmed or disabled.

**Validates: Requirements 7.4**

### Property 20: Entity Selection Dimming (Cross Column)

*For any* entity selected in the left column, the same entity in the right column should be visually dimmed or disabled to prevent self-transactions.

**Validates: Requirements 7.5**

### Property 21: Transaction History Chronological Ordering

*For any* set of transactions, the displayed transaction history should be ordered by timestamp in descending order (most recent first).

**Validates: Requirements 8.1, 8.5**

### Property 22: Transaction Display Completeness

*For any* transaction in the history, the displayed output should contain all fields: from entity, to entity, amount, timestamp, and description (if present).

**Validates: Requirements 8.2**

### Property 23: Timestamp Human-Readable Formatting

*For any* timestamp, the formatted display should be human-readable (e.g., "Jan 15, 2024 3:45 PM") rather than a raw numeric value.

**Validates: Requirements 8.4**

### Property 24: Transaction Retrieval Completeness

*For any* set of transactions stored in the database, retrieving all transactions should return every stored transaction with no omissions.

**Validates: Requirements 9.2**

### Property 25: Transaction Update Persistence

*For any* transaction, updating any of its fields then retrieving it should return the transaction with the updated values.

**Validates: Requirements 9.3**

### Property 26: Transaction Deletion Removal

*For any* transaction, deleting it then retrieving all transactions should return a list that does not contain the deleted transaction.

**Validates: Requirements 9.4**

## Error Handling

The system implements comprehensive error handling at multiple layers:

### Validation Layer Errors

**Invalid Entity Names:**
- Error code: `INVALID_ENTITY`
- Message: "Entity must be one of: lev, danik, 2masters"
- HTTP status: 400 Bad Request

**Self-Transaction:**
- Error code: `SELF_TRANSACTION`
- Message: "Cannot create transaction from an entity to itself"
- HTTP status: 400 Bad Request

**Invalid Amount:**
- Error code: `INVALID_AMOUNT`
- Message: "Amount must be a positive number"
- HTTP status: 400 Bad Request

**Invalid Timestamp:**
- Error code: `INVALID_TIMESTAMP`
- Message: "Timestamp must be a valid number"
- HTTP status: 400 Bad Request

### Database Layer Errors

**Transaction Not Found:**
- Error code: `NOT_FOUND`
- Message: "Transaction with id {id} not found"
- HTTP status: 404 Not Found

**Database Connection Error:**
- Error code: `DB_ERROR`
- Message: "Database operation failed"
- HTTP status: 500 Internal Server Error

### Error Response Format

All errors follow a consistent JSON structure:

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

## Testing Strategy

The testing strategy employs a dual approach combining unit tests and property-based tests to ensure comprehensive coverage.

### Property-Based Testing

Property-based tests validate universal properties across many generated inputs. Each property from the Correctness Properties section will be implemented as a property-based test.

**Configuration:**
- Library: fast-check (for TypeScript/JavaScript)
- Minimum iterations: 100 per property test
- Each test tagged with: `Feature: debt-tracker-v2, Property {N}: {property_text}`

**Property Test Categories:**

1. **Calculation Properties** (Properties 8-15): Test debt calculation rules with randomly generated amounts
2. **Validation Properties** (Properties 4-7): Test error conditions with randomly generated invalid inputs
3. **Storage Properties** (Properties 1-3, 24-26): Test CRUD operations with randomly generated transactions
4. **Display Properties** (Properties 16-23): Test formatting and display logic with randomly generated data

### Unit Testing

Unit tests focus on specific examples, edge cases, and integration points:

**Specific Examples:**
- Zero debt scenario (transactions that cancel out)
- Single transaction of each type
- UI component rendering with specific data

**Edge Cases:**
- Very large amounts (testing numeric precision)
- Very small amounts (testing rounding)
- Empty transaction history
- Transactions with missing optional fields

**Integration Tests:**
- End-to-end transaction creation flow
- Transaction update and delete flows
- UI interaction flows (entity selection, form submission)

### Test Coverage Goals

- 100% coverage of debt calculation logic
- 100% coverage of validation logic
- 90%+ coverage of UI components
- All 26 correctness properties implemented as property-based tests

### Testing Balance

Property-based tests handle comprehensive input coverage through randomization, while unit tests focus on specific examples and edge cases. Together, they provide both general correctness verification and concrete bug detection.
