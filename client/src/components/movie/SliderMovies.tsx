import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { HeroSliderProps } from '../../types/movie.types';
import { clsx } from 'clsx';
import TrailerModal from './TrailerModal';

export const SliderMovies = ({
  movies,
  autoPlayInterval = 5000,
  className,
}: HeroSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTrailer, setActiveTrailer] = useState<{ url: string; title: string } | null>(null);
  const navigate = useNavigate();

  const currentMovie = movies[currentIndex];

  useEffect(() => {
    // Only auto-play if the trailer modal is NOT open
    if (movies && movies.length > 0 && !activeTrailer) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % movies.length);
      }, autoPlayInterval);

      return () => clearInterval(interval);
    }
  }, [movies, autoPlayInterval, activeTrailer]);

  const formatRating = (rating?: number | string) => {
    if (!rating) return 'N/A';
    return typeof rating === 'string' ? rating : rating.toFixed(1);
  };

  const handleWatchClick = () => {
    if (currentMovie) {
      const id = currentMovie.imdbId
      navigate(`/movies/${id}`, { state: { isTmdbMovie: true } });
    }
  };

  const handleTrailerClick = () => {
    if (currentMovie && currentMovie.trailer) {
      // Set the active trailer data, which "freezes" the modal content
      // regardless of what happens to currentIndex in the background
      setActiveTrailer({
        url: currentMovie.trailer,
        title: currentMovie.title
      });
    }
  };

  // Safety check: if no movies, show skeleton loader
  if (!movies || movies.length === 0) {
    return (
      <div className={clsx('relative w-full h-full overflow-hidden rounded-xl bg-bg-secondary', className)}>
        {/* Skeleton Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-bg-secondary via-bg-tertiary to-bg-secondary animate-pulse" />

        {/* Skeleton Card - Exact match to actual slider */}
        <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-auto z-10">
          <div className="max-w-sm md:max-w-xl lg:max-w-3xl transition-all duration-300">
            <div className="backdrop-blur-sm bg-black/20 rounded-lg p-4 md:p-6 lg:p-8 shadow-2xl border border-white/10">

              {/* Skeleton Title - Large */}
              <div className="h-8 md:h-10 lg:h-12 bg-white/20 rounded-md mb-3 animate-pulse w-2/3 md:w-1/2" />

              {/* Skeleton Meta Info - IMDb Badge, Rating, Language, Genres */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {/* IMDb Badge */}
                <div className="h-5 w-14 bg-yellow-400/30 rounded animate-pulse" />
                {/* Star + Rating */}
                <div className="h-5 w-12 bg-white/20 rounded animate-pulse" />
                {/* Separator */}
                <div className="h-4 w-4 bg-white/10 rounded-full animate-pulse" />
                {/* Language */}
                <div className="h-4 w-8 bg-white/20 rounded animate-pulse" />
                {/* Separator */}
                <div className="h-4 w-4 bg-white/10 rounded-full animate-pulse" />
                {/* Genres */}
                <div className="h-4 w-20 bg-white/20 rounded animate-pulse" />
                <div className="h-4 w-16 bg-white/20 rounded animate-pulse" />
              </div>

              {/* Skeleton Overview - 3 lines of text */}
              <div className="space-y-2 mb-4 md:mb-5">
                <div className="h-4 md:h-5 lg:h-6 bg-white/20 rounded animate-pulse w-full" />
                <div className="h-4 md:h-5 lg:h-6 bg-white/20 rounded animate-pulse w-full" />
                <div className="h-4 md:h-5 lg:h-6 bg-white/20 rounded animate-pulse w-5/6" />
              </div>

              {/* Skeleton Buttons - Large and prominent */}
              <div className="flex items-center gap-2 md:gap-3">
                <div className="h-9 md:h-10 lg:h-12 w-28 md:w-32 lg:w-36 bg-primary/30 rounded-lg animate-pulse" />
                <div className="h-9 md:h-10 lg:h-12 w-24 md:w-28 lg:w-32 bg-white/20 rounded-lg animate-pulse" />
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
          src={currentMovie.images.backdrop || currentMovie.images.poster || currentMovie.images.thumbnail || '/images/movies/placeholder.jpg'}
          alt={currentMovie.title}
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlay for better text readability */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      {/* Glassmorphism Card - Compact Version */}
      <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-auto z-10">
        <div className="max-w-sm md:max-w-xl lg:max-w-3xl transition-all duration-300">
          <div className="backdrop-blur-sm bg-black/20 rounded-lg p-4 md:p-6 lg:p-8 shadow-2xl border border-white/10">
            {/* Movie Title */}
            <h1 className="text-xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-3">
              {currentMovie.title}
            </h1>

            {/* IMDb Badge + Rating + Language + Genres */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
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
            {(currentMovie.overview || currentMovie.synopsis) && (
              <p className="text-text-secondary text-sm md:text-base lg:text-lg leading-relaxed line-clamp-2 md:line-clamp-3 mb-4 md:mb-5 max-w-prose">
                {currentMovie.overview || currentMovie.synopsis}
              </p>
            )}

            {/* Action Buttons - Compact */}
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={handleWatchClick}
                className="bg-primary hover:bg-primary-light text-black font-bold px-5 py-2 md:px-6 md:py-2.5 lg:px-8 lg:py-3 rounded-lg transition-all duration-200 shadow-lg text-sm md:text-base lg:text-lg"
              >
                WATCH
              </button>
              {currentMovie.trailer && (
                <button
                  onClick={handleTrailerClick}
                  className="bg-bg-tertiary hover:bg-border-light border border-border text-text-secondary hover:text-white font-bold px-4 py-2 md:px-5 md:py-2.5 lg:px-6 lg:py-3 rounded-lg transition-all duration-200 text-sm md:text-base lg:text-lg"
                >
                  Trailer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {activeTrailer && (
        <TrailerModal
          isOpen={true}
          onClose={() => setActiveTrailer(null)}
          trailerUrl={activeTrailer.url}
          title={activeTrailer.title}
        />
      )}
    </div>
  );
};
