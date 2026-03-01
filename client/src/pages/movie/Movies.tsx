import { useSearchParams, Link } from 'react-router-dom';
import { AlertCircle, Search, X, Lock } from 'lucide-react';
import { FilterBar, MovieCard, MovieCardSkeleton } from '../../components/movie';
import { useFilteredMovies } from '../../hooks/useFilteredMovies';
import { clsx } from 'clsx';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppDispatch } from '../../redux/hooks';
import { setGenre } from '../../redux/slices/movieFiltersSlice';
import { useDebounce } from '../../hooks/useDebounce';
import { useSearchMovies } from '../../hooks/useSearchMovies';
import SearchDropdown from '../../components/layout/SearchDropdown';
import { useAuthState } from '../../hooks/useAuth';

// ============================================================================
// Movies Page Component
// ============================================================================

export default function Movies() {
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { movies, isLoading, error, hasNextPage, loadMore } = useFilteredMovies();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuthState();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { data: searchResults, isLoading: isSearchLoading } = useSearchMovies(debouncedSearchQuery);

  const closeSearchDropdown = useCallback(() => {
    setIsSearchFocused(false);
    setSearchQuery('');
  }, []);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Set genre from URL query parameter on mount
  useEffect(() => {
    const genreParam = searchParams.get('genre');
    if (genreParam) {
      dispatch(setGenre(genreParam));
    }
  }, [searchParams, dispatch]);

  // Infinite scroll implementation
  useEffect(() => {
    if (!loadMoreRef.current || isLoading || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isLoading, hasNextPage, loadMore]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          {/* Title */}
          <div className="shrink-0">
            <h1 className="text-3xl font-bold text-white">Library</h1>
            <p className="text-text-secondary text-sm mt-0.5">Browse and discover movies</p>
          </div>

          {/* Search Bar */}
          {isAuthenticated ? (
            <div ref={searchContainerRef} className="relative w-full max-w-sm">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  className="w-full pl-10 pr-8 py-2 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={closeSearchDropdown}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {isSearchFocused && debouncedSearchQuery.length >= 2 && (
                <SearchDropdown
                  movies={searchResults?.data || []}
                  isLoading={isSearchLoading}
                  searchQuery={debouncedSearchQuery}
                  onClose={closeSearchDropdown}
                  hasResults={!!searchResults?.data && searchResults.data.length > 0}
                  isAuthenticated={isAuthenticated}
                />
              )}
            </div>
          ) : (
            <Link
              to="/auth/login"
              className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary border border-border rounded-xl text-sm text-text-muted hover:text-primary hover:border-primary transition-all whitespace-nowrap shrink-0"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Login to search</span>
            </Link>
          )}
        </div>

        {/* Filter Bar */}
        <FilterBar />

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 px-6 py-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-red-500 font-medium">Failed to load movies</p>
                <p className="text-text-secondary text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && movies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-center">
              <div className="mb-4">
                <svg
                  className="mx-auto h-24 w-24 text-text-secondary opacity-50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                  />
                </svg>
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">No movies found</h3>
              <p className="text-text-secondary text-sm mb-6">
                Try adjusting your filters to see more results
              </p>
            </div>
          </div>
        )}

        {/* Movies Grid */}
        {!error && movies.length > 0 && (
          <>
            <div
              className={clsx(
                'grid gap-2 sm:gap-2 md:gap-2',
                'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              )}
            >
              {movies.map((movie) => (
                <MovieCard
                  key={movie._id || movie.imdbId}
                  movie={movie}
                />
              ))}
            </div>

            {/* Loading more indicator - Skeleton cards */}
            {isLoading && movies.length > 0 && (
              <div
                className={clsx(
                  'grid gap-2 sm:gap-2 md:gap-2 mt-4',
                  'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                )}
              >
                {Array.from({ length: 10 }).map((_, index) => (
                  <MovieCardSkeleton key={`loading-${index}`} />
                ))}
              </div>
            )}

            {/* Infinite scroll trigger */}
            {hasNextPage && !isLoading && (
              <div ref={loadMoreRef} className="py-8 flex justify-center">
                <div className="text-text-secondary text-sm">Loading more...</div>
              </div>
            )}

            {/* End of results */}
            {!hasNextPage && movies.length > 0 && (
              <div className="text-center py-8 text-text-secondary text-sm">
                You've reached the end of the results
              </div>
            )}
          </>
        )}

        {/* Initial Loading State - Skeleton cards */}
        {isLoading && movies.length === 0 && (
          <div
            className={clsx(
              'grid gap-2 sm:gap-2 md:gap-2',
              'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            )}
          >
            {Array.from({ length: 20 }).map((_, index) => (
              <MovieCardSkeleton key={`skeleton-${index}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
