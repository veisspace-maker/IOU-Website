import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PublicHoliday {
  id: string;
  name: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

interface HolidaysState {
  holidays: PublicHoliday[];
  loading: boolean;
  error: string | null;
}

const initialState: HolidaysState = {
  holidays: [],
  loading: false,
  error: null,
};

const holidaysSlice = createSlice({
  name: 'holidays',
  initialState,
  reducers: {
    setHolidays: (state, action: PayloadAction<PublicHoliday[]>) => {
      state.holidays = action.payload;
    },
    addHoliday: (state, action: PayloadAction<PublicHoliday>) => {
      state.holidays.push(action.payload);
    },
    updateHoliday: (state, action: PayloadAction<PublicHoliday>) => {
      const index = state.holidays.findIndex(h => h.id === action.payload.id);
      if (index !== -1) {
        state.holidays[index] = action.payload;
      }
    },
    deleteHoliday: (state, action: PayloadAction<string>) => {
      state.holidays = state.holidays.filter(h => h.id !== action.payload);
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
  setHolidays,
  addHoliday,
  updateHoliday,
  deleteHoliday,
  setLoading,
  setError,
} = holidaysSlice.actions;

export default holidaysSlice.reducer;
