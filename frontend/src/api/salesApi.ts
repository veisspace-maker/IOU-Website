import axios from 'axios';

export interface SalesTransaction {
  id: string;
  item: string;
  price: number;
  quantity: number;
  date: string;
  description: string | null;
  seller: string;
  createdBy: string;
  createdAt?: string;
}

export interface CreateSaleData {
  item: string;
  price: number;
  quantity: number;
  date: string;
  seller: string;
  description?: string;
}

export interface UpdateSaleData {
  item: string;
  price: number;
  quantity: number;
  date: string;
  seller: string;
  description?: string;
}

/**
 * Fetch all sales transactions
 * @returns Promise with array of sales transactions
 * @throws Error if the request fails
 */
export const fetchSales = async (): Promise<SalesTransaction[]> => {
  try {
    const response = await axios.get('/api/sales', { withCredentials: true });
    return response.data.transactions || [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error || 'Failed to fetch sales transactions';
      throw new Error(message);
    }
    throw new Error('Network error: Failed to fetch sales transactions');
  }
};

/**
 * Create a new sales transaction
 * @param data - The sales transaction data to create
 * @returns Promise with the created sales transaction
 * @throws Error if the request fails or validation fails
 */
export const createSale = async (data: CreateSaleData): Promise<SalesTransaction> => {
  try {
    const response = await axios.post('/api/sales', data, { withCredentials: true });
    return response.data.transaction;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error || 'Failed to create sales transaction';
      throw new Error(message);
    }
    throw new Error('Network error: Failed to create sales transaction');
  }
};

/**
 * Update an existing sales transaction
 * @param id - The ID of the transaction to update
 * @param data - The updated sales transaction data
 * @returns Promise with the updated sales transaction
 * @throws Error if the request fails, validation fails, or transaction not found
 */
export const updateSale = async (id: string, data: UpdateSaleData): Promise<SalesTransaction> => {
  try {
    const response = await axios.put(`/api/sales/${id}`, data, { withCredentials: true });
    return response.data.transaction;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error || 'Failed to update sales transaction';
      throw new Error(message);
    }
    throw new Error('Network error: Failed to update sales transaction');
  }
};

/**
 * Delete a sales transaction
 * @param id - The ID of the transaction to delete
 * @returns Promise that resolves when deletion is successful
 * @throws Error if the request fails or transaction not found
 */
export const deleteSale = async (id: string): Promise<void> => {
  try {
    await axios.delete(`/api/sales/${id}`, { withCredentials: true });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error || 'Failed to delete sales transaction';
      throw new Error(message);
    }
    throw new Error('Network error: Failed to delete sales transaction');
  }
};
