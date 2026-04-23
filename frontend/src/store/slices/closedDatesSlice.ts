import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ClosedDate {
  id: string;
  startDate: string;
  endDate: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

interface ClosedDatesState {
  closedDates: ClosedDate[];
  loading: boolean;
  error: string | null;
}

const initialState: ClosedDatesState = {
  closedDates: [],
  loading: false,
  error: null,
};

const closedDatesSlice = createSlice({
  name: 'closedDates',
  initialState,
  reducers: {
    setClosedDates: (state, action: PayloadAction<ClosedDate[]>) => {
      state.closedDates = action.payload;
    },
    addClosedDate: (state, action: PayloadAction<ClosedDate>) => {
      state.closedDates.push(action.payload);
    },
    updateClosedDate: (state, action: PayloadAction<ClosedDate>) => {
      const index = state.closedDates.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.closedDates[index] = action.payload;
      }
    },
    deleteClosedDate: (state, action: PayloadAction<string>) => {
      state.closedDates = state.closedDates.filter(c => c.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setClosedDates,
  addClosedDate,
  updateClosedDate,
  deleteClosedDate,
  setLoading,
  setError,
} = closedDatesSlice.actions;

export default closedDatesSlice.reducer;
