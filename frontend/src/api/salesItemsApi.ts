import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface SalesItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalesItemData {
  name: string;
}

export interface UpdateSalesItemData {
  name: string;
}

// Get all sales items
export const getSalesItems = async (): Promise<SalesItem[]> => {
  const response = await axios.get(`${API_BASE_URL}/api/sales-items`, {
    withCredentials: true,
  });
  return response.data.items;
};

// Create a new sales item
export const createSalesItem = async (data: CreateSalesItemData): Promise<SalesItem> => {
  const response = await axios.post(`${API_BASE_URL}/api/sales-items`, data, {
    withCredentials: true,
  });
  return response.data.item;
};

// Update a sales item
export const updateSalesItem = async (id: string, data: UpdateSalesItemData): Promise<SalesItem> => {
  const response = await axios.put(`${API_BASE_URL}/api/sales-items/${id}`, data, {
    withCredentials: true,
  });
  return response.data.item;
};

// Delete a sales item
export const deleteSalesItem = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/api/sales-items/${id}`, {
    withCredentials: true,
  });
};
