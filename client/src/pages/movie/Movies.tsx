import { useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { FilterBar, MovieCard, MovieCardSkeleton } from '../../components/movie';
import { useFilteredMovies } from '../../hooks/useFilteredMovies';
import { clsx } from 'clsx';
import { useEffect, useRef } from 'react';
import { useAppDispatch } from '../../redux/hooks';
import { setGenre } from '../../redux/slices/movieFiltersSlice';

// ============================================================================
// Movies Page Component
// ============================================================================

export default function Movies() {
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { movies, isLoading, error, hasNextPage, loadMore } = useFilteredMovies();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Set genre from URL query parameter on mount
  useEffect(() => {
    const genreParam = searchParams.get('genre');
    if (genreParam) {
      dispatch(setGenre(genreParam));
    }
  }, [searchParams, dispatch]);

  const handleWatchlistToggle = () => {
    // Watchlist toggle functionality will be implemented
  };

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
                'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              )}
            >
              {movies.map((movie) => (
                <MovieCard
                  key={movie._id || movie.imdbId}
                  movie={movie}
                  onWatchlistToggle={handleWatchlistToggle}
                />
              ))}
            </div>

            {/* Loading more indicator - Skeleton cards */}
            {isLoading && movies.length > 0 && (
              <div
                className={clsx(
                  'grid gap-2 sm:gap-2 md:gap-2 mt-4',
                  'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
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
              'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
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
