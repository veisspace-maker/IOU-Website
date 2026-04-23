import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AddSalesTransactionForm from './AddSalesTransactionForm';
import * as salesApi from '../api/salesApi';

// Mock the salesApi module
vi.mock('../api/salesApi');

const mockCreateSale = salesApi.createSale as any;

// Wrapper component with LocalizationProvider
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {component}
    </LocalizationProvider>
  );
};

describe('AddSalesTransactionForm', () => {
  const mockOnTransactionCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with all required fields', () => {
    renderWithProviders(<AddSalesTransactionForm onTransactionCreated={mockOnTransactionCreated} />);

    expect(screen.getByLabelText(/item/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /date/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add sale/i })).toBeInTheDocument();
  });

  it('disables submit button when required fields are empty', () => {
    renderWithProviders(<AddSalesTransactionForm onTransactionCreated={mockOnTransactionCreated} />);

    const submitButton = screen.getByRole('button', { name: /add sale/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when all required fields are filled', () => {
    renderWithProviders(<AddSalesTransactionForm onTransactionCreated={mockOnTransactionCreated} />);

    const itemInput = screen.getByLabelText(/item/i);
    const priceInput = screen.getByLabelText(/price/i);

    fireEvent.change(itemInput, { target: { value: 'Test Product' } });
    fireEvent.change(priceInput, { target: { value: '99.99' } });

    const submitButton = screen.getByRole('button', { name: /add sale/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('shows error when item name is empty', async () => {
    renderWithProviders(<AddSalesTransactionForm onTransactionCreated={mockOnTransactionCreated} />);

    const itemInput = screen.getByLabelText(/item/i);
    const priceInput = screen.getByLabelText(/price/i);

    // Fill in valid data first to enable button
    fireEvent.change(itemInput, { target: { value: 'Test Product' } });
    fireEvent.change(priceInput, { target: { value: '99.99' } });

    // Now clear the item to only whitespace
    fireEvent.change(itemInput, { target: { value: '   ' } });

    // Button should be disabled now
    const submitButton = screen.getByRole('button', { name: /add sale/i });
    expect(submitButton).toBeDisabled();
  });

  it('shows error when price is zero', async () => {
    renderWithProviders(<AddSalesTransactionForm onTransactionCreated={mockOnTransactionCreated} />);

    const itemInput = screen.getByLabelText(/item/i);
    const priceInput = screen.getByLabelText(/price/i);

    fireEvent.change(itemInput, { target: { value: 'Test Product' } });
    fireEvent.change(priceInput, { target: { value: '0' } });

    const submitButton = screen.getByRole('button', { name: /add sale/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/price must be a positive number/i)).toBeInTheDocument();
    });
  });

  it('shows error when price is negative', async () => {
    renderWithProviders(<AddSalesTransactionForm onTransactionCreated={mockOnTransactionCreated} />);

    const itemInput = screen.getByLabelText(/item/i);
    const priceInput = screen.getByLabelText(/price/i);

    fireEvent.change(itemInput, { target: { value: 'Test Product' } });
    fireEvent.change(priceInput, { target: { value: '-10' } });

    const submitButton = screen.getByRole('button', { name: /add sale/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/price must be a positive number/i)).toBeInTheDocument();
    });
  });

  it('successfully creates sale with valid data', async () => {
    const mockTransaction = {
      id: '123',
      item: 'Test Product',
      price: 99.99,
      date: '2024-01-15',
      description: null,
      createdBy: 'user1',
    };

    mockCreateSale.mockResolvedValue(mockTransaction);

    renderWithProviders(<AddSalesTransactionForm onTransactionCreated={mockOnTransactionCreated} />);

    const itemInput = screen.getByLabelText(/item/i);
    const priceInput = screen.getByLabelText(/price/i);

    fireEvent.change(itemInput, { target: { value: 'Test Product' } });
    fireEvent.change(priceInput, { target: { value: '99.99' } });

    const submitButton = screen.getByRole('button', { name: /add sale/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateSale).toHaveBeenCalledWith(
        expect.objectContaining({
          item: 'Test Product',
          price: 99.99,
        })
      );
      expect(mockOnTransactionCreated).toHaveBeenCalled();
    });
  });

  it('successfully creates sale with description', async () => {
    const mockTransaction = {
      id: '123',
      item: 'Test Product',
      price: 99.99,
      date: '2024-01-15',
      description: 'Test description',
      createdBy: 'user1',
    };

    mockCreateSale.mockResolvedValue(mockTransaction);

    renderWithProviders(<AddSalesTransactionForm onTransactionCreated={mockOnTransactionCreated} />);

    const itemInput = screen.getByLabelText(/item/i);
    const priceInput = screen.getByLabelText(/price/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    fireEvent.change(itemInput, { target: { value: 'Test Product' } });
    fireEvent.change(priceInput, { target: { value: '99.99' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

    const submitButton = screen.getByRole('button', { name: /add sale/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateSale).toHaveBeenCalledWith(
        expect.objectContaining({
          item: 'Test Product',
          price: 99.99,
          description: 'Test description',
        })
      );
      expect(mockOnTransactionCreated).toHaveBeenCalled();
    });
  });

  it('clears form after successful submission', async () => {
    const mockTransaction = {
      id: '123',
      item: 'Test Product',
      price: 99.99,
      date: '2024-01-15',
      description: 'Test description',
      createdBy: 'user1',
    };

    mockCreateSale.mockResolvedValue(mockTransaction);

    renderWithProviders(<AddSalesTransactionForm onTransactionCreated={mockOnTransactionCreated} />);

    const itemInput = screen.getByLabelText(/item/i) as HTMLInputElement;
    const priceInput = screen.getByLabelText(/price/i) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(/description/i) as HTMLInputElement;

    fireEvent.change(itemInput, { target: { value: 'Test Product' } });
    fireEvent.change(priceInput, { target: { value: '99.99' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

    const submitButton = screen.getByRole('button', { name: /add sale/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(itemInput.value).toBe('');
      expect(priceInput.value).toBe('');
      expect(descriptionInput.value).toBe('');
    });
  });

  it('trims whitespace from item name', async () => {
    const mockTransaction = {
      id: '123',
      item: 'Test Product',
      price: 99.99,
      date: '2024-01-15',
      description: null,
      createdBy: 'user1',
    };

    mockCreateSale.mockResolvedValue(mockTransaction);

    renderWithProviders(<AddSalesTransactionForm onTransactionCreated={mockOnTransactionCreated} />);

    const itemInput = screen.getByLabelText(/item/i);
    const priceInput = screen.getByLabelText(/price/i);

    fireEvent.change(itemInput, { target: { value: '  Test Product  ' } });
    fireEvent.change(priceInput, { target: { value: '99.99' } });

    const submitButton = screen.getByRole('button', { name: /add sale/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateSale).toHaveBeenCalledWith(
        expect.objectContaining({
          item: 'Test Product',
        })
      );
    });
  });

  it('handles API error gracefully', async () => {
    mockCreateSale.mockRejectedValue(new Error('Network error'));

    renderWithProviders(<AddSalesTransactionForm onTransactionCreated={mockOnTransactionCreated} />);

    const itemInput = screen.getByLabelText(/item/i);
    const priceInput = screen.getByLabelText(/price/i);

    fireEvent.change(itemInput, { target: { value: 'Test Product' } });
    fireEvent.change(priceInput, { target: { value: '99.99' } });

    const submitButton = screen.getByRole('button', { name: /add sale/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    expect(mockOnTransactionCreated).not.toHaveBeenCalled();
  });

  it('disables submit button while submitting', async () => {
    mockCreateSale.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderWithProviders(<AddSalesTransactionForm onTransactionCreated={mockOnTransactionCreated} />);

    const itemInput = screen.getByLabelText(/item/i);
    const priceInput = screen.getByLabelText(/price/i);

    fireEvent.change(itemInput, { target: { value: 'Test Product' } });
    fireEvent.change(priceInput, { target: { value: '99.99' } });

    const submitButton = screen.getByRole('button', { name: /add sale/i });
    fireEvent.click(submitButton);

    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });
});
