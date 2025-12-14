import { Heart } from 'lucide-react';
import { useState } from 'react';
import type { MovieCardProps } from '../../types/movie.types';
import { clsx } from 'clsx';

export const MovieCard = ({
  movie,
  onMovieClick,
  onWatchlistToggle,
  isInWatchlist = false,
  className,
}: MovieCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleCardClick = () => {
    onMovieClick?.(movie);
  };

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onWatchlistToggle?.(movie);
  };

  const formatRating = (rating?: number) => {
    return rating ? rating.toFixed(1) : 'N/A';
  };

  return (
    <div
      className={clsx(
        'relative cursor-pointer rounded-xl bg-border p-2 shadow-lg transition-all duration-500',
        'hover:shadow-2xl hover:z-10 w-full',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <div className="relative aspect-auto w-full overflow-hidden rounded-lg">
        <img
          src={movie.images.poster || '/images/movies/placeholder.jpg'}
          alt={movie.title}
          className={clsx(
            'w-full h-full object-cover transition-transform duration-700 ease-in-out',
            isHovered && 'scale-110 brightness-40'
          )}
        />

        <div className="absolute top-0 left-0 right-0 p-2.5 flex justify-between items-start z-10">
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10">
            <span className="text-yellow-400 text-sm">★</span>
            <span className="text-white text-sm font-bold">
              {formatRating(movie.rating)}
            </span>
            <span className="text-white/40 text-[10px] font-medium pt-0.5">/10</span>
          </div>

          <button
            onClick={handleWatchlistClick}
            className="flex items-center justify-center bg-text-muted px-2.5 py-1.5 rounded-lg transition-all active:scale-95"
          >
            <Heart
              className={clsx(
                'w-5 h-5 transition-colors',
                isInWatchlist
                  ? 'fill-red-500 text-red-500'
                  : 'text-white/80 hover:text-white'
              )}
            />
          </button>
        </div>

        <div className={clsx(
          "absolute inset-0 flex items-center justify-center px-4 text-center transition-opacity duration-500 z-10 pointer-events-none",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
          {movie.synopsis && (
            <p className="text-white/90 text-sm font-medium leading-relaxed drop-shadow-md line-clamp-4">
              {movie.synopsis}
            </p>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 backdrop-blur-md bg-black/30 z-10">
          <div className="p-3">
            <h3 className={clsx(
              "text-white font-bold text-base leading-tight mb-1 drop-shadow-sm transition-colors line-clamp-2",
              isHovered && "text-primary-400"
            )}>
              {movie.title}
            </h3>

            <div className="h-5 relative overflow-hidden">
              <div className={clsx(
                "absolute inset-0 transition-all duration-500 ease-out flex items-center",
                isHovered ? "transform translate-y-8 opacity-0" : "transform translate-y-0 opacity-100"
              )}>
                <p className="text-text-muted text-xs font-medium truncate">
                  {movie.genres?.slice(0, 3).join(', ') || 'Unknown Genre'}
                </p>
              </div>

              <div className={clsx(
                "absolute inset-0 transition-all duration-500 ease-out flex items-center gap-2",
                isHovered ? "transform translate-y-0 opacity-100 delay-100" : "transform -translate-y-8 opacity-0"
              )}>
                <span className="text-white/90 text-xs font-semibold">{movie.year}</span>
                {movie.duration && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-text-muted" />
                    <span className="text-text-secondary text-xs">{movie.duration} min</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};