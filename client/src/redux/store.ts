import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import moviesReducer from "./slices/moviesSlice";
import movieFiltersReducer from "./slices/movieFiltersSlice";
import libraryFiltersReducer from "./slices/libraryFiltersSlice";
import historyFiltersReducer from "./slices/historyFiltersSlice";

// ============================================================================
// Store Configuration
// ============================================================================

export const store = configureStore({
  reducer: {
    auth: authReducer,
    movies: moviesReducer,
    movieFilters: movieFiltersReducer,
    libraryFilters: libraryFiltersReducer,
    historyFilters: historyFiltersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializable check
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
  devTools: import.meta.env.MODE !== "production",
});

// ============================================================================
// TypeScript Types
// ============================================================================

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
