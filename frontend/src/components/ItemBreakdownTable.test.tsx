import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import ItemBreakdownTable from './ItemBreakdownTable';
import { SalesTransaction } from '../api/salesApi';

describe('ItemBreakdownTable', () => {
  const mockOnItemClick = vi.fn();

  beforeEach(() => {
    mockOnItemClick.mockClear();
  });

  it('displays empty state when no transactions provided', () => {
    render(<ItemBreakdownTable transactions={[]} onItemClick={mockOnItemClick} />);
    
    expect(screen.getByText(/No items to display/i)).toBeInTheDocument();
  });

  it('displays item statistics with correct values', () => {
    const transactions: SalesTransaction[] = [
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
        item: 'Gadget',
        price: 200,
      quantity: 1,
      seller: 'seller1',
      date: '2024-01-02',
        description: null,
        createdBy: 'user1',
      },
      {
        id: '3',
        item: 'Widget',
        price: 50,
      quantity: 1,
      seller: 'seller1',
      date: '2024-01-03',
        description: null,
        createdBy: 'user1',
      },
    ];

    render(<ItemBreakdownTable transactions={transactions} onItemClick={mockOnItemClick} />);

    // Check that items are displayed
    expect(screen.getByText('Widget')).toBeInTheDocument();
    expect(screen.getByText('Gadget')).toBeInTheDocument();

    // Check revenue values
    expect(screen.getByText('$200.00')).toBeInTheDocument(); // Gadget
    expect(screen.getByText('$150.00')).toBeInTheDocument(); // Widget (100 + 50)

    // Check counts
    const counts = screen.getAllByText(/^[0-9]+$/);
    expect(counts).toHaveLength(2);
  });

  it('sorts items by revenue in descending order', () => {
    const transactions: SalesTransaction[] = [
      {
        id: '1',
        item: 'Low',
        price: 50,
      quantity: 1,
      seller: 'seller1',
      date: '2024-01-01',
        description: null,
        createdBy: 'user1',
      },
      {
        id: '2',
        item: 'High',
        price: 500,
      quantity: 1,
      seller: 'seller1',
      date: '2024-01-02',
        description: null,
        createdBy: 'user1',
      },
      {
        id: '3',
        item: 'Medium',
        price: 200,
      quantity: 1,
      seller: 'seller1',
      date: '2024-01-03',
        description: null,
        createdBy: 'user1',
      },
    ];

    render(<ItemBreakdownTable transactions={transactions} onItemClick={mockOnItemClick} />);

    const rows = screen.getAllByRole('row');
    // Skip header row (index 0)
    const dataRows = rows.slice(1);

    // Check order: High, Medium, Low
    expect(dataRows[0]).toHaveTextContent('High');
    expect(dataRows[1]).toHaveTextContent('Medium');
    expect(dataRows[2]).toHaveTextContent('Low');
  });

  it('groups items by normalized name (case-insensitive)', () => {
    const transactions: SalesTransaction[] = [
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
        price: 50,
      quantity: 1,
      seller: 'seller1',
      date: '2024-01-02',
        description: null,
        createdBy: 'user1',
      },
      {
        id: '3',
        item: '  widget  ',
        price: 25,
      quantity: 1,
      seller: 'seller1',
      date: '2024-01-03',
        description: null,
        createdBy: 'user1',
      },
    ];

    render(<ItemBreakdownTable transactions={transactions} onItemClick={mockOnItemClick} />);

    // Should only show one row for "Widget" with combined revenue
    const rows = screen.getAllByRole('row');
    const dataRows = rows.slice(1); // Skip header
    expect(dataRows).toHaveLength(1);

    // Check combined revenue (100 + 50 + 25 = 175)
    expect(screen.getByText('$175.00')).toBeInTheDocument();
    
    // Check combined count
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('preserves original casing from first occurrence', () => {
    const transactions: SalesTransaction[] = [
      {
        id: '1',
        item: 'MyProduct',
        price: 100,
      quantity: 1,
      seller: 'seller1',
      date: '2024-01-01',
        description: null,
        createdBy: 'user1',
      },
      {
        id: '2',
        item: 'myproduct',
        price: 50,
      quantity: 1,
      seller: 'seller1',
      date: '2024-01-02',
        description: null,
        createdBy: 'user1',
      },
    ];

    render(<ItemBreakdownTable transactions={transactions} onItemClick={mockOnItemClick} />);

    // Should display "MyProduct" (first occurrence casing)
    expect(screen.getByText('MyProduct')).toBeInTheDocument();
    expect(screen.queryByText('myproduct')).not.toBeInTheDocument();
  });

  it('calls onItemClick when row is clicked', () => {
    const transactions: SalesTransaction[] = [
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
    ];

    render(<ItemBreakdownTable transactions={transactions} onItemClick={mockOnItemClick} />);

    const row = screen.getByText('Widget').closest('tr');
    expect(row).toBeInTheDocument();
    
    fireEvent.click(row!);

    expect(mockOnItemClick).toHaveBeenCalledTimes(1);
    expect(mockOnItemClick).toHaveBeenCalledWith('Widget');
  });

  it('displays table headers correctly', () => {
    const transactions: SalesTransaction[] = [
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
    ];

    render(<ItemBreakdownTable transactions={transactions} onItemClick={mockOnItemClick} />);

    expect(screen.getByText('Item')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Count')).toBeInTheDocument();
  });

  it('handles single transaction correctly', () => {
    const transactions: SalesTransaction[] = [
      {
        id: '1',
        item: 'Single Item',
        price: 99.99,
        date: '2024-01-01',
        description: 'Test',
        createdBy: 'user1',
      },
    ];

    render(<ItemBreakdownTable transactions={transactions} onItemClick={mockOnItemClick} />);

    expect(screen.getByText('Single Item')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
