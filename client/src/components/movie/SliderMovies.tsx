import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { HeroSliderProps } from '../../types/movie.types';
import { clsx } from 'clsx';

export const SliderMovies = ({
  movies,
  autoPlayInterval = 5000,
  className,
}: HeroSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  const currentMovie = movies[currentIndex];

  useEffect(() => {
    if (movies && movies.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % movies.length);
      }, autoPlayInterval);

      return () => clearInterval(interval);
    }
  }, [movies, autoPlayInterval]);

  const formatRating = (rating: string) => {
    return rating || 'N/A';
  };

  const handleWatchClick = () => {
    if (currentMovie) {
      navigate(`/movies/${currentMovie.tmdbId}`);
    }
  };

  const handleTrailerClick = () => {
    // Trailer functionality will be implemented later
    // For now, just navigate to the movie page
    if (currentMovie) {
      navigate(`/movies/${currentMovie.tmdbId}`);
    }
  };

  // Safety check: if no movies, show skeleton loader
  if (!movies || movies.length === 0) {
    return (
      <div className={clsx('relative w-full h-full overflow-hidden rounded-xl bg-bg-secondary', className)}>
        {/* Skeleton Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-bg-secondary via-bg-tertiary to-bg-secondary animate-pulse" />
        
        {/* Skeleton Card */}
        <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-auto z-10">
          <div className="max-w-sm md:max-w-md lg:max-w-lg">
            <div className="backdrop-blur-xl bg-black/40 rounded-lg p-4 md:p-5 lg:p-6 shadow-2xl border border-white/10">
              {/* Skeleton Title */}
              <div className="h-8 md:h-10 bg-white/20 rounded-md mb-3 animate-pulse w-3/4" />
              
              {/* Skeleton Meta Info */}
              <div className="flex items-center gap-2 mb-3">
                <div className="h-5 w-12 bg-white/20 rounded animate-pulse" />
                <div className="h-5 w-16 bg-white/20 rounded animate-pulse" />
                <div className="h-5 w-8 bg-white/20 rounded animate-pulse" />
                <div className="h-5 w-20 bg-white/20 rounded animate-pulse" />
              </div>
              
              {/* Skeleton Overview */}
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-white/20 rounded animate-pulse w-full" />
                <div className="h-4 bg-white/20 rounded animate-pulse w-5/6" />
              </div>
              
              {/* Skeleton Buttons */}
              <div className="flex items-center gap-2">
                <div className="h-9 w-24 bg-white/20 rounded-lg animate-pulse" />
                <div className="h-9 w-20 bg-white/20 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('relative w-full h-full overflow-hidden rounded-xl', className)}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={currentMovie.images.backdrop || currentMovie.images.thumbnail || '/images/movies/placeholder.jpg'}
          alt={currentMovie.title}
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlay for better text readability */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      {/* Glassmorphism Card - Compact Version */}
      <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-auto z-10">
        <div className="max-w-sm md:max-w-md lg:max-w-lg transition-all duration-300">
          <div className="backdrop-blur-xl bg-black/40 rounded-lg p-4 md:p-5 lg:p-6 shadow-2xl border border-white/10">
            {/* Movie Title */}
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight mb-2">
              {currentMovie.title}
            </h1>

            {/* IMDb Badge + Rating + Language + Genres */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {/* IMDb Badge */}
              <div className="bg-yellow-400 px-1.5 py-0.5 rounded">
                <span className="text-black font-bold text-xs">IMDb</span>
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-1">
                <span className="text-yellow-400 text-sm">★</span>
                <span className="text-white text-sm font-bold">
                  {formatRating(currentMovie.rating)}
                </span>
              </div>

              {/* Original Language */}
              {currentMovie.originalLanguage && (
                <>
                  <span className="text-text-muted text-sm">|</span>
                  <span className="text-text-secondary text-xs uppercase">
                    {currentMovie.originalLanguage}
                  </span>
                </>
              )}

              {/* Genres */}
              {currentMovie.genres && currentMovie.genres.length > 0 && (
                <>
                  <span className="text-text-muted text-sm">|</span>
                  <div className="flex items-center gap-1.5">
                    {currentMovie.genres.slice(0, 2).map((genre, index) => (
                      <div key={genre} className="flex items-center gap-1.5">
                        <span className="text-text-secondary text-xs">{genre}</span>
                        {index < Math.min(currentMovie.genres!.length, 2) - 1 && (
                          <span className="text-text-muted text-xs">•</span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Overview - Compact */}
            {currentMovie.overview && (
              <p className="text-text-secondary text-xs md:text-sm leading-relaxed line-clamp-2 mb-3 max-w-prose">
                {currentMovie.overview}
              </p>
            )}

            {/* Action Buttons - Compact */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleWatchClick}
                className="bg-primary hover:bg-primary-light text-black font-bold px-4 py-1.5 md:px-5 md:py-2 rounded-lg transition-all duration-200 shadow-lg text-xs md:text-sm"
              >
                WATCH
              </button>
              <button
                onClick={handleTrailerClick}
                className="bg-bg-tertiary hover:bg-border-light border border-border text-text-secondary hover:text-white font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-all duration-200 text-xs md:text-sm"
              >
                Trailer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
