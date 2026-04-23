import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LeaveRecord {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  businessDays: number;
  createdAt: string;
  updatedAt: string;
}

interface LeaveState {
  leaveRecords: LeaveRecord[];
  loading: boolean;
  error: string | null;
}

const initialState: LeaveState = {
  leaveRecords: [],
  loading: false,
  error: null,
};

const leaveSlice = createSlice({
  name: 'leave',
  initialState,
  reducers: {
    setLeaveRecords: (state, action: PayloadAction<LeaveRecord[]>) => {
      state.leaveRecords = action.payload;
    },
    addLeaveRecord: (state, action: PayloadAction<LeaveRecord>) => {
      state.leaveRecords.push(action.payload);
    },
    updateLeaveRecord: (state, action: PayloadAction<LeaveRecord>) => {
      const index = state.leaveRecords.findIndex(l => l.id === action.payload.id);
      if (index !== -1) {
        state.leaveRecords[index] = action.payload;
      }
    },
    deleteLeaveRecord: (state, action: PayloadAction<string>) => {
      state.leaveRecords = state.leaveRecords.filter(l => l.id !== action.payload);
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
  setLeaveRecords,
  addLeaveRecord,
  updateLeaveRecord,
  deleteLeaveRecord,
  setLoading,
  setError,
} = leaveSlice.actions;

export default leaveSlice.reducer;
