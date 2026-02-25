import { useEffect, useRef, useMemo } from 'react';
import { TrendingUp, AlertCircle, SearchX } from 'lucide-react';
import { MovieCard, MovieCardSkeleton } from '../../components/movie';
import { useTrendingMovies } from '../../hooks/useTrendingMovies';
import type { ApiError } from '../../types/api.types';
import clsx from 'clsx';

export default function Trending() {
  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useTrendingMovies();

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Flatten all pages into a single array of movies
  const movies = useMemo(() => {
    return data?.pages.flatMap(page => page.data) ?? [];
  }, [data]);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-text-primary tracking-tight">Trending Movies</h1>
              <p className="text-text-secondary font-medium">Discover what's hot right now</p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {isError && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 px-8 py-5 bg-red-500/10 border border-red-500/20 rounded-2xl shadow-xl">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <div>
                <p className="text-red-500 font-bold">Failed to load trending movies</p>
                <p className="text-text-secondary text-sm mt-1">{(error as ApiError)?.message || 'Please try again later'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content Section */}
        {!isError && (
          <>
            {/* Empty State */}
            {!isLoading && movies.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-6 p-6 bg-bg-tertiary rounded-full shadow-inner">
                  <SearchX className="h-16 w-16 text-text-muted opacity-30" />
                </div>
                <h3 className="text-white text-2xl font-bold mb-3 tracking-tight">No trending movies found</h3>
                <p className="text-text-secondary max-w-md mx-auto leading-relaxed">
                  We couldn't find any trending movies at the moment. Please check back later.
                </p>
              </div>
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
                    key={movie._id || movie.imdbId || movie.tmdbId}
                    movie={movie}
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
                {Array.from({ length: 20 }).map((_, i) => (
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
                  You've reached the end of trending movies
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
