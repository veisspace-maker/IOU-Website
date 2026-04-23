import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SalesStatsCards from './SalesStatsCards';
import { SalesTransaction } from '../api/salesApi';

describe('SalesStatsCards', () => {
  const mockTransactions: SalesTransaction[] = [
    {
      id: '1',
      item: 'Widget',
      price: 100.50,
      date: '2024-01-01',
      description: 'Test item 1',
      createdBy: 'user1',
    },
    {
      id: '2',
      item: 'Gadget',
      price: 250.75,
      date: '2024-01-02',
      description: 'Test item 2',
      createdBy: 'user1',
    },
    {
      id: '3',
      item: 'Widget',
      price: 50.25,
      date: '2024-01-03',
      description: null,
      createdBy: 'user2',
    },
  ];

  it('should display total revenue correctly', () => {
    render(<SalesStatsCards transactions={mockTransactions} />);
    
    // Total revenue should be 100.50 + 250.75 + 50.25 = 401.50
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('$401.50')).toBeInTheDocument();
  });

  it('should display total items sold correctly', () => {
    render(<SalesStatsCards transactions={mockTransactions} />);
    
    // Total items sold should be 3
    expect(screen.getByText('Total Items Sold')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should handle empty transaction list', () => {
    render(<SalesStatsCards transactions={[]} />);
    
    // Should show zero values
    expect(screen.getByText('$0.00')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should handle single transaction', () => {
    const singleTransaction: SalesTransaction[] = [
      {
        id: '1',
        item: 'Widget',
        price: 99.99,
        date: '2024-01-01',
        description: 'Single item',
        createdBy: 'user1',
      },
    ];

    render(<SalesStatsCards transactions={singleTransaction} />);
    
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should format revenue with two decimal places', () => {
    const transactions: SalesTransaction[] = [
      {
        id: '1',
        item: 'Widget',
        price: 100,
        date: '2024-01-01',
        description: null,
        createdBy: 'user1',
      },
    ];

    render(<SalesStatsCards transactions={transactions} />);
    
    // Should display as $100.00, not $100
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });

  it('should handle large numbers correctly', () => {
    const transactions: SalesTransaction[] = [
      {
        id: '1',
        item: 'Expensive Item',
        price: 9999.99,
        date: '2024-01-01',
        description: null,
        createdBy: 'user1',
      },
      {
        id: '2',
        item: 'Another Expensive Item',
        price: 10000.01,
        date: '2024-01-02',
        description: null,
        createdBy: 'user1',
      },
    ];

    render(<SalesStatsCards transactions={transactions} />);
    
    // Total should be 20000.00
    expect(screen.getByText('$20000.00')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
