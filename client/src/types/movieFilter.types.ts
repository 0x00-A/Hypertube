// ============================================================================
// Movie Filter Types
// ============================================================================

export interface IMovieFilters {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  genre?: string;
  minRating?: number;
  year?: number;
  page?: number;
  limit?: number;
}

export interface IMovieFiltersState {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  genre: string;
  minRating: number;
  year: number;
}

export const SORT_OPTIONS = [
  { value: 'lastUpdated', label: 'Last Updated' },
  { value: 'title', label: 'Title' },
  { value: 'rating', label: 'Rating' },
  { value: 'year', label: 'Year' },
] as const;

export const SORT_ORDER_OPTIONS = [
  { value: 'desc', label: 'Descending' },
  { value: 'asc', label: 'Ascending' },
] as const;

export const GENRES = [
  'All',
  'Action',
  'Adventure',
  'Animation',
  'Biography',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'Film-Noir',
  'History',
  'Horror',
  'Music',
  'Musical',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Sport',
  'Thriller',
  'War',
  'Western',
] as const;

export const YEARS = (() => {
  const currentYear = new Date().getFullYear();
  const years = ['All'];
  for (let year = currentYear; year >= 1900; year--) {
    years.push(year.toString());
  }
  return years;
})();

export const MIN_RATING_OPTIONS = [
  { value: 0, label: 'All Ratings' },
  { value: 5, label: '5+' },
  { value: 6, label: '6+' },
  { value: 7, label: '7+' },
  { value: 8, label: '8+' },
  { value: 9, label: '9+' },
] as const;
