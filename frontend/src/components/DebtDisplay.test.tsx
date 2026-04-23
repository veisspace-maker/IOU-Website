import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import DebtDisplay from './DebtDisplay';
import * as debtTrackerApi from '../api/debtTrackerApi';

// Mock the API module
vi.mock('../api/debtTrackerApi');

const mockedGetNetDebt = vi.mocked(debtTrackerApi.getNetDebt);

describe('DebtDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should display loading state initially', () => {
    mockedGetNetDebt.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<DebtDisplay />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('should display positive debt (Danik owes Lev)', async () => {
    mockedGetNetDebt.mockResolvedValue({
      debtor: 'danik',
      creditor: 'lev',
      amount: 50.0,
    });

    render(<DebtDisplay />);

    await waitFor(() => {
      expect(screen.getByText('Net Debt')).toBeInTheDocument();
      expect(screen.getByText('Danik owes Lev $50.00')).toBeInTheDocument();
    });
  });

  test('should display negative debt (Lev owes Danik)', async () => {
    mockedGetNetDebt.mockResolvedValue({
      debtor: 'lev',
      creditor: 'danik',
      amount: 75.5,
    });

    render(<DebtDisplay />);

    await waitFor(() => {
      expect(screen.getByText('Net Debt')).toBeInTheDocument();
      expect(screen.getByText('Lev owes Danik $75.50')).toBeInTheDocument();
    });
  });

  test('should display "No debt" when debt is zero', async () => {
    mockedGetNetDebt.mockResolvedValue({
      debtor: 'none',
      creditor: 'none',
      amount: 0,
    });

    render(<DebtDisplay />);

    await waitFor(() => {
      expect(screen.getByText('Net Debt')).toBeInTheDocument();
      expect(screen.getByText('No debt')).toBeInTheDocument();
    });
  });

  test('should display error message when API call fails', async () => {
    mockedGetNetDebt.mockRejectedValue(new Error('Network error'));

    render(<DebtDisplay />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  test('should auto-refresh when refreshTrigger changes', async () => {
    mockedGetNetDebt.mockResolvedValue({
      debtor: 'danik',
      creditor: 'lev',
      amount: 50.0,
    });

    const { rerender } = render(<DebtDisplay refreshTrigger={0} />);

    await waitFor(() => {
      expect(screen.getByText('Danik owes Lev $50.00')).toBeInTheDocument();
    });

    expect(mockedGetNetDebt).toHaveBeenCalledTimes(1);

    // Update the debt result
    mockedGetNetDebt.mockResolvedValue({
      debtor: 'lev',
      creditor: 'danik',
      amount: 100.0,
    });

    // Trigger refresh by changing refreshTrigger
    rerender(<DebtDisplay refreshTrigger={1} />);

    await waitFor(() => {
      expect(screen.getByText('Lev owes Danik $100.00')).toBeInTheDocument();
    });

    expect(mockedGetNetDebt).toHaveBeenCalledTimes(2);
  });

  test('should format currency with 2 decimal places', async () => {
    mockedGetNetDebt.mockResolvedValue({
      debtor: 'danik',
      creditor: 'lev',
      amount: 123.456,
    });

    render(<DebtDisplay />);

    await waitFor(() => {
      expect(screen.getByText('Danik owes Lev $123.46')).toBeInTheDocument();
    });
  });
});
