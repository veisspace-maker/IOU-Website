# Design Document: Sales Tracker

## Overview

The Sales Tracker is a full-stack feature that enables users to record, view, filter, and analyze sales transactions. The system consists of:

- **Backend**: Database schema, API endpoints, and business logic for CRUD operations
- **Frontend**: React-based UI with transaction management and statistical analysis views
- **Shared Access Model**: All users can view and modify all sales data

The design reuses existing patterns from the Money Tracker feature, adapting components and UI patterns for sales-specific use cases while maintaining visual and interaction consistency.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
├─────────────────────────────────────────────────────────┤
│  Navigation Bar (Sales link)                            │
│  ├─ Sales Page                                          │
│  │  ├─ Transactions Tab                                 │
│  │  │  ├─ Item Filter Dropdown                          │
│  │  │  ├─ Transaction List                              │
│  │  │  └─ Add/Edit/Delete Controls                      │
│  │  └─ Stats Tab                                        │
│  │     ├─ Overall Stats Cards                           │
│  │     ├─ Item Breakdown Table                          │
│  │     └─ Drill-Down Detail View                        │
└─────────────────────────────────────────────────────────┘
                          │
                    HTTP/REST API
                          │
┌─────────────────────────────────────────────────────────┐
│                    Backend (Node.js)                     │
├─────────────────────────────────────────────────────────┤
│  API Routes                                             │
│  ├─ GET    /api/sales                                   │
│  ├─ POST   /api/sales                                   │
│  ├─ PUT    /api/sales/:id                               │
│  └─ DELETE /api/sales/:id                               │
│                                                          │
│  Business Logic                                         │
│  ├─ Transaction CRUD operations                         │
│  ├─ Item normalization (trim + lowercase)              │
│  └─ Statistics calculation                              │
└─────────────────────────────────────────────────────────┘
                          │
                      Database
                          │
┌─────────────────────────────────────────────────────────┐
│                  Database (SQLite/Postgres)              │
├─────────────────────────────────────────────────────────┤
│  sales_transactions table                               │
│  ├─ id: string (UUID)                                   │
│  ├─ item: string                                        │
│  ├─ price: number                                       │
│  ├─ date: string                                        │
│  ├─ description: string (nullable)                      │
│  └─ createdBy: string (userId)                          │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Create Transaction**: User submits form → Frontend validates → POST /api/sales → Backend trims item name → Insert to DB → Return new transaction
2. **View Transactions**: Page loads → GET /api/sales → Backend queries DB → Return all transactions → Frontend renders list
3. **Filter Transactions**: User selects filter → Frontend extracts unique items → Filters locally using normalized comparison
4. **Update Transaction**: User edits → PUT /api/sales/:id → Backend trims item name → Update DB → Return updated transaction
5. **Delete Transaction**: User deletes → DELETE /api/sales/:id → Backend removes from DB → Return success
6. **View Stats**: User switches to Stats tab → Frontend calculates from loaded transactions → Renders aggregated data
7. **Drill Down**: User clicks item → Frontend filters transactions by normalized item name → Displays filtered list

## Components and Interfaces

### Backend Components

#### Database Schema

```typescript
// sales_transactions table
interface SalesTransaction {
  id: string;              // UUID v4
  item: string;            // Product/service name (trimmed)
  price: number;           // Sale amount
  date: string;            // ISO 8601 date string
  description: string | null;  // Optional details
  createdBy: string;       // User ID who created the record
}
```

#### API Endpoints

**GET /api/sales**
- Returns: Array of all SalesTransaction objects
- Status: 200 OK
- No query parameters (returns all sales)

**POST /api/sales**
- Request Body:
  ```typescript
  {
    item: string;
    price: number;
    date: string;
    description?: string;
  }
  ```
- Returns: Created SalesTransaction object
- Status: 201 Created
- Behavior: Generates UUID, trims item name, adds createdBy from auth context

**PUT /api/sales/:id**
- Request Body:
  ```typescript
  {
    item: string;
    price: number;
    date: string;
    description?: string;
  }
  ```
- Returns: Updated SalesTransaction object
- Status: 200 OK
- Behavior: Trims item name, preserves id and createdBy

**DELETE /api/sales/:id**
- Returns: Success message
- Status: 200 OK
- Behavior: Removes transaction from database

#### Business Logic Functions

