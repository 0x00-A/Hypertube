import { useEffect, useRef, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { MovieCard, MovieCardSkeleton, LibraryFilterBar } from '../../components/movie';
import { useWatchlist } from '../../hooks/useWatchlist';
import type { ApiError } from '../../types/api.types';
import { EmptyState } from '../../components/common/EmptyState';
import { useEmptyStateVisibility } from '../../hooks/useEmptyStateVisibility';
import { useAppSelector } from '../../redux/hooks';
import { hasActiveLibraryFilters } from '../../utils/filterHelpers';
import clsx from 'clsx';

export default function Watchlist() {
  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useWatchlist();

  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Get filter state to determine empty state visibility
  const filters = useAppSelector((state) => state.libraryFilters);
  const hasActiveFilters = hasActiveLibraryFilters(filters);

  // Flatten all pages into a single array of movies
  const movies = useMemo(() => {
    return data?.pages.flatMap(page => page.data) ?? [];
  }, [data]);

  // Determine UI visibility
  const { shouldShowControls, shouldShowEmptyState } = useEmptyStateVisibility({
    isLoading,
    hasData: movies.length > 0,
    hasActiveFilters
  });

  // Infinite scroll implementation
  useEffect(() => {
    if (!loadMoreRef.current || isLoading || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isLoading, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="flex items-center justify-between gap-4 mb-6">
            <div className="shrink-0">
                <h1 className="text-3xl font-bold text-white">Your Watchlist</h1>
                <p className="text-text-secondary text-sm mt-0.5">Manage and explore your watchlist</p>
            </div>
        </div>

        {shouldShowControls && <LibraryFilterBar />}

        {/* Error State */}
        {isError && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 px-8 py-5 bg-red-500/10 border border-red-500/20 rounded-2xl shadow-xl">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <div>
                <p className="text-red-500 font-bold">Failed to load your watchlist</p>
                <p className="text-text-secondary text-sm mt-1">{(error as ApiError)?.message || 'Please try again later'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content Section */}
        {!isError && (
          <>
            {/* Cinematic Empty State - Only show when no data and no filters */}
            {shouldShowEmptyState && (
              <EmptyState 
                variant="library"
                className="mt-8"
              />
            )}

            {/* Search Results Empty State - Show when filters active but no results */}
            {!isLoading && movies.length === 0 && hasActiveFilters && (
              <EmptyState 
                variant="search"
                customHeadline="No Matches in Your Watchlist"
                customDescription="Try adjusting your filters or search terms to find what you're looking for."
                className="mt-8"
              />
            )}

            {/* Movies Grid */}
            {movies.length > 0 && (
              <div 
                className={clsx(
                              'grid gap-2 sm:gap-2 md:gap-2',
                              'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                            )}>
                {movies.map((movie) => (
                  <MovieCard
                    key={movie._id || movie.imdbId}
                    movie={{ ...movie, inWatchlist: true }}
                  />
                ))}

                {/* Skeleton Loading for more pages */}
                {isFetchingNextPage && (
                  <>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <MovieCardSkeleton key={`loading-${i}`} />
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Initial Loading Skeletons */}
            {isLoading && movies.length === 0 && (
              <div
                className={clsx(
                  'grid gap-2 sm:gap-2 md:gap-2 mt-4',
                  'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                )}
              >
                {Array.from({ length: 15 }).map((_, i) => (
                  <MovieCardSkeleton key={`skeleton-${i}`} />
                ))}
              </div>
            )}

            {/* Infinite Scroll Trigger */}
            {hasNextPage && !isLoading && (
              <div ref={loadMoreRef} className="py-12 flex justify-center">
                <div className="flex items-center gap-2 px-6 py-2 bg-bg-tertiary border border-border rounded-full text-text-secondary text-sm font-medium animate-pulse">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  Loading more...
                </div>
              </div>
            )}

            {/* End of Results */}
            {!hasNextPage && movies.length > 0 && !isLoading && (
              <div className="text-center py-16 text-text-muted text-sm font-medium">
                <div className="inline-block px-8 py-2 border-t border-border/50">
                  You've reached the end of your collection
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
