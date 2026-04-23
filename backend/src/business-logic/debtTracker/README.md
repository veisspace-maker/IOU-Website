# Debt Tracker V2 - Business Logic

This directory contains the core business logic for the Debt Tracker V2 system.

## Overview

The Debt Tracker V2 is a transaction-based debt tracking system that stores raw transactions and derives net debt through calculation. The system handles three entities (Lev, Danik, and 2Masters) and applies specific rules to calculate who owes whom.

## Components

### Types (`../../types/debtTrackerV2.ts`)
- `Entity`: Type union for the three participants ('lev' | 'danik' | '2masters')
- `Transaction`: Interface for raw money movements between entities
- `DebtResult`: Interface for calculated net debt results
- `ValidationResult`: Interface for transaction validation outcomes

### Modules (to be implemented)
- `transactionValidator.ts`: Validates transaction data before storage
- `debtCalculator.ts`: Calculates net debt from transaction history

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
- Feature name: `debt-tracker-v2`
- Property number and description from the design document

Example:
```typescript
/**
 * Feature: debt-tracker-v2, Property 8: Direct Transaction Debt Calculation (Lev to Danik)
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
npm test -- debtTrackerV2

# Run tests in watch mode
npm run test:watch
```

## Design Principles

1. **Store Raw Data**: Store exactly what the user inputs without conversion
2. **Calculate on Query**: Apply calculation rules at query time to determine net debt
3. **Validate Early**: Validate all inputs before storage
4. **Test Comprehensively**: Use both property-based tests and unit tests for coverage
