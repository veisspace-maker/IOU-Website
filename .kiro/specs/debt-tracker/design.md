# Design Document: Debt Tracker

## Overview

The Debt Tracker system is a complete replacement for the existing personal and company money tracking system. It simplifies financial tracking by focusing solely on debts between two individuals (Lev and Danik) rather than tracking actual money balances.

The key innovation is the "2 Masters" entity - a UI/UX concept representing 50/50 split transactions. When users record transactions involving "2 Masters", the system stores them in their original form but applies 50/50 split logic only during debt calculation. This approach maintains transaction clarity while enabling intuitive shared expense tracking.

The system eliminates all wallet/balance concepts and replaces them with a single net debt calculation that answers one question: "Who owes whom, and how much?"

## Architecture

### System Components

The system follows a three-tier architecture:

1. **Frontend (React/TypeScript)**
   - Transaction entry UI with two-column entity selection
   - Transaction history display
   - Net debt display
   - Transaction edit modal

2. **Backend (Node.js/Express/TypeScript)**
   - REST API for transaction CRUD operations
   - Debt calculation business logic
   - Database access layer

3. **Database (PostgreSQL)**
   - Single `debt_transactions` table
   - No balance or wallet tables

### Data Flow

```
User Input → Frontend Validation → API Request → Backend Validation → Database Storage
                                                         ↓
User Display ← Frontend Update ← API Response ← Debt Calculation ← Database Query
```

## Components and Interfaces

### Database Schema

**debt_transactions table:**
```typescript
{
  id: number (primary key, auto-increment)
  from_entity: 'Lev' | 'Danik' | '2_Masters'
  to_entity: 'Lev' | 'Danik' | '2_Masters'
  amount: decimal(10, 2)
  created_at: timestamp
  updated_at: timestamp
}
```

**Constraints:**
- `from_entity` and `to_entity` must be different
- `amount` must be positive
- Both entity fields must be one of the three valid values

### Backend API Endpoints

**POST /api/debt-transactions**
- Creates a new transaction
- Request body: `{ from: string, to: string, amount: number }`
- Response: Created transaction object
- Validates entity values and ensures from ≠ to

**GET /api/debt-transactions**
- Retrieves all transactions
- Response: Array of transaction objects
- Ordered by created_at descending

**GET /api/debt-transactions/balance**
- Calculates and returns net debt
- Response: `{ debtor: string | null, creditor: string | null, amount: number }`
- Returns null values when debt is zero

**PUT /api/debt-transactions/:id**
- Updates an existing transaction
- Request body: `{ from: string, to: string, amount: number }`
- Response: Updated transaction object
- Validates entity values and ensures from ≠ to

**DELETE /api/debt-transactions/:id**
- Deletes a transaction
- Response: Success confirmation

### Frontend Components

**TransactionEntryForm**
- Two-column layout with entity selection
- Left column: Lev, Danik, 2 Masters (sender)
- Right column: Lev, Danik, 2 Masters (receiver)
- Amount input field
- Submit button
- Implements dimming logic for invalid selections

**TransactionHistory**
- Displays list of transactions in original form
- Format: "From → To: $Amount"
- Shows "2 Masters" when present
- Each transaction has edit and delete buttons
- Ordered chronologically (newest first)

**NetDebtDisplay**
- Shows single calculated debt value
- Format: "[Debtor] owes [Creditor] $[Amount]"
- Updates in real-time after any transaction change
- Shows "No debt" when balance is zero

**TransactionEditModal**
- Same layout as TransactionEntryForm
- Pre-populated with existing transaction data
- Same validation and dimming logic
- Save and cancel buttons

## Data Models

### Transaction Model

