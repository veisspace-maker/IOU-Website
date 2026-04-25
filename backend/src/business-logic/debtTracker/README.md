# Debt Tracker - Business Logic

This directory contains the core business logic for the Debt Tracker system.

## Overview

The Debt Tracker is a transaction-based debt tracking system that stores raw transactions in their original form and derives net debt through calculation. The system handles three entities (Lev, Danik, and 2masters) and applies specific 50/50 split rules to calculate who owes whom.

**Key Principle**: Transactions are stored exactly as entered (preserving "2masters" entity), and the 50/50 split logic is applied only during debt calculation, not during storage.

## Components

### Types (`../../types/debtTracker.ts`)
- `Entity`: Type union for the three participants ('lev' | 'danik' | '2masters')
- `Transaction`: Interface for raw money movements between entities
- `DebtResult`: Interface for calculated net debt results
- `ValidationResult`: Interface for transaction validation outcomes

### Implemented Modules
- `TransactionValidator.ts`: Validates transaction data before storage
  - Validates entity names (must be 'lev', 'danik', or '2masters')
  - Prevents self-transactions (from and to must be different)
  - Validates amounts (must be positive)
  - Validates timestamps (cannot be in the future)
- `DebtCalculator.ts`: Calculates net debt from transaction history
  - Handles direct transactions (Lev ↔ Danik)
  - Handles split transactions (involving 2masters with 50/50 logic)
  - Returns debtor, creditor, and amount
- `formatters.ts`: Utility functions for formatting entities and currency
  - `formatEntityName()`: Capitalizes entity names for display
  - `formatCurrency()`: Formats amounts as AUD currency

## Testing Strategy

### Property-Based Testing Configuration

All property-based tests use **fast-check** with the following configuration:

```typescript
await fc.assert(
  fc.asyncProperty(
    // ... arbitraries ...
    async (inputs) => {
      // ... test logic ...
    }
  ),
  { numRuns: 100 }  // Minimum 100 iterations per property test
);
```

### Test Tagging Convention

Each property-based test is tagged with:
- Feature name: `debt-tracker`
- Property number and description from the design document

Example:
```typescript
/**
 * Feature: debt-tracker, Property 8: Direct Transaction Debt Calculation (Lev to Danik)
 * 
 * **Validates: Requirements 3.1**
 * 
 * For any positive amount X, when a transaction from "lev" to "danik" exists,
 * the calculated debt should show that Danik owes Lev exactly X.
 */
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- DebtCalculator

# Run tests in watch mode
npm run test:watch
```

## Integration with Sales Tracker

The Debt Tracker automatically receives transactions from the Sales Tracker:
- When a sale is recorded, a debt transaction is created: `2masters → seller`
- The total sale amount (price × quantity) becomes the transaction amount
- The debt description includes sale details for traceability
- This represents that the seller received company money (including the other person's 50% share)
- The 50/50 split logic in `DebtCalculator` determines the actual debt owed

## Design Principles

1. **Store Raw Data**: Store exactly what the user inputs without conversion
2. **Calculate on Query**: Apply calculation rules at query time to determine net debt
3. **Validate Early**: Validate all inputs before storage
4. **Test Comprehensively**: Use both property-based tests and unit tests for coverage