```typescript
// Item normalization for comparison and grouping
function normalizeItem(item: string): string {
  return item.trim().toLowerCase();
}

// Calculate statistics for all items
function calculateItemStats(transactions: SalesTransaction[]): ItemStats[] {
  const grouped = groupBy(transactions, t => normalizeItem(t.item));
  
  return Object.entries(grouped).map(([normalizedItem, txns]) => ({
    item: txns[0].item, // Use original casing from first occurrence
    totalRevenue: txns.reduce((sum, t) => sum + t.price, 0),
    count: txns.length,
    transactions: txns
  })).sort((a, b) => b.totalRevenue - a.totalRevenue);
}

// Filter transactions by item
function filterByItem(transactions: SalesTransaction[], filterItem: string): SalesTransaction[] {
  if (filterItem === 'All') return transactions;
  
  const normalized = normalizeItem(filterItem);
  return transactions.filter(t => normalizeItem(t.item) === normalized);
}
```

### Frontend Components

#### Component Hierarchy

```
SalesPage
├─ TabNavigation
│  ├─ TransactionsTab
│  │  ├─ ItemFilter (dropdown)
│  │  ├─ TransactionList (adapted from TransactionHistory.tsx)
│  │  │  └─ TransactionItem (shows item, price, date, description)
│  │  └─ AddTransactionForm
│  └─ StatsTab
│     ├─ OverallStatsCards (adapted from MoneySummaryCards.tsx)
│     │  ├─ TotalRevenueCard
│     │  └─ TotalItemsSoldCard
│     ├─ ItemBreakdownTable
│     │  └─ ItemRow (clickable for drill-down)
│     └─ DrillDownView (conditional render)
│        ├─ ItemDetailHeader
│        └─ FilteredTransactionList
```

#### Key Component Interfaces

```typescript
// Main page component
interface SalesPageProps {
  // No props - fetches data internally
}

interface SalesPageState {
  transactions: SalesTransaction[];
  activeTab: 'transactions' | 'stats';
  selectedFilter: string;
  drillDownItem: string | null;
  loading: boolean;
  error: string | null;
}

// Transaction list component
interface TransactionListProps {
  transactions: SalesTransaction[];
  onEdit: (id: string, updates: Partial<SalesTransaction>) => void;
  onDelete: (id: string) => void;
}

// Stats components
interface OverallStatsProps {
  totalRevenue: number;
  totalItemsSold: number;
}

interface ItemStats {
  item: string;
  totalRevenue: number;
  count: number;
  transactions: SalesTransaction[];
}

interface ItemBreakdownProps {
  itemStats: ItemStats[];
  onItemClick: (item: string) => void;
}

interface DrillDownViewProps {
  item: string;
  stats: ItemStats;
  onClose: () => void;
}
```

#### Component Reuse Strategy

**From Money Tracker:**
- `TransactionHistory.tsx` → Adapt to `SalesTransactionList.tsx`
  - Change fields: amount → price, category → item
  - Keep: date display, edit/delete controls, list layout
  
- `MoneySummaryCards.tsx` → Adapt to `SalesStatsCards.tsx`
  - Change metrics: balance/income/expenses → total revenue/items sold
  - Keep: card layout, styling, responsive grid

**New Components:**
- `ItemFilter.tsx` - Dropdown with dynamic options from data
- `ItemBreakdownTable.tsx` - Table showing per-item statistics
- `DrillDownView.tsx` - Detailed view for single item analysis

## Data Models

### Core Data Model

```typescript
interface SalesTransaction {
  id: string;              // UUID v4, generated on creation
  item: string;            // Product/service name, stored with original casing
  price: number;           // Positive number, sale amount
  date: string;            // ISO 8601 date string (YYYY-MM-DD)
  description: string | null;  // Optional additional details
  createdBy: string;       // User ID from authentication context
}
```

### Derived Data Models

```typescript
// For statistics calculation
interface ItemStats {
  item: string;            // Original item name (first occurrence casing)
  totalRevenue: number;    // Sum of all prices for this item
  count: number;           // Number of transactions for this item
  transactions: SalesTransaction[];  // All transactions for this item
}

// For overall statistics
interface OverallStats {
  totalRevenue: number;    // Sum of all transaction prices
  totalItemsSold: number;  // Count of all transactions
}

// For filter options
interface FilterOption {
  value: string;           // Item name or "All"
  label: string;           // Display text
}
```

### Data Validation Rules

**Item Name:**
- Required (non-empty after trimming)
- Stored with original casing
- Trimmed on input (leading/trailing whitespace removed)
- Normalized for comparison (trim + lowercase)

**Price:**
- Required
- Must be a valid number
- Should be positive (business rule)

