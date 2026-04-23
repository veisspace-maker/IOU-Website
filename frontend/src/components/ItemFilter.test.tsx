import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import ItemFilter from './ItemFilter';
import { SalesTransaction } from '../api/salesApi';

describe('ItemFilter', () => {
  const mockTransactions: SalesTransaction[] = [
    {
      id: '1',
      item: 'Widget',
      price: 100,
      date: '2024-01-01',
      description: 'Test widget',
      createdBy: 'user1',
    },
    {
      id: '2',
      item: 'widget',
      price: 50,
      date: '2024-01-02',
      description: null,
      createdBy: 'user1',
    },
    {
      id: '3',
      item: 'Gadget',
      price: 200,
      date: '2024-01-03',
      description: 'Test gadget',
      createdBy: 'user2',
    },
    {
      id: '4',
      item: '  WIDGET  ',
      price: 75,
      date: '2024-01-04',
      description: null,
      createdBy: 'user1',
    },
  ];

  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    mockOnFilterChange.mockClear();
  });

  test('renders filter dropdown with label', () => {
    render(
      <ItemFilter
        transactions={mockTransactions}
        selectedFilter="All"
        onFilterChange={mockOnFilterChange}
      />
    );

    expect(screen.getByLabelText('Filter by Item')).toBeInTheDocument();
  });

  test('includes "All" as first option', () => {
    render(
      <ItemFilter
        transactions={mockTransactions}
        selectedFilter="All"
        onFilterChange={mockOnFilterChange}
      />
    );

    // Click to open the dropdown
    const select = screen.getByLabelText('Filter by Item');
    fireEvent.mouseDown(select);

    // Check that "All" is present
    const allOption = screen.getByRole('option', { name: 'All' });
    expect(allOption).toBeInTheDocument();
  });

  test('generates unique item options using normalization', () => {
    render(
      <ItemFilter
        transactions={mockTransactions}
        selectedFilter="All"
        onFilterChange={mockOnFilterChange}
      />
    );

    // Click to open the dropdown
    const select = screen.getByLabelText('Filter by Item');
    fireEvent.mouseDown(select);

    // Should have "All", "Widget" (normalized from Widget/widget/WIDGET), and "Gadget"
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3); // All, Widget, Gadget

    // Check specific options
    expect(screen.getByRole('option', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Widget' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Gadget' })).toBeInTheDocument();
  });

  test('preserves original casing from first occurrence', () => {
    render(
      <ItemFilter
        transactions={mockTransactions}
        selectedFilter="All"
        onFilterChange={mockOnFilterChange}
      />
    );

    // Click to open the dropdown
    const select = screen.getByLabelText('Filter by Item');
    fireEvent.mouseDown(select);

    // Should use "Widget" (first occurrence) not "widget" or "WIDGET"
    expect(screen.getByRole('option', { name: 'Widget' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'widget' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'WIDGET' })).not.toBeInTheDocument();
  });

  test('calls onFilterChange when selection changes', () => {
    render(
      <ItemFilter
        transactions={mockTransactions}
        selectedFilter="All"
        onFilterChange={mockOnFilterChange}
      />
    );

    // Click to open the dropdown
    const select = screen.getByLabelText('Filter by Item');
    fireEvent.mouseDown(select);

    // Select "Widget"
    const widgetOption = screen.getByRole('option', { name: 'Widget' });
    fireEvent.click(widgetOption);

    expect(mockOnFilterChange).toHaveBeenCalledWith('Widget');
  });

  test('displays selected filter value', () => {
    const { rerender } = render(
      <ItemFilter
        transactions={mockTransactions}
        selectedFilter="All"
        onFilterChange={mockOnFilterChange}
      />
    );

    // Initially shows "All"
    expect(screen.getByLabelText('Filter by Item')).toHaveTextContent('All');

    // Change to "Widget"
    rerender(
      <ItemFilter
        transactions={mockTransactions}
        selectedFilter="Widget"
        onFilterChange={mockOnFilterChange}
      />
    );

    expect(screen.getByLabelText('Filter by Item')).toHaveTextContent('Widget');
  });

  test('handles empty transaction list', () => {
    render(
      <ItemFilter
        transactions={[]}
        selectedFilter="All"
        onFilterChange={mockOnFilterChange}
      />
    );

    // Click to open the dropdown
    const select = screen.getByLabelText('Filter by Item');
    fireEvent.mouseDown(select);

    // Should only have "All" option
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(screen.getByRole('option', { name: 'All' })).toBeInTheDocument();
  });

  test('handles single transaction', () => {
    const singleTransaction: SalesTransaction[] = [
      {
        id: '1',
        item: 'Widget',
        price: 100,
        date: '2024-01-01',
        description: null,
        createdBy: 'user1',
      },
    ];

    render(
      <ItemFilter
        transactions={singleTransaction}
        selectedFilter="All"
        onFilterChange={mockOnFilterChange}
      />
    );

    // Click to open the dropdown
    const select = screen.getByLabelText('Filter by Item');
    fireEvent.mouseDown(select);

    // Should have "All" and "Widget"
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
    expect(screen.getByRole('option', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Widget' })).toBeInTheDocument();
  });
});
