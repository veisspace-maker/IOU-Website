import axios from 'axios';

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
  const response = await axios.get('/api/sales-items', {
    withCredentials: true,
  });
  return response.data.items;
};

// Create a new sales item
export const createSalesItem = async (data: CreateSalesItemData): Promise<SalesItem> => {
  const response = await axios.post('/api/sales-items', data, {
    withCredentials: true,
  });
  return response.data.item;
};

// Update a sales item
export const updateSalesItem = async (id: string, data: UpdateSalesItemData): Promise<SalesItem> => {
  const response = await axios.put(`/api/sales-items/${id}`, data, {
    withCredentials: true,
  });
  return response.data.item;
};

// Delete a sales item
export const deleteSalesItem = async (id: string): Promise<void> => {
  await axios.delete(`/api/sales-items/${id}`, {
    withCredentials: true,
  });
};
