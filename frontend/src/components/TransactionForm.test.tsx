import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import TransactionForm from './TransactionForm';
import * as debtTrackerApi from '../api/debtTrackerApi';

// Mock the API module
vi.mock('../api/debtTrackerApi');

describe('TransactionForm', () => {
  const mockOnTransactionCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the form with all required fields', () => {
    render(<TransactionForm onTransactionCreated={mockOnTransactionCreated} />);

    expect(screen.getByText('Add Debt Transaction')).toBeInTheDocument();
    expect(screen.getByText('Select Entities')).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Transaction/i })).toBeInTheDocument();
  });

  test('disables submit button when form is invalid', () => {
    render(<TransactionForm onTransactionCreated={mockOnTransactionCreated} />);

    const submitButton = screen.getByRole('button', { name: /Add Transaction/i });
    expect(submitButton).toBeDisabled();
  });

  test('enables submit button when all required fields are filled', () => {
    render(<TransactionForm onTransactionCreated={mockOnTransactionCreated} />);

    // Select sender entity (Lev)
    const senderButtons = screen.getAllByRole('button', { name: /Lev/i });
    fireEvent.click(senderButtons[0]);

    // Select receiver entity (Danik)
    const receiverButtons = screen.getAllByRole('button', { name: /Danik/i });
    fireEvent.click(receiverButtons[1]);

    // Enter amount
    const amountInput = screen.getByLabelText(/Amount/i);
    fireEvent.change(amountInput, { target: { value: '100' } });

    // Submit button should now be enabled
    const submitButton = screen.getByRole('button', { name: /Add Transaction/i });
    expect(submitButton).not.toBeDisabled();
  });

  test('shows error when submitting without sender entity', async () => {
    render(<TransactionForm onTransactionCreated={mockOnTransactionCreated} />);

    // Select receiver entity only
    const receiverButtons = screen.getAllByRole('button', { name: /Danik/i });
    fireEvent.click(receiverButtons[1]);

    // Enter amount
    const amountInput = screen.getByLabelText(/Amount/i);
    fireEvent.change(amountInput, { target: { value: '100' } });

    // Try to submit (button should be disabled, but test the validation logic)
    const submitButton = screen.getByRole('button', { name: /Add Transaction/i });
    expect(submitButton).toBeDisabled();
  });

  test('shows error when submitting with invalid amount', async () => {
    render(<TransactionForm onTransactionCreated={mockOnTransactionCreated} />);

    // Select entities
    const senderButtons = screen.getAllByRole('button', { name: /Lev/i });
    fireEvent.click(senderButtons[0]);
    const receiverButtons = screen.getAllByRole('button', { name: /Danik/i });
    fireEvent.click(receiverButtons[1]);

    // Enter invalid amount
    const amountInput = screen.getByLabelText(/Amount/i);
    fireEvent.change(amountInput, { target: { value: '-10' } });

    // Submit button should be disabled
    const submitButton = screen.getByRole('button', { name: /Add Transaction/i });
    expect(submitButton).toBeDisabled();
  });

  test('successfully creates a transaction with valid data', async () => {
    const mockTransaction = {
      id: '1',
      from: 'lev' as const,
      to: 'danik' as const,
      amount: 100,
      timestamp: Date.now(),
    };

    (debtTrackerApi.createDebtTransaction as any).mockResolvedValue(
      mockTransaction
    );

    render(<TransactionForm onTransactionCreated={mockOnTransactionCreated} />);

    // Select sender entity (Lev)
    const senderButtons = screen.getAllByRole('button', { name: /Lev/i });
    fireEvent.click(senderButtons[0]);

    // Select receiver entity (Danik)
    const receiverButtons = screen.getAllByRole('button', { name: /Danik/i });
    fireEvent.click(receiverButtons[1]);

    // Enter amount
    const amountInput = screen.getByLabelText(/Amount/i);
    fireEvent.change(amountInput, { target: { value: '100' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Add Transaction/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(debtTrackerApi.createDebtTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'lev',
          to: 'danik',
          amount: 100,
          timestamp: expect.any(Number),
        })
      );
      expect(mockOnTransactionCreated).toHaveBeenCalled();
    });
  });

  test('includes description when provided', async () => {
    const mockTransaction = {
      id: '1',
      from: 'lev' as const,
      to: 'danik' as const,
      amount: 50,
      timestamp: Date.now(),
      description: 'Test description',
    };

    (debtTrackerApi.createDebtTransaction as any).mockResolvedValue(
      mockTransaction
    );

    render(<TransactionForm onTransactionCreated={mockOnTransactionCreated} />);

    // Select entities
    const senderButtons = screen.getAllByRole('button', { name: /Lev/i });
    fireEvent.click(senderButtons[0]);
    const receiverButtons = screen.getAllByRole('button', { name: /Danik/i });
    fireEvent.click(receiverButtons[1]);

    // Enter amount
    const amountInput = screen.getByLabelText(/Amount/i);
    fireEvent.change(amountInput, { target: { value: '50' } });

    // Enter description
    const descriptionInput = screen.getByLabelText(/Description/i);
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Add Transaction/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(debtTrackerApi.createDebtTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'lev',
          to: 'danik',
          amount: 50,
          description: 'Test description',
          timestamp: expect.any(Number),
        })
      );
    });
  });

  test('clears form after successful submission', async () => {
    const mockTransaction = {
      id: '1',
      from: 'lev' as const,
      to: 'danik' as const,
      amount: 100,
      timestamp: Date.now(),
    };

    (debtTrackerApi.createDebtTransaction as any).mockResolvedValue(
      mockTransaction
    );

    render(<TransactionForm onTransactionCreated={mockOnTransactionCreated} />);

    // Fill form
    const senderButtons = screen.getAllByRole('button', { name: /Lev/i });
    fireEvent.click(senderButtons[0]);
    const receiverButtons = screen.getAllByRole('button', { name: /Danik/i });
    fireEvent.click(receiverButtons[1]);
    const amountInput = screen.getByLabelText(/Amount/i) as HTMLInputElement;
    fireEvent.change(amountInput, { target: { value: '100' } });
    const descriptionInput = screen.getByLabelText(/Description/i) as HTMLInputElement;
    fireEvent.change(descriptionInput, { target: { value: 'Test' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Add Transaction/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(amountInput.value).toBe('');
      expect(descriptionInput.value).toBe('');
    });
  });

  test('displays error dialog when API call fails', async () => {
    (debtTrackerApi.createDebtTransaction as any).mockRejectedValue(
      new Error('API Error')
    );

    render(<TransactionForm onTransactionCreated={mockOnTransactionCreated} />);

    // Fill and submit form
    const senderButtons = screen.getAllByRole('button', { name: /Lev/i });
    fireEvent.click(senderButtons[0]);
    const receiverButtons = screen.getAllByRole('button', { name: /Danik/i });
    fireEvent.click(receiverButtons[1]);
    const amountInput = screen.getByLabelText(/Amount/i);
    fireEvent.change(amountInput, { target: { value: '100' } });
    const submitButton = screen.getByRole('button', { name: /Add Transaction/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });
});
