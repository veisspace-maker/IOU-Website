import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import DebtTrackerPage from './DebtTrackerPage';
import { AuthProvider } from '../contexts/AuthContext';
import * as debtTrackerApi from '../api/debtTrackerApi';

// Mock the API module
vi.mock('../api/debtTrackerApi');

// Mock the child components
vi.mock('../components/TransactionForm', () => ({
  default: ({ onTransactionCreated }: any) => (
    <div data-testid="transaction-form">
      <button onClick={onTransactionCreated}>Create Transaction</button>
    </div>
  ),
}));

vi.mock('../components/DebtDisplay', () => ({
  default: ({ refreshTrigger }: any) => (
    <div data-testid="debt-display">
      Refresh Trigger: {refreshTrigger}
    </div>
  ),
}));

vi.mock('../components/TransactionHistory', () => ({
  default: ({
    transactions,
    loading,
    error,
    onTransactionUpdate,
    onEdit,
  }: any) => (
    <div data-testid="transaction-history">
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {transactions.map((t: any) => (
        <div key={t.id}>
          Transaction {t.id}
          <button onClick={() => onEdit(t)}>Edit</button>
          <button onClick={onTransactionUpdate}>Update</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../components/EditTransactionDialog', () => ({
  default: ({
    open,
    transaction,
    onClose,
    onTransactionUpdated,
  }: any) => {
    if (!open) return null;
    return (
      <div data-testid="edit-dialog">
        Editing: {transaction?.id}
        <button onClick={onClose}>Close</button>
        <button onClick={onTransactionUpdated}>Save</button>
      </div>
    );
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockGetDebtTransactions = vi.mocked(debtTrackerApi.getDebtTransactions);

describe('DebtTrackerPage', () => {
  const mockTransactions = [
    {
      id: '1',
      from: 'lev' as const,
      to: 'danik' as const,
      amount: 100,
      timestamp: Date.now(),
      description: 'Test transaction 1',
    },
    {
      id: '2',
      from: 'danik' as const,
      to: '2masters' as const,
      amount: 50,
      timestamp: Date.now(),
      description: 'Test transaction 2',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDebtTransactions.mockResolvedValue(mockTransactions);
  });

  const renderPage = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <DebtTrackerPage />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  test('renders all main components', async () => {
    renderPage();

    // Wait for transactions to load
    await waitFor(() => {
      expect(screen.getByTestId('transaction-form')).toBeInTheDocument();
    });

    expect(screen.getByTestId('debt-display')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-history')).toBeInTheDocument();
  });

  test('fetches transactions on mount', async () => {
    renderPage();

    await waitFor(() => {
      expect(mockGetDebtTransactions).toHaveBeenCalledTimes(1);
    });
  });

  test('displays transactions in history', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Transaction 1')).toBeInTheDocument();
      expect(screen.getByText('Transaction 2')).toBeInTheDocument();
    });
  });

  test('refreshes all components when transaction is created', async () => {
    const { getByText } = renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('debt-display')).toHaveTextContent('Refresh Trigger: 0');
    });

    // Simulate transaction creation
    const createButton = getByText('Create Transaction');
    createButton.click();

    await waitFor(() => {
      expect(mockGetDebtTransactions).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId('debt-display')).toHaveTextContent('Refresh Trigger: 1');
    });
  });

  test('refreshes all components when transaction is updated', async () => {
    const { getAllByText } = renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('debt-display')).toHaveTextContent('Refresh Trigger: 0');
    });

    // Simulate transaction update
    const updateButtons = getAllByText('Update');
    updateButtons[0].click();

    await waitFor(() => {
      expect(mockGetDebtTransactions).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId('debt-display')).toHaveTextContent('Refresh Trigger: 1');
    });
  });

  test('opens edit dialog when edit button is clicked', async () => {
    const { getAllByText } = renderPage();

    await waitFor(() => {
      expect(screen.getByText('Transaction 1')).toBeInTheDocument();
    });

    // Click edit button
    const editButtons = getAllByText('Edit');
    editButtons[0].click();

    await waitFor(() => {
      expect(screen.getByTestId('edit-dialog')).toBeInTheDocument();
      expect(screen.getByText('Editing: 1')).toBeInTheDocument();
    });
  });

  test('closes edit dialog and refreshes when transaction is updated', async () => {
    const { getAllByText, getByText } = renderPage();

    await waitFor(() => {
      expect(screen.getByText('Transaction 1')).toBeInTheDocument();
    });

    // Open edit dialog
    const editButtons = getAllByText('Edit');
    editButtons[0].click();

    await waitFor(() => {
      expect(screen.getByTestId('edit-dialog')).toBeInTheDocument();
    });

    // Save changes
    const saveButton = getByText('Save');
    saveButton.click();

    await waitFor(() => {
      expect(mockGetDebtTransactions).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId('debt-display')).toHaveTextContent('Refresh Trigger: 1');
    });
  });

  test('handles API errors gracefully', async () => {
    mockGetDebtTransactions.mockRejectedValueOnce(new Error('API Error'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Error: API Error')).toBeInTheDocument();
    });
  });

  test('navigates back when back button is clicked', async () => {
    const { getByLabelText } = renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('transaction-form')).toBeInTheDocument();
    });

    const backButton = getByLabelText('back');
    backButton.click();

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('navigates to settings when settings button is clicked', async () => {
    const { getByLabelText } = renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('transaction-form')).toBeInTheDocument();
    });

    const settingsButton = getByLabelText('settings');
    settingsButton.click();

    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });
});