```typescript
interface Transaction {
  id: number;
  from: 'Lev' | 'Danik' | '2_Masters';
  to: 'Lev' | 'Danik' | '2_Masters';
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Net Debt Model

```typescript
interface NetDebt {
  debtor: 'Lev' | 'Danik' | null;
  creditor: 'Lev' | 'Danik' | null;
  amount: number;
}
```

### Debt Calculation Algorithm

The debt calculation processes all transactions and produces a single net debt value:

```typescript
function calculateNetDebt(transactions: Transaction[]): NetDebt {
  let levOwes = 0; // Positive means Lev owes Danik
  
  for (const tx of transactions) {
    if (tx.from === 'Lev' && tx.to === 'Danik') {
      levOwes -= tx.amount; // Lev paid Danik
    } else if (tx.from === 'Danik' && tx.to === 'Lev') {
      levOwes += tx.amount; // Danik paid Lev
    } else if (tx.from === 'Lev' && tx.to === '2_Masters') {
      levOwes -= tx.amount / 2; // Lev paid Danik's half
    } else if (tx.from === '2_Masters' && tx.to === 'Lev') {
      levOwes -= tx.amount / 2; // Lev paid Danik's half
    } else if (tx.from === 'Danik' && tx.to === '2_Masters') {
      levOwes += tx.amount / 2; // Danik paid Lev's half
    } else if (tx.from === '2_Masters' && tx.to === 'Danik') {
      levOwes += tx.amount / 2; // Danik paid Lev's half
    }
  }
  
  if (levOwes > 0) {
    return { debtor: 'Lev', creditor: 'Danik', amount: levOwes };
  } else if (levOwes < 0) {
    return { debtor: 'Danik', creditor: 'Lev', amount: -levOwes };
  } else {
    return { debtor: null, creditor: null, amount: 0 };
  }
}
```

### UI Selection Logic

The entity selection implements mutual exclusion:

```typescript
interface SelectionState {
  selectedSender: 'Lev' | 'Danik' | '2_Masters' | null;
  selectedReceiver: 'Lev' | 'Danik' | '2_Masters' | null;
}

