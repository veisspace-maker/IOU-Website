import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Birthday {
  id: string;
  name: string;
  dateOfBirth: string;
  createdAt: string;
  updatedAt: string;
}

interface BirthdaysState {
  birthdays: Birthday[];
  loading: boolean;
  error: string | null;
}

const initialState: BirthdaysState = {
  birthdays: [],
  loading: false,
  error: null,
};

const birthdaysSlice = createSlice({
  name: 'birthdays',
  initialState,
  reducers: {
    setBirthdays: (state, action: PayloadAction<Birthday[]>) => {
      state.birthdays = action.payload;
    },
    addBirthday: (state, action: PayloadAction<Birthday>) => {
      state.birthdays.push(action.payload);
    },
    updateBirthday: (state, action: PayloadAction<Birthday>) => {
      const index = state.birthdays.findIndex((b: Birthday) => b.id === action.payload.id);
      if (index !== -1) {
        state.birthdays[index] = action.payload;
      }
    },
    deleteBirthday: (state, action: PayloadAction<string>) => {
      state.birthdays = state.birthdays.filter((b: Birthday) => b.id !== action.payload);
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
  setBirthdays,
  addBirthday,
  updateBirthday,
  deleteBirthday,
  setLoading,
  setError,
} = birthdaysSlice.actions;

export default birthdaysSlice.reducer;
