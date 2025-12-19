import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { IMovieFiltersState } from '../../types/movieFilter.types';

// ============================================================================
// Initial State
// ============================================================================

const initialState: IMovieFiltersState = {
  sortBy: 'lastUpdated',
  sortOrder: 'desc',
  genre: 'All',
  minRating: 0,
  year: 0,
};

// ============================================================================
// Movie Filters Slice
// ============================================================================

const movieFiltersSlice = createSlice({
  name: 'movieFilters',
  initialState,
  reducers: {
    // Set individual filter
    setSortBy: (state, action: PayloadAction<string>) => {
      state.sortBy = action.payload;
    },

    setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.sortOrder = action.payload;
    },

    setGenre: (state, action: PayloadAction<string>) => {
      state.genre = action.payload;
    },

    setMinRating: (state, action: PayloadAction<number>) => {
      state.minRating = action.payload;
    },

    setYear: (state, action: PayloadAction<number>) => {
      state.year = action.payload;
    },

    // Set multiple filters at once
    setFilters: (state, action: PayloadAction<Partial<IMovieFiltersState>>) => {
      return { ...state, ...action.payload };
    },

    // Reset all filters to initial state
    resetFilters: () => initialState,
  },
});

// ============================================================================
// Actions & Reducer Export
// ============================================================================

export const {
  setSortBy,
  setSortOrder,
  setGenre,
  setMinRating,
  setYear,
  setFilters,
  resetFilters,
} = movieFiltersSlice.actions;

export default movieFiltersSlice.reducer;
