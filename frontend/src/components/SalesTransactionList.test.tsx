import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import SalesTransactionList from './SalesTransactionList';
import { SalesTransaction } from '../api/salesApi';
import * as salesApi from '../api/salesApi';

// Mock the salesApi module
vi.mock('../api/salesApi');

// Mock the useScrollPreservation hook
vi.mock('../hooks/useScrollPreservation', () => ({
  useScrollPreservation: () => ({ current: null }),
}));

describe('SalesTransactionList', () => {
  const mockTransactions: SalesTransaction[] = [
    {
      id: '1',
      item: 'Laptop',
      price: 1200.50,
      date: '2024-01-15',
      description: 'Dell XPS 15',
      createdBy: 'user1',
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      item: 'Mouse',
      price: 25.99,
      date: '2024-01-16',
      description: null,
      createdBy: 'user1',
      createdAt: '2024-01-16T11:00:00Z',
    },
  ];

  const mockOnTransactionUpdate = vi.fn();
  const mockOnEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays loading state', () => {
    render(
      <SalesTransactionList
        transactions={[]}
        loading={true}
        error={null}
        onTransactionUpdate={mockOnTransactionUpdate}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays error state', () => {
    const errorMessage = 'Failed to load sales';
    render(
      <SalesTransactionList
        transactions={[]}
        loading={false}
        error={errorMessage}
        onTransactionUpdate={mockOnTransactionUpdate}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('displays empty state when no transactions', () => {
    render(
      <SalesTransactionList
        transactions={[]}
        loading={false}
        error={null}
        onTransactionUpdate={mockOnTransactionUpdate}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText(/No sales transactions yet/i)).toBeInTheDocument();
  });

  it('displays sales transactions with item, price, date, and description', () => {
    render(
      <SalesTransactionList
        transactions={mockTransactions}
        loading={false}
        error={null}
        onTransactionUpdate={mockOnTransactionUpdate}
        onEdit={mockOnEdit}
      />
    );

    // Check first transaction
    expect(screen.getByText('Laptop')).toBeInTheDocument();
    expect(screen.getByText('$1200.50')).toBeInTheDocument();
    expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
    expect(screen.getByText('Dell XPS 15')).toBeInTheDocument();

    // Check second transaction
    expect(screen.getByText('Mouse')).toBeInTheDocument();
    expect(screen.getByText('$25.99')).toBeInTheDocument();
    expect(screen.getByText('Jan 16, 2024')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <SalesTransactionList
        transactions={mockTransactions}
        loading={false}
        error={null}
        onTransactionUpdate={mockOnTransactionUpdate}
        onEdit={mockOnEdit}
      />
    );

    const editButtons = screen.getAllByRole('button', { name: '' });
    const firstEditButton = editButtons[0]; // First button should be edit
    fireEvent.click(firstEditButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockTransactions[0]);
  });

  it('opens delete confirmation dialog when delete button is clicked', () => {
    render(
      <SalesTransactionList
        transactions={mockTransactions}
        loading={false}
        error={null}
        onTransactionUpdate={mockOnTransactionUpdate}
        onEdit={mockOnEdit}
      />
    );

    const deleteButtons = screen.getAllByRole('button', { name: '' });
    const firstDeleteButton = deleteButtons[1]; // Second button should be delete
    fireEvent.click(firstDeleteButton);

    expect(screen.getByText('Delete Sales Transaction')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();
  });

  it('deletes transaction when confirmed', async () => {
    vi.mocked(salesApi.deleteSale).mockResolvedValue(undefined);

    render(
      <SalesTransactionList
        transactions={mockTransactions}
        loading={false}
        error={null}
        onTransactionUpdate={mockOnTransactionUpdate}
        onEdit={mockOnEdit}
      />
    );

    // Click delete button
    const deleteButtons = screen.getAllByRole('button', { name: '' });
    const firstDeleteButton = deleteButtons[1];
    fireEvent.click(firstDeleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /Delete/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(salesApi.deleteSale).toHaveBeenCalledWith('1');
      expect(mockOnTransactionUpdate).toHaveBeenCalled();
    });
  });

  it('handles delete error gracefully', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.mocked(salesApi.deleteSale).mockRejectedValue(new Error('Delete failed'));

    render(
      <SalesTransactionList
        transactions={mockTransactions}
        loading={false}
        error={null}
        onTransactionUpdate={mockOnTransactionUpdate}
        onEdit={mockOnEdit}
      />
    );

    // Click delete button
    const deleteButtons = screen.getAllByRole('button', { name: '' });
    const firstDeleteButton = deleteButtons[1];
    fireEvent.click(firstDeleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /Delete/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Delete failed');
    });

    alertMock.mockRestore();
  });

  it('cancels delete when cancel button is clicked', async () => {
    render(
      <SalesTransactionList
        transactions={mockTransactions}
        loading={false}
        error={null}
        onTransactionUpdate={mockOnTransactionUpdate}
        onEdit={mockOnEdit}
      />
    );

    // Click delete button
    const deleteButtons = screen.getAllByRole('button', { name: '' });
    const firstDeleteButton = deleteButtons[1];
    fireEvent.click(firstDeleteButton);

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    // Dialog should be closed
    await waitFor(() => {
      expect(screen.queryByText('Delete Sales Transaction')).not.toBeInTheDocument();
    });
    expect(salesApi.deleteSale).not.toHaveBeenCalled();
  });
});
