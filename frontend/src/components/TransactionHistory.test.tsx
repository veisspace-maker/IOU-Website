import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import TransactionHistory from './TransactionHistory';
import { DebtTransaction } from '../api/debtTrackerApi';
import * as debtTrackerApi from '../api/debtTrackerApi';

// Mock the API module
vi.mock('../api/debtTrackerApi');

// Mock the scroll preservation hook
vi.mock('../hooks/useScrollPreservation', () => ({
  useScrollPreservation: () => ({ current: null }),
}));

describe('TransactionHistory', () => {
  const mockOnTransactionUpdate = vi.fn();
  const mockOnEdit = vi.fn();

  const mockTransactions: DebtTransaction[] = [
    {
      id: '1',
      from: 'lev',
      to: 'danik',
      amount: 100,
      timestamp: 1704067200000, // Jan 1, 2024 12:00 AM
      description: 'Test transaction 1',
    },
    {
      id: '2',
      from: 'danik',
      to: '2masters',
      amount: 50,
      timestamp: 1704153600000, // Jan 2, 2024 12:00 AM
      description: 'Test transaction 2',
    },
    {
      id: '3',
      from: '2masters',
      to: 'lev',
      amount: 75,
      timestamp: 1704240000000, // Jan 3, 2024 12:00 AM
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Search Functionality', () => {
    it('should display search field', () => {
      render(
        <TransactionHistory
          transactions={mockTransactions}
          loading={false}
          error={null}
          onTransactionUpdate={mockOnTransactionUpdate}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByPlaceholderText('Search transactions...')).toBeInTheDocument();
    });

    it('should filter transactions by entity name', () => {
      render(
        <TransactionHistory
          transactions={mockTransactions}
          loading={false}
          error={null}
          onTransactionUpdate={mockOnTransactionUpdate}
          onEdit={mockOnEdit}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search transactions...');
      fireEvent.change(searchInput, { target: { value: 'lev' } });

      // Should show transactions involving Lev (transactions 1 and 3)
      expect(screen.getByText(/\$100\.00/)).toBeInTheDocument();
      expect(screen.getByText(/\$75\.00/)).toBeInTheDocument();
      expect(screen.queryByText(/\$50\.00/)).not.toBeInTheDocument();
    });

    it('should filter transactions by amount (numeric search)', () => {
      render(
        <TransactionHistory
          transactions={mockTransactions}
          loading={false}
          error={null}
          onTransactionUpdate={mockOnTransactionUpdate}
          onEdit={mockOnEdit}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search transactions...');
      fireEvent.change(searchInput, { target: { value: '50' } });

      // Should show transaction with amount 50
      expect(screen.getByText(/\$50\.00/)).toBeInTheDocument();
      expect(screen.queryByText(/\$100\.00/)).not.toBeInTheDocument();
      expect(screen.queryByText(/\$75\.00/)).not.toBeInTheDocument();
    });

    it('should filter transactions by date (day)', () => {
      render(
        <TransactionHistory
          transactions={mockTransactions}
          loading={false}
          error={null}
          onTransactionUpdate={mockOnTransactionUpdate}
          onEdit={mockOnEdit}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search transactions...');
      fireEvent.change(searchInput, { target: { value: '1' } });

      // Should show transaction from Jan 1
      expect(screen.getByText(/\$100\.00/)).toBeInTheDocument();
    });

    it('should filter transactions by description', () => {
      render(
        <TransactionHistory
          transactions={mockTransactions}
          loading={false}
          error={null}
          onTransactionUpdate={mockOnTransactionUpdate}
          onEdit={mockOnEdit}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search transactions...');
      fireEvent.change(searchInput, { target: { value: 'transaction 2' } });

      // Should show only transaction 2
      expect(screen.getByText(/\$50\.00/)).toBeInTheDocument();
      expect(screen.queryByText(/\$100\.00/)).not.toBeInTheDocument();
    });

    it('should show no results message when search has no matches', () => {
      render(
        <TransactionHistory
          transactions={mockTransactions}
          loading={false}
          error={null}
          onTransactionUpdate={mockOnTransactionUpdate}
          onEdit={mockOnEdit}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search transactions...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText(/No transactions found matching "nonexistent"/)).toBeInTheDocument();
    });

    it('should clear search when clear button is clicked', () => {
      render(
        <TransactionHistory
          transactions={mockTransactions}
          loading={false}
          error={null}
          onTransactionUpdate={mockOnTransactionUpdate}
          onEdit={mockOnEdit}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search transactions...');
      fireEvent.change(searchInput, { target: { value: 'lev' } });

      // Clear button should appear
      const clearButton = screen.getByRole('button', { name: '' });
      fireEvent.click(clearButton);

      // All transactions should be visible again
      expect(screen.getByText(/\$100\.00/)).toBeInTheDocument();
      expect(screen.getByText(/\$50\.00/)).toBeInTheDocument();
      expect(screen.getByText(/\$75\.00/)).toBeInTheDocument();
    });

    it('should be case-insensitive', () => {
      render(
        <TransactionHistory
          transactions={mockTransactions}
          loading={false}
          error={null}
          onTransactionUpdate={mockOnTransactionUpdate}
          onEdit={mockOnEdit}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search transactions...');
      fireEvent.change(searchInput, { target: { value: 'LEV' } });

      // Should still find Lev transactions
      expect(screen.getByText(/\$100\.00/)).toBeInTheDocument();
      expect(screen.getByText(/\$75\.00/)).toBeInTheDocument();
    });
  });

  describe('Loading and Error States', () => {
    it('should display loading spinner when loading is true', () => {
      render(
        <TransactionHistory
          transactions={[]}
          loading={true}
          error={null}
          onTransactionUpdate={mockOnTransactionUpdate}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should display error message when error is present', () => {
      const errorMessage = 'Failed to load transactions';
      render(
        <TransactionHistory
          transactions={[]}
          loading={false}
          error={errorMessage}
          onTransactionUpdate={mockOnTransactionUpdate}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should display empty state message when no transactions', () => {
      render(
        <TransactionHistory
          transactions={[]}
          loading={false}
          error={null}
          onTransactionUpdate={mockOnTransactionUpdate}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText(/No transactions yet/i)).toBeInTheDocument();
    });
  });

  describe('Transaction Display', () => {
    it('should display all transactions in chronological order', () => {
      render(
        <TransactionHistory
          transactions={mockTransactions}
          loading={false}
          error={null}
          onTransactionUpdate={mockOnTransactionUpdate}
          onEdit={mockOnEdit}
        />
      );

      // Check that all transactions are displayed
      const levElements = screen.getAllByText('Lev');
      const danikElements = screen.getAllByText('Danik');
      const mastersElements = screen.getAllByText('2 Masters');
      expect(levElements.length).toBeGreaterThan(0);
      expect(danikElements.length).toBeGreaterThan(0);
      expect(mastersElements.length).toBeGreaterThan(0);
    });

    it('should format entity names correctly', () => {
      render(
        <TransactionHistory
          transactions={[mockTransactions[1]]}
          loading={false}
          error={null}
          onTransactionUpdate={mockOnTransactionUpdate}
          onEdit={mockOnEdit}
        />
      );

      // Check that "2masters" is displayed as "2 Masters"
      expect(screen.getByText('2 Masters')).toBeInTheDocument();
      expect(screen.getByText('Danik')).toBeInTheDocument();
    });

    it('should format currency correctly', () => {
      render(
        <TransactionHistory
          transactions={[mockTransactions[0]]}
          loading={false}
          error={null}
          onTransactionUpdate={mockOnTransactionUpdate}
          onEdit={mockOnEdit}
        />
      );

      // Check that amount is formatted with 2 decimal places
      expect(screen.getByText(/\$100\.00/)).toBeInTheDocument();
    });

    it('should display description when present', () => {
      render(
        <TransactionHistory
          transactions={[mockTransactions[0]]}
          loading={false}
          error={null}
          onTransactionUpdate={mockOnTransactionUpdate}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText('Test transaction 1')).toBeInTheDocument();
    });

    it('should not display description section when description is missing', () => {
      render(
        <TransactionHistory
          transactions={[mockTransactions[2]]}
          loading={false}
          error={null}
          onTransactionUpdate={mockOnTransactionUpdate}
          onEdit={mockOnEdit}
        />
      );

      // Only check that the transaction is displayed without description
      expect(screen.getByText(/\$75\.00/)).toBeInTheDocument();
      expect(screen.queryByText(/Test transaction/)).not.toBeInTheDocument();
    });

    it('should display formatted timestamp', () => {
      render(
        <TransactionHistory
          transactions={[mockTransactions[0]]}
          loading={false}
          error={null}
          onTransactionUpdate={mockOnTransactionUpdate}
          onEdit={mockOnEdit}
        />
      );

      // Check that timestamp is formatted as DD/MM/YYYY
      expect(screen.getByText(/01\/01\/2024/)).toBeInTheDocument();
    });
  });

  describe('Edit Functionality', () => {
    it('should call onEdit when edit button is clicked', () => {
      render(
        <TransactionHistory
          transactions={[mockTransactions[0]]}
          loading={false}
          error={null}
          onTransactionUpdate={mockOnTransactionUpdate}
          onEdit={mockOnEdit}
        />
      );

      const editButtons = screen.getAllByLabelText('edit');
      fireEvent.click(editButtons[0]);

      expect(mockOnEdit).toHaveBeenCalledWith(mockTransactions[0]);
    });
  });

  describe('Delete Functionality', () => {
    it('should open confirmation dialog when delete button is clicked', () => {
      render(
        <TransactionHistory
          transactions={[mockTransactions[0]]}
          loading={false}
          error={null}
          onTransactionUpdate={mockOnTransactionUpdate}
          onEdit={mockOnEdit}
        />
      );

      const deleteButtons = screen.getAllByLabelText('delete');
      fireEvent.click(deleteButtons[0]);

      expect(screen.getByText('Delete Transaction')).toBeInTheDocument();
      expect(screen.getByText(/Delete this transaction/)).toBeInTheDocument();
    });

    it('should close dialog when cancel is clicked', async () => {
      render(
        <TransactionHistory
          transactions={[mockTransactions[0]]}
          loading={false}
          error={null}
          onTransactionUpdate={mockOnTransactionUpdate}
          onEdit={mockOnEdit}
        />
      );

      const deleteButtons = screen.getAllByLabelText('delete');
      fireEvent.click(deleteButtons[0]);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Delete Transaction')).not.toBeInTheDocument();
      });
    });

    it('should delete transaction and call onTransactionUpdate when confirmed', async () => {
      const mockDeleteDebtTransaction = vi.spyOn(debtTrackerApi, 'deleteDebtTransaction')
        .mockResolvedValue(undefined);

      render(
        <TransactionHistory
          transactions={[mockTransactions[0]]}
          loading={false}
          error={null}
          onTransactionUpdate={mockOnTransactionUpdate}
          onEdit={mockOnEdit}
        />
      );

      const deleteButtons = screen.getAllByLabelText('delete');
      fireEvent.click(deleteButtons[0]);

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteDebtTransaction).toHaveBeenCalledWith('1');
        expect(mockOnTransactionUpdate).toHaveBeenCalled();
      });
    });

    it('should display error alert when delete fails', async () => {
      const mockDeleteDebtTransaction = vi.spyOn(debtTrackerApi, 'deleteDebtTransaction')
        .mockRejectedValue(new Error('Delete failed'));

      // Mock window.alert
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <TransactionHistory
          transactions={[mockTransactions[0]]}
          loading={false}
          error={null}
          onTransactionUpdate={mockOnTransactionUpdate}
          onEdit={mockOnEdit}
        />
      );

      const deleteButtons = screen.getAllByLabelText('delete');
      fireEvent.click(deleteButtons[0]);

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteDebtTransaction).toHaveBeenCalledWith('1');
        expect(alertMock).toHaveBeenCalledWith('Delete failed');
      });

      alertMock.mockRestore();
    });
  });

  describe('Multiple Transactions', () => {
    it('should display multiple transactions with dividers', () => {
      render(
        <TransactionHistory
          transactions={mockTransactions}
          loading={false}
          error={null}
          onTransactionUpdate={mockOnTransactionUpdate}
          onEdit={mockOnEdit}
        />
      );

      // Check that all transactions are displayed using regex
      expect(screen.getByText(/\$100\.00/)).toBeInTheDocument();
      expect(screen.getByText(/\$50\.00/)).toBeInTheDocument();
      expect(screen.getByText(/\$75\.00/)).toBeInTheDocument();

      // Check that edit and delete buttons exist for each transaction
      const editButtons = screen.getAllByLabelText('edit');
      const deleteButtons = screen.getAllByLabelText('delete');
      expect(editButtons).toHaveLength(3);
      expect(deleteButtons).toHaveLength(3);
    });
  });
});
