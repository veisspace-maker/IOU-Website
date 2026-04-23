import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import EditTransactionDialog from './EditTransactionDialog';
import * as debtTrackerApi from '../api/debtTrackerApi';

// Mock the API module
vi.mock('../api/debtTrackerApi', () => ({
  updateDebtTransaction: vi.fn(),
}));

describe('EditTransactionDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnTransactionUpdated = vi.fn();

  const mockTransaction: debtTrackerApi.DebtTransaction = {
    id: '1',
    from: 'lev',
    to: 'danik',
    amount: 100,
    timestamp: Date.now(),
    description: 'Test transaction',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders dialog when open', () => {
    render(
      <EditTransactionDialog
        open={true}
        transaction={mockTransaction}
        onClose={mockOnClose}
        onTransactionUpdated={mockOnTransactionUpdated}
      />
    );

    expect(screen.getByText('Edit Debt Transaction')).toBeInTheDocument();
  });

  test('pre-fills form with transaction data', () => {
    render(
      <EditTransactionDialog
        open={true}
        transaction={mockTransaction}
        onClose={mockOnClose}
        onTransactionUpdated={mockOnTransactionUpdated}
      />
    );

    const amountInput = screen.getByLabelText(/Amount/i) as HTMLInputElement;
    expect(amountInput.value).toBe('100');

    const descriptionInput = screen.getByLabelText(/Description/i) as HTMLInputElement;
    expect(descriptionInput.value).toBe('Test transaction');
  });

  test('updates transaction on submit', async () => {
    const mockUpdatedTransaction = { ...mockTransaction, amount: 150 };
    vi.mocked(debtTrackerApi.updateDebtTransaction).mockResolvedValue(mockUpdatedTransaction);

    render(
      <EditTransactionDialog
        open={true}
        transaction={mockTransaction}
        onClose={mockOnClose}
        onTransactionUpdated={mockOnTransactionUpdated}
      />
    );

    // Change amount
    const amountInput = screen.getByLabelText(/Amount/i);
    fireEvent.change(amountInput, { target: { value: '150' } });

    // Submit form
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(debtTrackerApi.updateDebtTransaction).toHaveBeenCalledWith('1', 
        expect.objectContaining({
          from: 'lev',
          to: 'danik',
          amount: 150,
          description: 'Test transaction',
          timestamp: expect.any(Number),
        })
      );
    });

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnTransactionUpdated).toHaveBeenCalled();
  });

  test('disables save button for invalid amount', async () => {
    render(
      <EditTransactionDialog
        open={true}
        transaction={mockTransaction}
        onClose={mockOnClose}
        onTransactionUpdated={mockOnTransactionUpdated}
      />
    );

    // Set invalid amount
    const amountInput = screen.getByLabelText(/Amount/i);
    fireEvent.change(amountInput, { target: { value: '-10' } });

    // Save button should be disabled
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    expect(saveButton).toBeDisabled();

    expect(debtTrackerApi.updateDebtTransaction).not.toHaveBeenCalled();
  });

  test('displays API error on update failure', async () => {
    vi.mocked(debtTrackerApi.updateDebtTransaction).mockRejectedValue(
      new Error('Network error')
    );

    render(
      <EditTransactionDialog
        open={true}
        transaction={mockTransaction}
        onClose={mockOnClose}
        onTransactionUpdated={mockOnTransactionUpdated}
      />
    );

    // Submit form
    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
    expect(mockOnTransactionUpdated).not.toHaveBeenCalled();
  });

  test('closes dialog on cancel', () => {
    render(
      <EditTransactionDialog
        open={true}
        transaction={mockTransaction}
        onClose={mockOnClose}
        onTransactionUpdated={mockOnTransactionUpdated}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('disables save button when form is invalid', () => {
    render(
      <EditTransactionDialog
        open={true}
        transaction={mockTransaction}
        onClose={mockOnClose}
        onTransactionUpdated={mockOnTransactionUpdated}
      />
    );

    // Clear amount
    const amountInput = screen.getByLabelText(/Amount/i);
    fireEvent.change(amountInput, { target: { value: '' } });

    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    expect(saveButton).toBeDisabled();
  });
});
