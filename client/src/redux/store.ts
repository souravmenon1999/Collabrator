// src/redux/store.ts
import { configureStore } from '@reduxjs/toolkit';
import dataReducer from './reducers/dataReducer'; // Import the dataReducer
import notificationReducer from './reducers/notificationReducer'; // Import notification reducer
import modalReducer from './reducers/modalReducer';

export const store = configureStore({
  reducer: {
    data: dataReducer,
    modal: modalReducer,
    notifications: notificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
