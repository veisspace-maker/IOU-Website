# Redux Store Documentation

## Overview

The Redux store manages global application state for the Company Tracker application. It uses Redux Toolkit for simplified state management.

## Store Structure

The store is organized into the following slices:

### 1. User Slice (`userSlice.ts`)
Manages user authentication and user list state.

**State:**
- `currentUser`: The currently authenticated user
- `users`: List of all users in the system
- `loading`: Loading state for user operations
- `error`: Error message if any

**Actions:**
- `setCurrentUser(user)`: Set the current authenticated user
- `setUsers(users)`: Set the list of all users
- `setLoading(boolean)`: Set loading state
- `setError(string)`: Set error message

### 2. Transactions Slice (`transactionsSlice.ts`)
Manages money transactions and net balances.

**State:**
- `transactions`: List of all transactions
- `netBalances`: Calculated net balances between users
- `loading`: Loading state
- `error`: Error message

**Actions:**
- `setTransactions(transactions)`: Set all transactions
- `addTransaction(transaction)`: Add a new transaction
- `updateTransaction(transaction)`: Update an existing transaction
- `deleteTransaction(id)`: Delete a transaction
- `setNetBalances(balances)`: Set calculated net balances
- `setLoading(boolean)`: Set loading state
- `setError(string)`: Set error message

### 3. Leave Slice (`leaveSlice.ts`)
Manages employee leave records.

**State:**
- `leaveRecords`: List of all leave records
- `loading`: Loading state
- `error`: Error message

**Actions:**
- `setLeaveRecords(records)`: Set all leave records
- `addLeaveRecord(record)`: Add a new leave record
- `updateLeaveRecord(record)`: Update an existing leave record
- `deleteLeaveRecord(id)`: Delete a leave record
- `setLoading(boolean)`: Set loading state
- `setError(string)`: Set error message

### 4. Holidays Slice (`holidaysSlice.ts`)
Manages public holidays.

**State:**
- `holidays`: List of all public holidays
- `loading`: Loading state
- `error`: Error message

**Actions:**
- `setHolidays(holidays)`: Set all holidays
- `addHoliday(holiday)`: Add a new holiday
- `updateHoliday(holiday)`: Update an existing holiday
- `deleteHoliday(id)`: Delete a holiday
- `setLoading(boolean)`: Set loading state
- `setError(string)`: Set error message

### 5. Closed Dates Slice (`closedDatesSlice.ts`)
Manages company closure periods.

**State:**
- `closedDates`: List of all closed date periods
- `loading`: Loading state
- `error`: Error message

**Actions:**
- `setClosedDates(dates)`: Set all closed dates
- `addClosedDate(date)`: Add a new closed date period
- `updateClosedDate(date)`: Update an existing closed date period
- `deleteClosedDate(id)`: Delete a closed date period
- `setLoading(boolean)`: Set loading state
- `setError(string)`: Set error message

### 6. Birthdays Slice (`birthdaysSlice.ts`)
Manages employee birthdays.

**State:**
- `birthdays`: List of all birthday records
- `loading`: Loading state
- `error`: Error message

**Actions:**
- `setBirthdays(birthdays)`: Set all birthdays
- `addBirthday(birthday)`: Add a new birthday
- `updateBirthday(birthday)`: Update an existing birthday
- `deleteBirthday(id)`: Delete a birthday
- `setLoading(boolean)`: Set loading state
- `setError(string)`: Set error message

## Usage

### Accessing State

Use the custom hooks from `hooks.ts`:

```typescript
import { useAppSelector, useAppDispatch } from '../store/hooks';

function MyComponent() {
  // Access state
  const transactions = useAppSelector(state => state.transactions.transactions);
  const users = useAppSelector(state => state.user.users);
  
  // Get dispatch function
  const dispatch = useAppDispatch();
  
  // Dispatch actions
  dispatch(setTransactions(newTransactions));
}
```

### Dispatching Actions

```typescript
import { useAppDispatch } from '../store/hooks';
import { addTransaction } from '../store/slices/transactionsSlice';

function MyComponent() {
  const dispatch = useAppDispatch();
  
  const handleAddTransaction = (transaction) => {
    dispatch(addTransaction(transaction));
  };
}
```

### Example: Fetching and Storing Data

```typescript
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setTransactions, setLoading, setError } from '../store/slices/transactionsSlice';
import axios from 'axios';

function TransactionList() {
  const dispatch = useAppDispatch();
  const { transactions, loading, error } = useAppSelector(state => state.transactions);
  
  useEffect(() => {
    const fetchTransactions = async () => {
      dispatch(setLoading(true));
      try {
        const response = await axios.get('/api/transactions', { withCredentials: true });
        dispatch(setTransactions(response.data));
        dispatch(setError(null));
      } catch (err) {
        dispatch(setError('Failed to fetch transactions'));
      } finally {
        dispatch(setLoading(false));
      }
    };
    
    fetchTransactions();
  }, [dispatch]);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {transactions.map(t => (
        <div key={t.id}>{t.amount}</div>
      ))}
    </div>
  );
}
```

## Integration

The Redux store is integrated into the application in `App.tsx`:

```typescript
import { Provider } from 'react-redux';
import { store } from './store';

function App() {
  return (
    <Provider store={store}>
      {/* Rest of app */}
    </Provider>
  );
}
```

## Benefits

1. **Centralized State**: All application state is in one place
2. **Predictable Updates**: State changes through dispatched actions
3. **DevTools Support**: Redux DevTools for debugging
4. **Type Safety**: Full TypeScript support
5. **Reactive Updates**: Components automatically re-render when state changes
6. **Data Consistency**: Single source of truth for all data

## Future Enhancements

Components can be gradually migrated to use Redux instead of local state and prop drilling. This will:
- Reduce prop drilling
- Improve performance with selective re-renders
- Enable better data consistency across views
- Simplify state management in complex components