function isEntityDisabled(
  entity: 'Lev' | 'Danik' | '2_Masters',
  side: 'sender' | 'receiver',
  state: SelectionState
): boolean {
  if (side === 'sender') {
    // Disable if this entity is selected as receiver
    return state.selectedReceiver === entity;
  } else {
    // Disable if this entity is selected as sender
    return state.selectedSender === entity;
  }
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system - essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Transaction Storage Preserves Original Form

*For any* valid transaction with entities (Lev, Danik, or 2_Masters) and a positive amount, storing the transaction and then retrieving it should return a transaction with identical from, to, and amount values.

**Validates: Requirements 1.1, 1.2, 1.4**

### Property 2: Transaction Schema Completeness

*For any* stored transaction, the transaction object should contain exactly the required fields: id, from entity, to entity, amount, and timestamps, with no additional fields.

**Validates: Requirements 1.3**

### Property 3: Entity Value Validation

*For any* transaction creation or update attempt with an entity value that is not "Lev", "Danik", or "2_Masters", the system should reject the transaction with a validation error.

**Validates: Requirements 1.5**

### Property 4: Same Entity Rejection

*For any* transaction where the from entity equals the to entity, the system should reject the transaction with a validation error.

**Validates: Requirements 2.1, 2.3, 5.3, 5.5**

### Property 5: Debt Calculation Correctness for Direct Transactions

*For any* list of transactions containing only direct Lev ↔ Danik transactions (no 2_Masters), the net debt should equal the sum of (Danik→Lev amounts) minus the sum of (Lev→Danik amounts).

**Validates: Requirements 3.1, 3.2**

### Property 6: Debt Calculation Correctness for 2_Masters Transactions

*For any* transaction involving 2_Masters, the debt contribution should be exactly half the transaction amount, with the sign determined by which person benefits from the split.

**Validates: Requirements 3.3, 3.4, 3.5, 3.6**

### Property 7: Debt Calculation Summation

*For any* list of transactions (including mixed direct and 2_Masters transactions), the net debt should equal the sum of all individual transaction debt contributions.

**Validates: Requirements 3.7**

### Property 8: Debt Calculation Inverse Symmetry

*For any* list of transactions, if we swap all occurrences of "Lev" and "Danik" in the transactions, the resulting net debt should have the same amount but with debtor and creditor swapped.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

### Property 9: Net Debt Display Format

*For any* calculated net debt with a non-zero amount, the display string should contain the debtor's name, the creditor's name, and the amount value.

**Validates: Requirements 3.8, 3.9, 6.2**

### Property 10: Transaction History Display Preserves Entities

*For any* transaction in the history, the displayed string should contain the original from entity, the original to entity, and the amount.

**Validates: Requirements 4.1, 4.2**

### Property 11: Transaction History Display Format

*For any* transaction, the display format should match the pattern "from → to: $amount" with the entities and amount clearly identifiable.

**Validates: Requirements 4.3**

### Property 12: Transaction History Chronological Ordering

*For any* list of transactions retrieved from the system, the transactions should be ordered by creation timestamp in descending order (newest first).

**Validates: Requirements 4.4**

### Property 13: Transaction Edit Retrieval

*For any* existing transaction, retrieving it for editing should return the original transaction data with unchanged from, to, and amount values.

**Validates: Requirements 5.1**

### Property 14: Debt Reflects Current Transaction Set

*For any* sequence of transaction operations (add, update, delete), the calculated net debt should always equal the debt calculated from the current set of transactions in the database.

**Validates: Requirements 5.4, 6.3, 9.2, 9.3**

### Property 15: Single Net Debt Value

*For any* debt calculation, the result should contain exactly one debt value (not multiple separate debts), represented as a single debtor-creditor-amount tuple.

**Validates: Requirements 6.1**

### Property 16: Transaction Deletion Removes Record

*For any* existing transaction, after deletion, attempting to retrieve that transaction by ID should fail, and the transaction should not appear in the transaction list.

**Validates: Requirements 9.1**

## Error Handling

### Validation Errors

The system handles validation errors at multiple levels:

1. **Frontend Validation**
   - Prevents same-entity selection through UI dimming
   - Validates amount is positive before submission
   - Provides immediate user feedback

2. **Backend Validation**
   - Validates entity values are in allowed set
   - Validates from ≠ to
   - Validates amount > 0
   - Returns 400 Bad Request with descriptive error message

3. **Database Constraints**
   - Check constraints on entity columns
   - Check constraint on amount > 0
   - Provides last line of defense

### Error Response Format

```typescript
interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
}
```

### Common Error Scenarios

- **Invalid Entity**: "Entity must be 'Lev', 'Danik', or '2_Masters'"
- **Same Entity**: "From and to entities must be different"
- **Invalid Amount**: "Amount must be a positive number"
- **Transaction Not Found**: "Transaction with ID {id} not found"
- **Database Error**: "An error occurred while processing your request"

## Testing Strategy

### Dual Testing Approach

The system requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Together, these approaches provide comprehensive coverage where unit tests catch concrete bugs and property tests verify general correctness.

### Property-Based Testing

We will use **fast-check** (for TypeScript/JavaScript) as our property-based testing library.

**Configuration:**
- Each property test must run a minimum of 100 iterations
- Each test must be tagged with a comment referencing the design property
- Tag format: `// Feature: debt-tracker, Property {number}: {property_text}`
- Each correctness property must be implemented by a single property-based test

**Example Property Test Structure:**

```typescript
// Feature: debt-tracker, Property 1: Transaction Storage Preserves Original Form
it('should preserve original transaction form in storage', () => {
  fc.assert(
    fc.property(
      fc.record({
        from: fc.constantFrom('Lev', 'Danik', '2_Masters'),
        to: fc.constantFrom('Lev', 'Danik', '2_Masters'),
        amount: fc.float({ min: 0.01, max: 10000 })
      }).filter(tx => tx.from !== tx.to),
      async (transaction) => {
        const created = await createTransaction(transaction);
        const retrieved = await getTransaction(created.id);
        
        expect(retrieved.from).toBe(transaction.from);
        expect(retrieved.to).toBe(transaction.to);
        expect(retrieved.amount).toBeCloseTo(transaction.amount);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing Focus

Unit tests should focus on:

1. **Specific Examples**
   - Test one Lev→Danik transaction results in correct debt
   - Test one Lev→2_Masters transaction results in correct debt
   - Test combination of direct and split transactions

2. **Edge Cases**
   - Zero debt scenario (equal transactions in both directions)
   - Single transaction scenarios
   - Large transaction amounts
   - Many small transactions

3. **Error Conditions**
   - Invalid entity values
   - Same entity for from and to
   - Negative amounts
   - Missing required fields
   - Non-existent transaction IDs

4. **Integration Points**
   - API endpoint responses
   - Database transaction handling
   - Frontend-backend communication

### Test Coverage Goals

- **Backend Business Logic**: 100% coverage of debt calculation functions
- **API Endpoints**: All endpoints tested for success and error cases
- **Frontend Components**: Key user interactions and state management
- **Database Operations**: CRUD operations and constraint enforcement

### Migration Testing

The migration from the old system requires specific validation:

1. **Pre-migration State Verification**
   - Document existing personal_transactions and company_transactions tables
   - Verify old system functionality

2. **Migration Execution**
   - Run migration script
   - Verify no errors during execution

3. **Post-migration State Verification**
   - Verify debt_transactions table exists with correct schema
   - Verify personal_transactions table removed
   - Verify company_transactions table removed
   - Verify no orphaned data or references

4. **Functionality Verification**
   - Test all CRUD operations on new table
   - Test debt calculation with sample data
   - Test UI functionality with new backend
