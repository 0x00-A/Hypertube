import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { IMovie } from '../../types/movie.types';

// ============================================================================
// Types
// ============================================================================

export interface MoviesState {
  trending: {
    data: IMovie[];
    isLoading: boolean;
    error: string | null;
    page: number;
    hasNextPage: boolean;
  };
  recommended: {
    data: IMovie[];
    isLoading: boolean;
    error: string | null;
    page: number;
    hasNextPage: boolean;
  };
  genres: {
    data: IMovie[];
    isLoading: boolean;
    error: string | null;
    page: number;
    hasNextPage: boolean;
    selectedGenre: string;
  };
  slider: {
    data: IMovie[];
    isLoading: boolean;
    error: string | null;
  };
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: MoviesState = {
  trending: {
    data: [],
    isLoading: false,
    error: null,
    page: 1,
    hasNextPage: false,
  },
  recommended: {
    data: [],
    isLoading: false,
    error: null,
    page: 1,
    hasNextPage: false,
  },
  genres: {
    data: [],
    isLoading: false,
    error: null,
    page: 1,
    hasNextPage: false,
    selectedGenre: 'Drama',
  },
  slider: {
    data: [],
    isLoading: false,
    error: null,
  },
};

// ============================================================================
// Movies Slice
// ============================================================================

const moviesSlice = createSlice({
  name: 'movies',
  initialState,
  reducers: {
    // Trending Movies Actions
    setTrendingLoading: (state, action: PayloadAction<boolean>) => {
      state.trending.isLoading = action.payload;
    },
    setTrendingMovies: (state, action: PayloadAction<{ data: IMovie[]; page: number; hasNextPage: boolean }>) => {
      state.trending.data = action.payload.data;
      state.trending.page = action.payload.page;
      state.trending.hasNextPage = action.payload.hasNextPage;
      state.trending.isLoading = false;
      state.trending.error = null;
    },
    setTrendingError: (state, action: PayloadAction<string>) => {
      state.trending.error = action.payload;
      state.trending.isLoading = false;
    },
    clearTrendingMovies: (state) => {
      state.trending = initialState.trending;
    },

    // Recommended Movies Actions
    setRecommendedLoading: (state, action: PayloadAction<boolean>) => {
      state.recommended.isLoading = action.payload;
    },
    setRecommendedMovies: (state, action: PayloadAction<{ data: IMovie[]; page: number; hasNextPage: boolean }>) => {
      state.recommended.data = action.payload.data;
      state.recommended.page = action.payload.page;
      state.recommended.hasNextPage = action.payload.hasNextPage;
      state.recommended.isLoading = false;
      state.recommended.error = null;
    },
    setRecommendedError: (state, action: PayloadAction<string>) => {
      state.recommended.error = action.payload;
      state.recommended.isLoading = false;
    },
    clearRecommendedMovies: (state) => {
      state.recommended = initialState.recommended;
    },

    // Genre Movies Actions
    setGenreLoading: (state, action: PayloadAction<boolean>) => {
      state.genres.isLoading = action.payload;
    },
    setGenreMovies: (state, action: PayloadAction<{ data: IMovie[]; page: number; hasNextPage: boolean }>) => {
      state.genres.data = action.payload.data;
      state.genres.page = action.payload.page;
      state.genres.hasNextPage = action.payload.hasNextPage;
      state.genres.isLoading = false;
      state.genres.error = null;
    },
    setGenreError: (state, action: PayloadAction<string>) => {
      state.genres.error = action.payload;
      state.genres.isLoading = false;
    },
    setSelectedGenre: (state, action: PayloadAction<string>) => {
      state.genres.selectedGenre = action.payload;
      state.genres.data = [];
      state.genres.page = 1;
    },
    clearGenreMovies: (state) => {
      state.genres = initialState.genres;
    },

    // Slider Movies Actions
    setSliderLoading: (state, action: PayloadAction<boolean>) => {
      state.slider.isLoading = action.payload;
    },
    setSliderMovies: (state, action: PayloadAction<IMovie[]>) => {
      state.slider.data = action.payload;
      state.slider.isLoading = false;
      state.slider.error = null;
    },
    setSliderError: (state, action: PayloadAction<string>) => {
      state.slider.error = action.payload;
      state.slider.isLoading = false;
    },
    clearSliderMovies: (state) => {
      state.slider = initialState.slider;
    },

    // Reset all movies state
    resetMovies: () => initialState,
  },
});

// ============================================================================
// Actions & Reducer Export
// ============================================================================

export const {
  setTrendingLoading,
  setTrendingMovies,
  setTrendingError,
  clearTrendingMovies,
  setRecommendedLoading,
  setRecommendedMovies,
  setRecommendedError,
  clearRecommendedMovies,
  setGenreLoading,
  setGenreMovies,
  setGenreError,
  setSelectedGenre,
  clearGenreMovies,
  setSliderLoading,
  setSliderMovies,
  setSliderError,
  clearSliderMovies,
  resetMovies,
} = moviesSlice.actions;

export default moviesSlice.reducer;
