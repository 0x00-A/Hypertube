import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User, AuthState } from '../../types/auth.types';

// ============================================================================
// Initial State
// ============================================================================

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isInitialized: false,
};

// ============================================================================
// Auth Slice
// ============================================================================

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Set user and mark as authenticated
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isInitialized = true;
    },

    // Update user information
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    // Clear user and mark as unauthenticated
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
    },

    // Initialize auth state (for app startup)
    initializeAuth: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = action.payload !== null;
      state.isInitialized = true;
    },

    // Reset auth state completely
    resetAuth: () => initialState,
  },
});

// ============================================================================
// Actions & Reducer Export
// ============================================================================

export const { setUser, updateUser, clearUser, initializeAuth, resetAuth } = authSlice.actions;

export default authSlice.reducer;