**Date:**
- Required
- Must be valid ISO 8601 date string
- Format: YYYY-MM-DD

**Description:**
- Optional
- Can be null or empty string
- No length restrictions

**ID:**
- Generated by system (UUID v4)
- Immutable after creation

**CreatedBy:**
- Set by system from auth context
- Immutable after creation

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I've identified several areas where properties can be consolidated:

**Redundancy Analysis:**
- Properties 1.4 and 4.2 both test whitespace trimming (on create vs update) → Can be combined into one property about input normalization
- Properties 7.2 and 7.3 both test per-item aggregation (revenue vs count) → Can be combined into one comprehensive property
- Properties 8.1, 8.2, and 8.3 all test drill-down display → Can be combined into one property about drill-down correctness
- Properties 1.1, 1.3, and 1.5 all test transaction creation → Can be combined into one property about creation invariants
- Properties 3.4 and 3.5 both test filtering with normalization → 3.5 is the underlying mechanism for 3.4, can combine

**Consolidated Properties:**
The following properties represent the unique, non-redundant correctness guarantees:

Property 1: Transaction Creation Invariants
*For any* valid transaction input (item, price, date, optional description), creating a transaction should result in a stored record with a unique UUID, the trimmed item name, all provided fields, and the creating user's ID.
**Validates: Requirements 1.1, 1.3, 1.4, 1.5**

Property 2: Optional Field Preservation
*For any* transaction, if a description is provided it should be stored and retrievable, and if not provided it should be null.
**Validates: Requirements 1.2**

Property 3: Transaction Retrieval Completeness
*For any* set of transactions created by different users, retrieving all transactions should return every transaction regardless of who created it.
**Validates: Requirements 2.2**

Property 4: Transaction Display Completeness
*For any* transaction, the rendered display should contain the item name, price, date, and description (if present).
**Validates: Requirements 2.1**

Property 5: Dynamic Filter Generation
*For any* set of transactions, the generated filter options should include "All" as the first option, followed by exactly the unique item names present in the data (using normalized comparison).
**Validates: Requirements 3.1, 3.2**

Property 6: Filter Behavior Correctness
*For any* set of transactions and any filter selection, selecting "All" should return all transactions, and selecting a specific item should return only transactions where the normalized item name matches.
**Validates: Requirements 3.3, 3.4, 3.5**

Property 7: Item Normalization Consistency
*For any* two item names that differ only in whitespace or casing, they should be treated as identical for filtering, grouping, and comparison purposes.
**Validates: Requirements 3.5, 7.1**

Property 8: Transaction Update Preservation
*For any* existing transaction, updating its fields should modify the item (trimmed), price, date, and description, while preserving the original id and createdBy values.
**Validates: Requirements 4.1, 4.2, 4.3**

Property 9: Transaction Deletion Completeness
*For any* transaction, deleting it should remove it from the database such that subsequent queries do not return it.
**Validates: Requirements 5.1**

Property 10: Cross-User Deletion Permission
*For any* transaction created by user A, user B should be able to successfully delete it.
**Validates: Requirements 5.2**

Property 11: Overall Statistics Accuracy
*For any* set of transactions, the total revenue should equal the sum of all prices, and the total items sold should equal the count of all transactions.
**Validates: Requirements 6.1, 6.2**

Property 12: Per-Item Statistics Accuracy
*For any* set of transactions, grouping by normalized item name should produce statistics where each item's total revenue equals the sum of matching transaction prices, and each item's count equals the number of matching transactions.
**Validates: Requirements 7.1, 7.2, 7.3**

Property 13: Item Breakdown Sorting
*For any* set of item statistics, they should be sorted in descending order by total revenue.
**Validates: Requirements 7.4**

Property 14: Drill-Down Correctness
*For any* item in the stats view, clicking it should display that item's total revenue, transaction count, and all transactions matching the normalized item name.
**Validates: Requirements 8.1, 8.2, 8.3**

Property 15: Schema Compliance
*For any* stored transaction, it should have fields id (UUID string), item (string), price (number), date (string), description (string or null), and createdBy (string).
**Validates: Requirements 9.2**

Property 16: Persistence Immediacy
*For any* create, update, or delete operation, the change should be immediately reflected in subsequent database queries.
**Validates: Requirements 9.3**

Property 17: API Response Correctness
*For any* API endpoint call, the response should include appropriate HTTP status codes (200/201 for success, 4xx/5xx for errors) and properly formatted response data.
**Validates: Requirements 10.5**

