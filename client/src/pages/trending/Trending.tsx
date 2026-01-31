import { useEffect, useRef, useState } from 'react';
import { TrendingUp, AlertCircle, SearchX } from 'lucide-react';
import { MovieCard, MovieCardSkeleton } from '../../components/movie';
import { movieService } from '../../services/movie.service';
import type { IMovie } from '../../types/movie.types';
import clsx from 'clsx';

export default function Trending() {
  const [movies, setMovies] = useState<IMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch trending movies
  const fetchMovies = async (pageNumber: number, append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const response = await movieService.getTrendingMovies(pageNumber);
      
      if (append) {
        setMovies(prev => [...prev, ...response.data]);
      } else {
        setMovies(response.data);
      }
      
      setHasNextPage(response.pagination.hasNextPage);
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load trending movies';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchMovies(1);
  }, []);

  // Infinite scroll implementation
  useEffect(() => {
    if (!loadMoreRef.current || isLoading || !hasNextPage || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isLoadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchMovies(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isLoading, hasNextPage, isLoadingMore, page]);

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
        {error && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 px-8 py-5 bg-red-500/10 border border-red-500/20 rounded-2xl shadow-xl">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <div>
                <p className="text-red-500 font-bold">Failed to load trending movies</p>
                <p className="text-text-secondary text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content Section */}
        {!error && (
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
                  'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                )}>
                {movies.map((movie) => (
                  <MovieCard
                    key={movie._id || movie.imdbId || movie.tmdbId}
                    movie={movie}
                  />
                ))}

                {/* Skeleton Loading for more pages */}
                {isLoadingMore && (
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
                  'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
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
