import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import leaveReducer from './slices/leaveSlice';
import holidaysReducer from './slices/holidaysSlice';
import closedDatesReducer from './slices/closedDatesSlice';
import birthdaysReducer from './slices/birthdaysSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    leave: leaveReducer,
    holidays: holidaysReducer,
    closedDates: closedDatesReducer,
    birthdays: birthdaysReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
