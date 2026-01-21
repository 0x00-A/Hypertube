import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  setTrendingLoading,
  setTrendingMovies,
  setTrendingError,
  setRecommendedLoading,
  setRecommendedMovies,
  setRecommendedError,
  setGenreLoading,
  setGenreMovies,
  setGenreError,
  setSelectedGenre,
  setSliderLoading,
  setSliderMovies,
  setSliderError,
} from '../redux/slices/moviesSlice';
import { movieService } from '../services/movie.service';

// ============================================================================
// Movies State Hook
// ============================================================================

export const useMoviesState = () => {
  return useAppSelector((state) => state.movies);
};

// ============================================================================
// Fetch Trending Movies Hook
// ============================================================================

export const useFetchTrendingMovies = (page: number = 1) => {
  const dispatch = useAppDispatch();
  const { trending } = useMoviesState();

  const fetchTrending = useCallback(async () => {
    try {
      dispatch(setTrendingLoading(true));
      const response = await movieService.getTrendingMovies(page);

      dispatch(setTrendingMovies({
        data: response.data,
        page: response.pagination.page,
        hasNextPage: response.pagination.hasNextPage,
      }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch trending movies';
      dispatch(setTrendingError(errorMessage));
    }
  }, [dispatch, page]);

  useEffect(() => {
    // Only fetch if we don't have data or if the page changed
    if (trending.data.length === 0 || trending.page !== page) {
      fetchTrending();
    }
  }, [page, trending.data.length, trending.page, fetchTrending]);

  return {
    trending: trending.data,
    isLoading: trending.isLoading,
    error: trending.error,
    refetch: fetchTrending,
  };
};

// ============================================================================
// Fetch Recommended Movies Hook
// ============================================================================

export const useFetchRecommendedMovies = (page: number = 1) => {
  const dispatch = useAppDispatch();
  const { recommended } = useMoviesState();

  const fetchRecommended = useCallback(async () => {
    try {
      dispatch(setRecommendedLoading(true));
      const response = await movieService.getRecommendedMovies(page);

      dispatch(setRecommendedMovies({
        data: response.data,
        page: response.pagination.page,
        hasNextPage: response.pagination.hasNextPage,
      }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch recommended movies';
      dispatch(setRecommendedError(errorMessage));
    }
  }, [dispatch, page]);

  useEffect(() => {
    // Only fetch if we don't have data or if the page changed
    if (recommended.data.length === 0 || recommended.page !== page) {
      fetchRecommended();
    }
  }, [page, recommended.data.length, recommended.page, fetchRecommended]);

  return {
    recommended: recommended.data,
    isLoading: recommended.isLoading,
    error: recommended.error,
    refetch: fetchRecommended,
  };
};

// ============================================================================
// Fetch Slider Movies Hook
// ============================================================================

export const useFetchSliderMovies = () => {
  const dispatch = useAppDispatch();
  const { slider } = useMoviesState();

  const fetchSlider = useCallback(async () => {
    try {
      dispatch(setSliderLoading(true));
      const response = await movieService.getSliderMovies();
      dispatch(setSliderMovies(response));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch slider movies';
      dispatch(setSliderError(errorMessage));
    }
  }, [dispatch]);

  useEffect(() => {
    if (slider.data.length === 0) {
      fetchSlider();
    }
  }, [slider.data.length, fetchSlider]);

  return {
    movies: slider.data,
    isLoading: slider.isLoading,
    error: slider.error,
    refetch: fetchSlider,
  };
};

// ============================================================================
// Combined Movies Hook (for convenience)
// ============================================================================

export const useMovies = () => {
  const trendingData = useFetchTrendingMovies();
  const recommendedData = useFetchRecommendedMovies();
  const sliderData = useFetchSliderMovies();

  return {
    trending: trendingData,
    recommended: recommendedData,
    slider: sliderData,
  };
};

// ============================================================================
// Fetch Genre Movies Hook
// ============================================================================

export const useFetchGenreMovies = (page: number = 1) => {
  const dispatch = useAppDispatch();
  const { genres } = useMoviesState();

  const fetchGenreMovies = useCallback(async () => {
    try {
      dispatch(setGenreLoading(true));

      // Use getAllMovies for 'All' genre, otherwise filter by genre
      const response = genres.selectedGenre === 'All'
        ? await movieService.getAllMovies({ page, limit: 20 })
        : await movieService.getMoviesByGenre(genres.selectedGenre, page);

      dispatch(setGenreMovies({
        data: response.data,
        page: response.pagination.page,
        hasNextPage: response.pagination.hasNextPage,
      }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch genre movies';
      dispatch(setGenreError(errorMessage));
    }
  }, [dispatch, page, genres.selectedGenre]);

  useEffect(() => {
    fetchGenreMovies();
  }, [page, genres.selectedGenre, fetchGenreMovies]);

  const changeGenre = useCallback((genre: string) => {
    dispatch(setSelectedGenre(genre));
  }, [dispatch]);

  return {
    movies: genres.data,
    isLoading: genres.isLoading,
    error: genres.error,
    selectedGenre: genres.selectedGenre,
    changeGenre,
    refetch: fetchGenreMovies,
  };
};
