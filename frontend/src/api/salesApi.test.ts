import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { fetchSales, createSale, updateSale, deleteSale } from './salesApi';
import type { SalesTransaction, CreateSaleData, UpdateSaleData } from './salesApi';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

describe('salesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchSales', () => {
    it('should fetch all sales transactions successfully', async () => {
      const mockTransactions: SalesTransaction[] = [
        {
          id: '1',
          item: 'Widget',
          price: 29.99,
          date: '2024-01-15',
          description: 'Test sale',
          createdBy: 'user1',
        },
        {
          id: '2',
          item: 'Gadget',
          price: 49.99,
          date: '2024-01-16',
          description: null,
          createdBy: 'user2',
        },
      ];

      mockedAxios.get.mockResolvedValue({
        data: { transactions: mockTransactions },
      });

      const result = await fetchSales();

      expect(result).toEqual(mockTransactions);
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/sales', { withCredentials: true });
    });

    it('should return empty array when no transactions exist', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { transactions: [] },
      });

      const result = await fetchSales();

      expect(result).toEqual([]);
    });

    it('should handle missing transactions field in response', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {},
      });

      const result = await fetchSales();

      expect(result).toEqual([]);
    });

    it('should throw error with API error message on failure', async () => {
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        response: { data: { error: 'Database connection failed' } },
      });
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      await expect(fetchSales()).rejects.toThrow('Database connection failed');
    });

    it('should throw generic error message when API error message is missing', async () => {
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        response: { data: {} },
      });
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      await expect(fetchSales()).rejects.toThrow('Failed to fetch sales transactions');
    });

    it('should throw network error for non-axios errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network failure'));
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(false);

      await expect(fetchSales()).rejects.toThrow('Network error: Failed to fetch sales transactions');
    });
  });

  describe('createSale', () => {
    it('should create a new sales transaction successfully', async () => {
      const createData: CreateSaleData = {
        item: 'New Widget',
        price: 39.99,
        date: '2024-01-17',
        description: 'New sale',
      };

      const mockTransaction: SalesTransaction = {
        id: '3',
        ...createData,
        createdBy: 'user1',
      };

      mockedAxios.post.mockResolvedValue({
        data: { transaction: mockTransaction },
      });

      const result = await createSale(createData);

      expect(result).toEqual(mockTransaction);
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/sales', createData, { withCredentials: true });
    });

    it('should create transaction without description', async () => {
      const createData: CreateSaleData = {
        item: 'Widget',
        price: 29.99,
        date: '2024-01-17',
      };

      const mockTransaction: SalesTransaction = {
        id: '4',
        item: 'Widget',
        price: 29.99,
        date: '2024-01-17',
        description: null,
        createdBy: 'user1',
      };

      mockedAxios.post.mockResolvedValue({
        data: { transaction: mockTransaction },
      });

      const result = await createSale(createData);

      expect(result).toEqual(mockTransaction);
    });

    it('should throw error with validation message on invalid input', async () => {
      const createData: CreateSaleData = {
        item: '',
        price: 29.99,
        date: '2024-01-17',
      };

      mockedAxios.post.mockRejectedValue({
        isAxiosError: true,
        response: { data: { error: 'Item name cannot be empty' } },
      });
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      await expect(createSale(createData)).rejects.toThrow('Item name cannot be empty');
    });

    it('should throw error for missing required fields', async () => {
      const createData = {
        item: 'Widget',
        price: 29.99,
      } as CreateSaleData;

      mockedAxios.post.mockRejectedValue({
        isAxiosError: true,
        response: { data: { error: 'Missing required fields: item, price, date' } },
      });
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      await expect(createSale(createData)).rejects.toThrow('Missing required fields: item, price, date');
    });

    it('should throw network error for non-axios errors', async () => {
      const createData: CreateSaleData = {
        item: 'Widget',
        price: 29.99,
        date: '2024-01-17',
      };

      mockedAxios.post.mockRejectedValue(new Error('Network failure'));
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(false);

      await expect(createSale(createData)).rejects.toThrow('Network error: Failed to create sales transaction');
    });
  });

  describe('updateSale', () => {
    it('should update an existing sales transaction successfully', async () => {
      const updateData: UpdateSaleData = {
        item: 'Updated Widget',
        price: 34.99,
        date: '2024-01-18',
        description: 'Updated description',
      };

      const mockTransaction: SalesTransaction = {
        id: '1',
        ...updateData,
        createdBy: 'user1',
      };

      mockedAxios.put.mockResolvedValue({
        data: { transaction: mockTransaction },
      });

      const result = await updateSale('1', updateData);

      expect(result).toEqual(mockTransaction);
      expect(mockedAxios.put).toHaveBeenCalledWith('/api/sales/1', updateData, { withCredentials: true });
    });

    it('should update transaction and clear description', async () => {
      const updateData: UpdateSaleData = {
        item: 'Widget',
        price: 29.99,
        date: '2024-01-18',
        description: '',
      };

      const mockTransaction: SalesTransaction = {
        id: '1',
        item: 'Widget',
        price: 29.99,
        date: '2024-01-18',
        description: null,
        createdBy: 'user1',
      };

      mockedAxios.put.mockResolvedValue({
        data: { transaction: mockTransaction },
      });

      const result = await updateSale('1', updateData);

      expect(result.description).toBeNull();
    });

    it('should throw error when transaction not found', async () => {
      const updateData: UpdateSaleData = {
        item: 'Widget',
        price: 29.99,
        date: '2024-01-18',
      };

      mockedAxios.put.mockRejectedValue({
        isAxiosError: true,
        response: { data: { error: 'Transaction not found' }, status: 404 },
      });
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      await expect(updateSale('nonexistent', updateData)).rejects.toThrow('Transaction not found');
    });

    it('should throw error with validation message on invalid input', async () => {
      const updateData: UpdateSaleData = {
        item: '  ',
        price: 29.99,
        date: '2024-01-18',
      };

      mockedAxios.put.mockRejectedValue({
        isAxiosError: true,
        response: { data: { error: 'Item name cannot be empty' } },
      });
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      await expect(updateSale('1', updateData)).rejects.toThrow('Item name cannot be empty');
    });

    it('should throw network error for non-axios errors', async () => {
      const updateData: UpdateSaleData = {
        item: 'Widget',
        price: 29.99,
        date: '2024-01-18',
      };

      mockedAxios.put.mockRejectedValue(new Error('Network failure'));
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(false);

      await expect(updateSale('1', updateData)).rejects.toThrow('Network error: Failed to update sales transaction');
    });
  });

  describe('deleteSale', () => {
    it('should delete a sales transaction successfully', async () => {
      mockedAxios.delete.mockResolvedValue({
        data: { message: 'Sales transaction deleted successfully' },
      });

      await expect(deleteSale('1')).resolves.toBeUndefined();
      expect(mockedAxios.delete).toHaveBeenCalledWith('/api/sales/1', { withCredentials: true });
    });

    it('should throw error when transaction not found', async () => {
      mockedAxios.delete.mockRejectedValue({
        isAxiosError: true,
        response: { data: { error: 'Transaction not found' }, status: 404 },
      });
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      await expect(deleteSale('nonexistent')).rejects.toThrow('Transaction not found');
    });

    it('should throw generic error message when API error message is missing', async () => {
      mockedAxios.delete.mockRejectedValue({
        isAxiosError: true,
        response: { data: {} },
      });
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      await expect(deleteSale('1')).rejects.toThrow('Failed to delete sales transaction');
    });

    it('should throw network error for non-axios errors', async () => {
      mockedAxios.delete.mockRejectedValue(new Error('Network failure'));
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(false);

      await expect(deleteSale('1')).rejects.toThrow('Network error: Failed to delete sales transaction');
    });
  });
});
