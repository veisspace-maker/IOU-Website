import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import SalesPage from './SalesPage';
import { AuthProvider } from '../contexts/AuthContext';
import * as salesApi from '../api/salesApi';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock AuthContext
const mockUser = {
  id: 'test-user-id',
  username: 'testuser',
};

vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: mockUser,
      loading: false,
    }),
  };
});

// Mock salesApi
vi.mock('../api/salesApi', () => ({
  fetchSales: vi.fn(),
  createSale: vi.fn(),
  updateSale: vi.fn(),
  deleteSale: vi.fn(),
}));

const renderSalesPage = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <SalesPage />
        </LocalizationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('SalesPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    // Mock fetchSales to return empty array by default
    vi.mocked(salesApi.fetchSales).mockResolvedValue([]);
  });

  describe('Navigation and Page Structure', () => {
    it('should render the page title', () => {
      renderSalesPage();
      expect(screen.getByText('Sales Tracker')).toBeInTheDocument();
    });

    it('should render back button that navigates to home', () => {
      renderSalesPage();
      const backButton = screen.getByLabelText('back');
      expect(backButton).toBeInTheDocument();
      
      fireEvent.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should render settings button that navigates to settings', () => {
      renderSalesPage();
      const settingsButton = screen.getByLabelText('settings');
      expect(settingsButton).toBeInTheDocument();
      
      fireEvent.click(settingsButton);
      expect(mockNavigate).toHaveBeenCalledWith('/settings');
    });

    it('should display the username', () => {
      renderSalesPage();
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });
  });

  describe('Tab Structure', () => {
    it('should render two tabs: Transactions and Stats', () => {
      renderSalesPage();
      
      const transactionsTab = screen.getByRole('tab', { name: /transactions/i });
      const statsTab = screen.getByRole('tab', { name: /stats/i });
      
      expect(transactionsTab).toBeInTheDocument();
      expect(statsTab).toBeInTheDocument();
    });

    it('should have Transactions tab selected by default', () => {
      renderSalesPage();
      
      const transactionsTab = screen.getByRole('tab', { name: /transactions/i });
      expect(transactionsTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should display Transactions tab content by default', async () => {
      renderSalesPage();
      
      // Wait for the form to render
      await waitFor(() => {
        expect(screen.getByText('Add Sales Transaction')).toBeInTheDocument();
      });
    });

    it('should not display Stats tab content by default', async () => {
      renderSalesPage();
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Add Sales Transaction')).toBeInTheDocument();
      });
      
      // Stats content should not be visible
      expect(screen.queryByText('Sales Statistics')).not.toBeInTheDocument();
    });
  });

  describe('Tab Switching Behavior', () => {
    it('should switch to Stats tab when clicked', async () => {
      renderSalesPage();
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Add Sales Transaction')).toBeInTheDocument();
      });
      
      const statsTab = screen.getByRole('tab', { name: /stats/i });
      fireEvent.click(statsTab);
      
      expect(statsTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Sales Statistics')).toBeInTheDocument();
      expect(screen.getByText('Sales statistics and analysis will be implemented here.')).toBeInTheDocument();
    });

    it('should hide Transactions content when Stats tab is active', async () => {
      renderSalesPage();
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Add Sales Transaction')).toBeInTheDocument();
      });
      
      const statsTab = screen.getByRole('tab', { name: /stats/i });
      fireEvent.click(statsTab);
      
      // Transactions content should not be visible
      expect(screen.queryByText('Add Sales Transaction')).not.toBeInTheDocument();
    });

    it('should switch back to Transactions tab when clicked', async () => {
      renderSalesPage();
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Add Sales Transaction')).toBeInTheDocument();
      });
      
      // First switch to Stats
      const statsTab = screen.getByRole('tab', { name: /stats/i });
      fireEvent.click(statsTab);
      
      expect(statsTab).toHaveAttribute('aria-selected', 'true');
      
      // Then switch back to Transactions
      const transactionsTab = screen.getByRole('tab', { name: /transactions/i });
      fireEvent.click(transactionsTab);
      
      expect(transactionsTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Add Sales Transaction')).toBeInTheDocument();
    });

    it('should maintain tab state during multiple switches', async () => {
      renderSalesPage();
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Add Sales Transaction')).toBeInTheDocument();
      });
      
      const transactionsTab = screen.getByRole('tab', { name: /transactions/i });
      const statsTab = screen.getByRole('tab', { name: /stats/i });
      
      // Switch to Stats
      fireEvent.click(statsTab);
      expect(statsTab).toHaveAttribute('aria-selected', 'true');
      
      // Switch back to Transactions
      fireEvent.click(transactionsTab);
      expect(transactionsTab).toHaveAttribute('aria-selected', 'true');
      
      // Switch to Stats again
      fireEvent.click(statsTab);
      expect(statsTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Sales Statistics')).toBeInTheDocument();
    });
  });

  describe('Route Navigation', () => {
    it('should be accessible via /sales route', () => {
      // This test verifies the component renders without errors
      // The actual route configuration is tested in App.tsx integration tests
      renderSalesPage();
      expect(screen.getByText('Sales Tracker')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for tabs', async () => {
      renderSalesPage();
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Add Sales Transaction')).toBeInTheDocument();
      });
      
      const transactionsTab = screen.getByRole('tab', { name: /transactions/i });
      const statsTab = screen.getByRole('tab', { name: /stats/i });
      
      expect(transactionsTab).toHaveAttribute('id', 'sales-tab-0');
      expect(transactionsTab).toHaveAttribute('aria-controls', 'sales-tabpanel-0');
      expect(statsTab).toHaveAttribute('id', 'sales-tab-1');
      expect(statsTab).toHaveAttribute('aria-controls', 'sales-tabpanel-1');
    });

    it('should have proper ARIA labels for tab panels', async () => {
      renderSalesPage();
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Add Sales Transaction')).toBeInTheDocument();
      });
      
      // Get the visible transactions panel
      const transactionsPanel = screen.getByRole('tabpanel');
      
      expect(transactionsPanel).toHaveAttribute('id', 'sales-tabpanel-0');
      expect(transactionsPanel).toHaveAttribute('aria-labelledby', 'sales-tab-0');
      
      // Switch to stats tab to check its panel
      const statsTab = screen.getByRole('tab', { name: /stats/i });
      fireEvent.click(statsTab);
      
      const statsPanel = screen.getByRole('tabpanel');
      expect(statsPanel).toHaveAttribute('id', 'sales-tabpanel-1');
      expect(statsPanel).toHaveAttribute('aria-labelledby', 'sales-tab-1');
    });

    it('should have proper ARIA labels for navigation buttons', async () => {
      renderSalesPage();
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Add Sales Transaction')).toBeInTheDocument();
      });
      
      expect(screen.getByLabelText('back')).toBeInTheDocument();
      expect(screen.getByLabelText('settings')).toBeInTheDocument();
    });
  });
});

  describe('Transaction Update Functionality', () => {
    const mockTransaction = {
      id: 'test-id-1',
      item: 'Test Item',
      price: 100,
      date: '2024-01-15',
      description: 'Test description',
      createdBy: 'test-user-id',
    };

    beforeEach(() => {
      vi.mocked(salesApi.fetchSales).mockResolvedValue([mockTransaction]);
    });

    it('should open edit dialog when edit button is clicked', async () => {
      renderSalesPage();
      
      // Wait for transaction to load
      await waitFor(() => {
        expect(screen.getByText('Test Item')).toBeInTheDocument();
      });
      
      // Click edit button
      const editButtons = screen.getAllByLabelText(/edit/i);
      fireEvent.click(editButtons[0]);
      
      // Edit dialog should open
      await waitFor(() => {
        expect(screen.getByText('Edit Sales Transaction')).toBeInTheDocument();
      });
    });

    it('should populate edit form with transaction data', async () => {
      renderSalesPage();
      
      // Wait for transaction to load
      await waitFor(() => {
        expect(screen.getByText('Test Item')).toBeInTheDocument();
      });
      
      // Click edit button
      const editButtons = screen.getAllByLabelText(/edit/i);
      fireEvent.click(editButtons[0]);
      
      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByText('Edit Sales Transaction')).toBeInTheDocument();
      });
      
      // Check form fields are populated
      const itemInput = screen.getByDisplayValue('Test Item');
      const priceInput = screen.getByDisplayValue('100');
      const descriptionInput = screen.getByDisplayValue('Test description');
      
      expect(itemInput).toBeInTheDocument();
      expect(priceInput).toBeInTheDocument();
      expect(descriptionInput).toBeInTheDocument();
    });

    it('should call updateSale API when save button is clicked', async () => {
      vi.mocked(salesApi.updateSale).mockResolvedValue({
        ...mockTransaction,
        item: 'Updated Item',
        price: 150,
      });
      
      renderSalesPage();
      
      // Wait for transaction to load
      await waitFor(() => {
        expect(screen.getByText('Test Item')).toBeInTheDocument();
      });
      
      // Click edit button
      const editButtons = screen.getAllByLabelText(/edit/i);
      fireEvent.click(editButtons[0]);
      
      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByText('Edit Sales Transaction')).toBeInTheDocument();
      });
      
      // Update item name
      const itemInput = screen.getByDisplayValue('Test Item');
      fireEvent.change(itemInput, { target: { value: 'Updated Item' } });
      
      // Update price
      const priceInput = screen.getByDisplayValue('100');
      fireEvent.change(priceInput, { target: { value: '150' } });
      
      // Click save button
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);
      
      // Verify API was called with correct data
      await waitFor(() => {
        expect(salesApi.updateSale).toHaveBeenCalledWith('test-id-1', {
          item: 'Updated Item',
          price: 150,
          date: '2024-01-15',
          description: 'Test description',
        });
      });
    });

    it('should refresh transaction list after successful update', async () => {
      const updatedTransaction = {
        ...mockTransaction,
        item: 'Updated Item',
        price: 150,
      };
      
      vi.mocked(salesApi.updateSale).mockResolvedValue(updatedTransaction);
      vi.mocked(salesApi.fetchSales)
        .mockResolvedValueOnce([mockTransaction])
        .mockResolvedValue([updatedTransaction]);
      
      renderSalesPage();
      
      // Wait for initial transaction to load
      await waitFor(() => {
        expect(screen.getByText('Test Item')).toBeInTheDocument();
      });
      
      const initialCallCount = vi.mocked(salesApi.fetchSales).mock.calls.length;
      
      // Click edit button
      const editButtons = screen.getAllByLabelText(/edit/i);
      fireEvent.click(editButtons[0]);
      
      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByText('Edit Sales Transaction')).toBeInTheDocument();
      });
      
      // Update item name
      const itemInput = screen.getByDisplayValue('Test Item');
      fireEvent.change(itemInput, { target: { value: 'Updated Item' } });
      
      // Click save button
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);
      
      // Verify fetchSales was called again to refresh the list
      await waitFor(() => {
        expect(salesApi.fetchSales).toHaveBeenCalledTimes(initialCallCount + 1);
      });
    });

    it('should show success message after successful update', async () => {
      vi.mocked(salesApi.updateSale).mockResolvedValue({
        ...mockTransaction,
        item: 'Updated Item',
      });
      
      renderSalesPage();
      
      // Wait for transaction to load
      await waitFor(() => {
        expect(screen.getByText('Test Item')).toBeInTheDocument();
      });
      
      // Click edit button
      const editButtons = screen.getAllByLabelText(/edit/i);
      fireEvent.click(editButtons[0]);
      
      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByText('Edit Sales Transaction')).toBeInTheDocument();
      });
      
      // Update item name
      const itemInput = screen.getByDisplayValue('Test Item');
      fireEvent.change(itemInput, { target: { value: 'Updated Item' } });
      
      // Click save button
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);
      
      // Verify success message is shown
      await waitFor(() => {
        expect(screen.getByText('Sales transaction updated successfully!')).toBeInTheDocument();
      });
    });

    it('should close edit dialog when cancel button is clicked', async () => {
      renderSalesPage();
      
      // Wait for transaction to load
      await waitFor(() => {
        expect(screen.getByText('Test Item')).toBeInTheDocument();
      });
      
      // Click edit button
      const editButtons = screen.getAllByLabelText(/edit/i);
      fireEvent.click(editButtons[0]);
      
      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByText('Edit Sales Transaction')).toBeInTheDocument();
      });
      
      // Click cancel button
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText('Edit Sales Transaction')).not.toBeInTheDocument();
      });
    });

    it('should preserve id and createdBy fields when updating', async () => {
      vi.mocked(salesApi.updateSale).mockResolvedValue({
        ...mockTransaction,
        item: 'Updated Item',
      });
      
      renderSalesPage();
      
      // Wait for transaction to load
      await waitFor(() => {
        expect(screen.getByText('Test Item')).toBeInTheDocument();
      });
      
      // Click edit button
      const editButtons = screen.getAllByLabelText(/edit/i);
      fireEvent.click(editButtons[0]);
      
      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByText('Edit Sales Transaction')).toBeInTheDocument();
      });
      
      // Update item name
      const itemInput = screen.getByDisplayValue('Test Item');
      fireEvent.change(itemInput, { target: { value: 'Updated Item' } });
      
      // Click save button
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);
      
      // Verify API was called with transaction ID (preserving id)
      await waitFor(() => {
        expect(salesApi.updateSale).toHaveBeenCalledWith('test-id-1', expect.any(Object));
      });
      
      // The API call should not include id or createdBy in the update data
      const updateData = vi.mocked(salesApi.updateSale).mock.calls[0][1];
      expect(updateData).not.toHaveProperty('id');
      expect(updateData).not.toHaveProperty('createdBy');
    });

    it('should show error message when update fails', async () => {
      vi.mocked(salesApi.updateSale).mockRejectedValue(new Error('Update failed'));
      
      renderSalesPage();
      
      // Wait for transaction to load
      await waitFor(() => {
        expect(screen.getByText('Test Item')).toBeInTheDocument();
      });
      
      // Click edit button
      const editButtons = screen.getAllByLabelText(/edit/i);
      fireEvent.click(editButtons[0]);
      
      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByText('Edit Sales Transaction')).toBeInTheDocument();
      });
      
      // Update item name
      const itemInput = screen.getByDisplayValue('Test Item');
      fireEvent.change(itemInput, { target: { value: 'Updated Item' } });
      
      // Click save button
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);
      
      // Verify error message is shown
      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument();
      });
    });
  });
