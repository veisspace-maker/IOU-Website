# Sales Tracker

A comprehensive sales transaction management system with item-level analytics and seller attribution.

## Overview

The Sales Tracker allows you to record and analyze sales transactions with detailed item tracking, quantity management, and seller attribution. It automatically integrates with the Debt Tracker to maintain accurate financial records.

## Features

### Transaction Management
- Create, edit, and delete sales transactions
- Track item name, price per unit, quantity, and date
- Add optional descriptions for context
- Assign transactions to sellers (Leva or Danik)
- Automatic pagination (50 transactions per page)

### Analytics & Reporting
- Item-level statistics and breakdowns
- Total revenue calculations
- Quantity tracking per item
- Average price analysis
- Seller performance metrics
- Drill-down views for detailed insights

### Smart Features
- Case-insensitive item name grouping
- Automatic debt transaction creation on sale
- Default quantity of 1 for quick entry
- Date-based sorting (newest first)
- Real-time statistics updates

## User Interface

### Main Page Tabs
1. **Transactions Tab**: View and manage all sales transactions
2. **Stats Tab**: View analytics and item breakdowns

### Transaction List
- Displays all sales in reverse chronological order
- Shows: Item, Price, Quantity, Total, Date, Seller, Description
- Edit and delete buttons for each transaction
- Swipe-to-delete on mobile devices
- Scroll position preservation during updates

### Add Transaction Form
- Item name (required)
- Price per unit (required, must be > 0)
- Quantity (defaults to 1)
- Date (defaults to today)
- Seller selection (Leva or Danik)
- Optional description field

### Statistics View
- Summary cards showing:
  - Total revenue
  - Total items sold
  - Average transaction value
  - Number of unique items
- Item breakdown table with:
  - Item name
  - Total quantity sold
  - Total revenue
  - Average price per unit
  - Number of transactions

## Data Model

```typescript
SalesTransaction {
  id: string              // UUID
  item: string            // Item name
  price: number           // Price per unit (AUD)
  quantity: number        // Quantity sold (default: 1)
  date: string            // Date in YYYY-MM-DD format
  description?: string    // Optional description
  seller: string          // 'leva' or 'danik'
  createdBy: string       // User ID who created the transaction
  createdAt?: Date        // Timestamp of creation
}
```

## API Endpoints

### GET /api/sales
List sales transactions with pagination.

**Query Parameters:**
- `limit` (optional): Number of records per page (default: 50, max: 1000)
- `offset` (optional): Number of records to skip (default: 0)

**Response:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "item": "Coffee",
      "price": 4.50,
      "quantity": 2,
      "date": "2026-04-23",
      "description": "Morning sales",
      "seller": "leva",
      "createdBy": "user-uuid",
      "createdAt": "2026-04-23T10:30:00Z"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

### POST /api/sales
Create a new sales transaction.

**Request Body:**
```json
{
  "item": "Coffee",
  "price": 4.50,
  "quantity": 2,
  "date": "2026-04-23",
  "description": "Morning sales",
  "seller": "leva"
}
```

**Response:**
```json
{
  "transaction": { /* transaction object */ },
  "message": "Sales transaction created successfully"
}
```

### PUT /api/sales/:id
Update an existing sales transaction.

**Request Body:** Same as POST

**Response:**
```json
{
  "transaction": { /* updated transaction */ },
  "message": "Sales transaction updated successfully"
}
```

### DELETE /api/sales/:id
Delete a sales transaction.

**Response:**
```json
{
  "message": "Sales transaction deleted successfully"
}
```

## Business Logic

### Item Normalization
Items are normalized for grouping and filtering:
- Converted to lowercase
- Trimmed of whitespace
- Grouped together regardless of case variations

Example: "Coffee", "coffee", and "COFFEE" are treated as the same item.

### Automatic Debt Integration
When a sale is created:
1. A corresponding debt transaction is automatically created
2. The transaction records money flow from the buyer to the seller
3. This maintains accurate debt balances between Lev and Danik

### Statistics Calculation
- **Total Revenue**: Sum of (price × quantity) for all transactions
- **Total Items Sold**: Sum of all quantities
- **Average Transaction**: Total revenue ÷ number of transactions
- **Item Statistics**: Aggregated by normalized item name

## Validation Rules

1. **Item**: Required, non-empty string
2. **Price**: Required, must be > 0
3. **Quantity**: Must be a positive integer (defaults to 1)
4. **Date**: Must be a valid date in YYYY-MM-DD format
5. **Seller**: Must be either 'leva' or 'danik'
6. **Description**: Optional, can be empty

## Testing

### Unit Tests
- `AddSalesTransactionForm.test.tsx`: Form validation and submission
- `SalesTransactionList.test.tsx`: List rendering and interactions
- `salesApi.test.ts`: API client functionality
- `SalesPage.test.tsx`: Page integration
- `salesCalculations.test.ts`: Business logic calculations

### Property-Based Tests
- `SalesTransactionList.pbt.test.tsx`: List behavior with random data
- `salesUtils.pbt.test.ts`: Utility function edge cases

## Mobile Responsiveness

- Touch-friendly buttons and forms
- Swipe gestures for delete actions
- Responsive table layouts
- Optimized for screens 320px and up
- Stack layout on small screens

## Performance Optimizations

- Pagination to limit data transfer
- Scroll position preservation
- Debounced search/filter inputs
- Memoized calculations
- Efficient re-rendering with React keys

## Common Use Cases

### Recording a Sale
1. Navigate to Sales page
2. Fill in item name and price
3. Adjust quantity if needed (defaults to 1)
4. Select seller
5. Add optional description
6. Click "Add Transaction"

### Viewing Item Performance
1. Navigate to Sales page
2. Click "Stats" tab
3. View summary cards for overview
4. Check item breakdown table for details
5. Click item name for drill-down view

### Editing a Transaction
1. Find transaction in list
2. Click edit icon
3. Modify fields as needed
4. Click "Save"

### Filtering by Item
1. Use item filter dropdown
2. Select item name
3. View filtered transactions
4. Clear filter to see all

## Database Schema

```sql
CREATE TABLE sales_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  date DATE NOT NULL,
  description TEXT,
  seller VARCHAR(50) NOT NULL CHECK (seller IN ('leva', 'danik')),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sales_date ON sales_transactions(date DESC);
CREATE INDEX idx_sales_seller ON sales_transactions(seller);
CREATE INDEX idx_sales_item ON sales_transactions(LOWER(item));
```

## Future Enhancements

- Export to CSV/Excel with custom date ranges
- Advanced date range filtering
- Seller comparison reports and analytics
- Profit margin tracking and analysis
- Inventory integration
- Receipt photo attachments
- Bulk import functionality from CSV
- Advanced analytics dashboard with charts
- Sales forecasting
- Customer tracking
- Discount and promotion tracking
- Tax calculation and reporting
