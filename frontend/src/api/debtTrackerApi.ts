import axios from 'axios';
import { Entity } from '../utils/debtTrackerUtils';

export interface DebtTransaction {
  id: string;
  from: Entity;
  to: Entity;
  amount: number;
  timestamp: number;
  description?: string;
}

export interface CreateDebtTransactionData {
  from: Entity;
  to: Entity;
  amount: number;
  timestamp?: number;
  description?: string;
}

export interface DebtResult {
  debtor: 'lev' | 'danik' | 'none';
  creditor: 'lev' | 'danik' | 'none';
  amount: number;
}

/**
 * Create a new debt transaction
 * @param data - The debt transaction data to create
 * @returns Promise with the created debt transaction
 * @throws Error if the request fails or validation fails
 */
export const createDebtTransaction = async (
  data: CreateDebtTransactionData
): Promise<DebtTransaction> => {
  try {
    const response = await axios.post('/api/debt-transactions-v2', data, {
      withCredentials: true,
    });
    return response.data.transaction;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data?.error;
      const message = typeof errorData === 'string' 
        ? errorData 
        : errorData?.message || 'Failed to create debt transaction';
      throw new Error(message);
    }
    throw new Error('Network error: Failed to create debt transaction');
  }
};

/**
 * Fetch the net debt between Lev and Danik
 * @returns Promise with the calculated net debt result
 * @throws Error if the request fails
 */
export const getNetDebt = async (): Promise<DebtResult> => {
  try {
    const response = await axios.get('/api/debt-transactions-v2/net-debt', {
      withCredentials: true,
    });
    return response.data.netDebt;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data?.error;
      const message = typeof errorData === 'string' 
        ? errorData 
        : errorData?.message || 'Failed to fetch net debt';
      throw new Error(message);
    }
    throw new Error('Network error: Failed to fetch net debt');
  }
};

/**
 * Fetch all debt transactions
 * @returns Promise with array of debt transactions
 * @throws Error if the request fails
 */
export const getDebtTransactions = async (): Promise<DebtTransaction[]> => {
  try {
    const response = await axios.get('/api/debt-transactions-v2', {
      withCredentials: true,
    });
    return response.data.transactions;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data?.error;
      const message = typeof errorData === 'string' 
        ? errorData 
        : errorData?.message || 'Failed to fetch debt transactions';
      throw new Error(message);
    }
    throw new Error('Network error: Failed to fetch debt transactions');
  }
};

/**
 * Update a debt transaction
 * @param id - The ID of the transaction to update
 * @param data - The updated transaction data
 * @returns Promise with the updated debt transaction
 * @throws Error if the request fails or validation fails
 */
export const updateDebtTransaction = async (
  id: string,
  data: CreateDebtTransactionData
): Promise<DebtTransaction> => {
  try {
    const response = await axios.put(`/api/debt-transactions-v2/${id}`, data, {
      withCredentials: true,
    });
    return response.data.transaction;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data?.error;
      const message = typeof errorData === 'string' 
        ? errorData 
        : errorData?.message || 'Failed to update debt transaction';
      throw new Error(message);
    }
    throw new Error('Network error: Failed to update debt transaction');
  }
};

/**
 * Delete a debt transaction
 * @param id - The ID of the transaction to delete
 * @returns Promise that resolves when deletion is complete
 * @throws Error if the request fails
 */
export const deleteDebtTransaction = async (id: string): Promise<void> => {
  try {
    await axios.delete(`/api/debt-transactions-v2/${id}`, {
      withCredentials: true,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data?.error;
      const message = typeof errorData === 'string' 
        ? errorData 
        : errorData?.message || 'Failed to delete debt transaction';
      throw new Error(message);
    }
    throw new Error('Network error: Failed to delete debt transaction');
  }
};
