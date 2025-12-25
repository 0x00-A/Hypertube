import { Heart } from 'lucide-react';
import { useState } from 'react';
import type { MovieCardProps } from '../../types/movie.types';
import { clsx } from 'clsx';
import { useAuthState } from '../../hooks/useAuth';
import MoviePreviewModal from './MoviePreviewModal';

import { useNavigate } from 'react-router-dom';
import { determineIsTmdbMovie, getMovieIdentifier } from '../../utils/movieHelpers';

export const MovieCard = ({
  movie,
  className,
}: MovieCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { isAuthenticated } = useAuthState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = () => {
    
    // If user is not authenticated, show preview modal
    if (!isAuthenticated) {
      setIsModalOpen(true);
      return;
    }
    
    // Default navigation behavior
    try {
      const id = getMovieIdentifier(movie);
      const isTmdbMovie = determineIsTmdbMovie(movie);
      navigate(`/movies/${id}`, { state: { isTmdbMovie } });
    } catch (error) {
      console.error('Failed to navigate to movie details:', error);
    }
  };

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // implement watchlist toggle
  };

  const formatRating = (rating?: number | string) => {
    if (!rating) return 'N/A';
    return typeof rating === 'string' ? rating : rating.toFixed(1);
  };

  // Helper to get image from different movie types
  const getMovieImage = () => {
    if ('images' in movie) {
      const images = movie.images;
      // Check if images has poster property (IMovie)
      if ('poster' in images && images.poster) {
        return images.poster;
      }
      // Check if images has thumbnail property (all types)
      if ('thumbnail' in images && images.thumbnail) {
        return images.thumbnail;
      }
    }
    return '/images/movies/placeholder.jpg';
  };

  return (
    <>
      <div
        className={clsx(
          'relative cursor-pointer rounded-xl bg-border p-2 shadow-lg transition-all duration-500',
          'hover:shadow-2xl hover:z-10 w-full h-full flex flex-col',
          movie.isWatched && 'border-2 border-green-500',
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        <div className="relative aspect-2/3 w-full overflow-hidden rounded-lg flex-1">
          <img
            src={getMovieImage()}
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
              className="flex items-center justify-center bg-black/60 backdrop-blur-md  px-2.5 py-1.5 rounded-lg transition-all active:scale-95"
            >
              <Heart
                className={clsx(
                  'w-5 h-5 transition-colors',
                  movie.inWatchlist
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
            {(('synopsis' in movie && movie.synopsis) || ('overview' in movie && movie.overview)) && (
              <p className="text-white/90 text-sm font-medium leading-relaxed drop-shadow-md line-clamp-4">
                {'synopsis' in movie && movie.synopsis ? movie.synopsis : 'overview' in movie ? movie.overview : ''}
              </p>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 backdrop-blur-md bg-black/60 z-10 rounded-b-md">
            <div className="p-3 text-center">
              <h3 className={clsx(
                "text-white font-bold text-base leading-tight mb-1 drop-shadow-sm transition-colors line-clamp-2",
                isHovered && "text-primary-400"
              )}>
                {movie.title}
              </h3>

              <div className="h-5 relative overflow-hidden">
                <div className={clsx(
                  "absolute inset-0 transition-all duration-500 ease-out flex items-center justify-center",
                  isHovered ? "transform translate-y-8 opacity-0" : "transform translate-y-0 opacity-100"
                )}>
                  {'genres' in movie && movie.genres ? (
                    <p className="text-text-secondary text-xs font-medium truncate">
                      {movie.genres.slice(0, 3).join(', ')}
                    </p>
                  ) : (
                    <p className="text-text-secondary text-xs font-medium truncate uppercase">
                      {movie.originalLanguage || 'Unknown'}
                    </p>
                  )}
                </div>

                <div className={clsx(
                  "absolute inset-0 transition-all duration-500 ease-out flex items-center justify-center gap-2",
                  isHovered ? "transform translate-y-0 opacity-100 delay-100" : "transform -translate-y-8 opacity-0"
                )}>
                  <span className="text-white/90 text-xs font-semibold">{movie.year}</span>
                  {'duration' in movie && movie.duration && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-text-muted" />
                      <span className="text-text-secondary text-xs">{movie.duration} min</span>
                    </>
                  )}
                  {movie.originalLanguage && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-text-muted" />
                      <span className="text-text-secondary text-xs uppercase">{movie.originalLanguage}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Movie Preview Modal for unauthenticated users */}
      <MoviePreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        movie={movie}
      />
    </>
  );
};