### Edge Cases and Examples

The following are specific examples or edge cases that should be tested with unit tests rather than property-based tests:

- Empty transaction list should display appropriately
- Filter with no matching items should show empty list
- API endpoints exist at correct paths (GET /api/sales, POST /api/sales, PUT /api/sales/:id, DELETE /api/sales/:id)
- Navigation item appears in correct position
- Tab interface has exactly two tabs labeled "Transactions" and "Stats"
- Drill-down view can be closed/dismissed

## Error Handling

### Backend Error Scenarios

**Invalid Input Validation:**
- Missing required fields (item, price, date) → Return 400 Bad Request with error message
- Invalid price (non-numeric, negative) → Return 400 Bad Request with error message
- Invalid date format → Return 400 Bad Request with error message
- Empty item name after trimming → Return 400 Bad Request with error message

**Resource Not Found:**
- PUT/DELETE with non-existent transaction ID → Return 404 Not Found with error message

**Database Errors:**
- Database connection failure → Return 500 Internal Server Error with generic message
- Constraint violations → Return 500 Internal Server Error with generic message
- Query timeout → Return 500 Internal Server Error with generic message

**Authentication Errors:**
- Missing or invalid auth token → Return 401 Unauthorized
- Unable to extract user ID from auth context → Return 401 Unauthorized

### Frontend Error Scenarios

**Network Errors:**
- API request timeout → Display error toast: "Request timed out. Please try again."
- Network unavailable → Display error toast: "Network error. Please check your connection."
- Server error (5xx) → Display error toast: "Server error. Please try again later."

**Validation Errors:**
- Empty item name → Show inline error: "Item name is required"
- Invalid price → Show inline error: "Price must be a valid number"
- Invalid date → Show inline error: "Please select a valid date"

**Data Errors:**
- Empty transaction list → Display message: "No sales transactions yet. Add your first sale!"
- Filter returns no results → Display message: "No transactions found for this item."
- Failed to load data → Display error banner with retry button

**User Experience:**
- All errors should be user-friendly (no technical jargon)
- Provide actionable guidance when possible
- Use toast notifications for transient errors
- Use inline validation for form errors
- Use error banners for critical failures

## Testing Strategy

### Dual Testing Approach

The Sales Tracker will use both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of correct behavior
- Edge cases (empty lists, single items, boundary conditions)
- Error conditions and validation
- Integration points between components
- UI structure and navigation

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Invariants that must always be maintained
- Business logic correctness across diverse scenarios

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

**Library Selection:**
- **Backend (TypeScript/Node.js)**: Use `fast-check` library
- **Frontend (React/TypeScript)**: Use `fast-check` library with React Testing Library

**Test Configuration:**
- Each property test must run minimum 100 iterations
- Each test must be tagged with a comment referencing the design property
- Tag format: `// Feature: sales-tracker, Property {number}: {property_text}`
- Each correctness property must be implemented by a single property-based test

**Example Property Test Structure:**

```typescript
// Feature: sales-tracker, Property 1: Transaction Creation Invariants
test('creating transaction produces record with UUID, trimmed item, all fields, and user ID', () => {
  fc.assert(
    fc.property(
      fc.record({
        item: fc.string().filter(s => s.trim().length > 0),
        price: fc.float({ min: 0.01 }),
        date: fc.date().map(d => d.toISOString().split('T')[0]),
        description: fc.option(fc.string(), { nil: null })
      }),
      async (input) => {
        const result = await createTransaction(input);
        
        expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        expect(result.item).toBe(input.item.trim());
        expect(result.price).toBe(input.price);
        expect(result.date).toBe(input.date);
        expect(result.description).toBe(input.description);
        expect(result.createdBy).toBeDefined();
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing Strategy

**Backend Unit Tests:**
- API endpoint integration tests (request/response validation)
- Database operations (CRUD operations)
- Input validation and error handling
- Business logic functions (normalization, filtering, statistics)

**Frontend Unit Tests:**
- Component rendering with various props
- User interactions (clicks, form submissions)
- State management and updates
- Filter and drill-down behavior
- Error display and handling

**Integration Tests:**
- End-to-end API flows (create → read → update → delete)
- Frontend-backend integration
- Navigation and routing
- Tab switching and state preservation

### Test Coverage Goals

- Minimum 80% code coverage for backend
- Minimum 70% code coverage for frontend
- 100% coverage of all correctness properties
- All error scenarios tested
- All edge cases covered by unit tests
