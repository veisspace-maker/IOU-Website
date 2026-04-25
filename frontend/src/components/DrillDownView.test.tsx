import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import DrillDownView from './DrillDownView';
import { SalesTransaction } from '../api/salesApi';

// Mock the SalesTransactionList component
vi.mock('./SalesTransactionList', () => ({
  default: ({ transactions }: any) => (
    <div data-testid="sales-transaction-list">
      {transactions.map((t: SalesTransaction) => (
        <div key={t.id} data-testid={`transaction-${t.id}`}>
          {t.item} - ${t.price}
        </div>
      ))}
    </div>
  ),
}));

describe('DrillDownView', () => {
  const mockTransactions: SalesTransaction[] = [
    {
      id: '1',
      item: 'Widget',
      price: 100,
      quantity: 1,
      seller: 'seller1',
      date: '2024-01-01',
      description: 'First widget',
      createdBy: 'user1',
    },
    {
      id: '2',
      item: 'Widget',
      price: 150,
      quantity: 1,
      seller: 'seller1',
      date: '2024-01-02',
      description: 'Second widget',
      createdBy: 'user1',
    },
    {
      id: '3',
      item: 'Gadget',
      price: 200,
      quantity: 1,
      seller: 'seller1',
      date: '2024-01-03',
      description: 'A gadget',
      createdBy: 'user2',
    },
  ];

  const mockOnClose = vi.fn();
  const mockOnTransactionUpdate = vi.fn();
  const mockOnEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays the selected item name in the header', () => {
    render(
      <DrillDownView
        item="Widget"
        transactions={mockTransactions}
        onClose={mockOnClose}
        onTransactionUpdate={mockOnTransactionUpdate}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('Widget')).toBeInTheDocument();
  });

  it('displays total revenue for the selected item', () => {
    render(
      <DrillDownView
        item="Widget"
        transactions={mockTransactions}
        onClose={mockOnClose}
        onTransactionUpdate={mockOnTransactionUpdate}
        onEdit={mockOnEdit}
      />
    );

    // Widget has 2 transactions: $100 + $150 = $250
    expect(screen.getByText('$250.00')).toBeInTheDocument();
  });

  it('displays transaction count for the selected item', () => {
    render(
      <DrillDownView
        item="Widget"
        transactions={mockTransactions}
        onClose={mockOnClose}
        onTransactionUpdate={mockOnTransactionUpdate}
        onEdit={mockOnEdit}
      />
    );

    // Widget has 2 transactions
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('filters and displays only transactions for the selected item', () => {
    render(
      <DrillDownView
        item="Widget"
        transactions={mockTransactions}
        onClose={mockOnClose}
        onTransactionUpdate={mockOnTransactionUpdate}
        onEdit={mockOnEdit}
      />
    );

    // Should show Widget transactions
    expect(screen.getByTestId('transaction-1')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-2')).toBeInTheDocument();
    
    // Should not show Gadget transaction
    expect(screen.queryByTestId('transaction-3')).not.toBeInTheDocument();
  });

  it('calls onClose when back button is clicked', () => {
    render(
      <DrillDownView
        item="Widget"
        transactions={mockTransactions}
        onClose={mockOnClose}
        onTransactionUpdate={mockOnTransactionUpdate}
        onEdit={mockOnEdit}
      />
    );

    const backButtons = screen.getAllByRole('button');
    // First button should be the back button (ArrowBackIcon)
    fireEvent.click(backButtons[0]);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <DrillDownView
        item="Widget"
        transactions={mockTransactions}
        onClose={mockOnClose}
        onTransactionUpdate={mockOnTransactionUpdate}
        onEdit={mockOnEdit}
      />
    );

    const closeButtons = screen.getAllByRole('button');
    // Last button should be the close button (CloseIcon)
    fireEvent.click(closeButtons[closeButtons.length - 1]);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('handles case-insensitive item filtering', () => {
    const mixedCaseTransactions: SalesTransaction[] = [
      {
        id: '1',
        item: 'Widget',
        price: 100,
      quantity: 1,
      seller: 'seller1',
      date: '2024-01-01',
        description: null,
        createdBy: 'user1',
      },
      {
        id: '2',
        item: 'WIDGET',
        price: 150,
      quantity: 1,
      seller: 'seller1',
      date: '2024-01-02',
        description: null,
        createdBy: 'user1',
      },
      {
        id: '3',
        item: 'widget',
        price: 200,
      quantity: 1,
      seller: 'seller1',
      date: '2024-01-03',
        description: null,
        createdBy: 'user1',
      },
    ];

    render(
      <DrillDownView
        item="Widget"
        transactions={mixedCaseTransactions}
        onClose={mockOnClose}
        onTransactionUpdate={mockOnTransactionUpdate}
        onEdit={mockOnEdit}
      />
    );

    // All three transactions should be included (case-insensitive)
    // Total: $100 + $150 + $200 = $450
    expect(screen.getByText('$450.00')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('displays correct statistics for single transaction', () => {
    const singleTransaction: SalesTransaction[] = [
      {
        id: '1',
        item: 'Gadget',
        price: 99.99,
        date: '2024-01-01',
        description: null,
        createdBy: 'user1',
      },
    ];

    render(
      <DrillDownView
        item="Gadget"
        transactions={singleTransaction}
        onClose={mockOnClose}
        onTransactionUpdate={mockOnTransactionUpdate}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('handles empty filtered results gracefully', () => {
    render(
      <DrillDownView
        item="NonExistent"
        transactions={mockTransactions}
        onClose={mockOnClose}
        onTransactionUpdate={mockOnTransactionUpdate}
        onEdit={mockOnEdit}
      />
    );

    // Should show zero revenue and count
    expect(screen.getByText('$0.00')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
