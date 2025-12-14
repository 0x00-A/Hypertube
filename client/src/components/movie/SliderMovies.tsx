import { useState, useEffect } from 'react';
import type { HeroSliderProps } from '../../types/movie.types';
import { clsx } from 'clsx';

export const SliderMovies = ({
  movies,
  autoPlayInterval = 5000,
  className,
}: HeroSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  // const [isAutoPlaying, setIsAutoPlaying] = useState(true); // Always autoplay now

  const currentMovie = movies[currentIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [movies, autoPlayInterval]);

  const formatRating = (rating?: number) => {
    return rating ? rating.toFixed(1) : 'N/A';
  };

  return (
    <div className={clsx('relative w-full h-full overflow-hidden rounded-xl', className)}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={currentMovie.images.backdrop || currentMovie.images.poster || '/images/movies/placeholder.jpg'}
          alt={currentMovie.title}
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlay for better text readability */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      {/* Glassmorphism Card - Bottom Left */}

      <div className="absolute bottom-6 left-8 right-8 z-10">
        <div className="max-w-xl lg:max-w-2xl xl:max-w-3xl transition-all duration-300">
          <div className="backdrop-blur-xl bg-black/30 rounded-xl p-5 lg:p-8 xl:p-10 shadow-2xl border border-white/10">
            {/* Movie Title */}
            <h1 className="text-3xl lg:text-4xl xl:text-6xl font-bold text-white leading-tight mb-2.5 lg:mb-4">
              {currentMovie.title}
            </h1>

            {/* IMDb Badge + Rating + Genres - Single Line */}
            <div className="flex items-center gap-2 lg:gap-3 mb-2.5 lg:mb-4 flex-wrap">
              {/* IMDb Badge */}
              <div className="bg-yellow-400 px-1.5 py-0.5 lg:px-2 lg:py-1 rounded">
                <span className="text-black font-bold text-xs lg:text-sm">IMDb</span>
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-1">
                <span className="text-yellow-400 text-sm lg:text-base">★</span>
                <span className="text-white text-sm lg:text-base font-bold">
                  {formatRating(currentMovie.rating)}
                </span>
              </div>

              {/* Genres */}
              {currentMovie.genres && currentMovie.genres.length > 0 && (
                <>
                  <span className="text-text-muted text-sm lg:text-base">|</span>
                  <div className="flex items-center gap-1.5 lg:gap-2">
                    {currentMovie.genres.slice(0, 3).map((genre, index) => (
                      <div key={genre} className="flex items-center gap-1.5">
                        <span className="text-text-secondary text-xs lg:text-base">{genre}</span>
                        {index < Math.min(currentMovie.genres!.length, 3) - 1 && (
                          <span className="text-text-muted text-xs lg:text-base">•</span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Synopsis */}
            {currentMovie.synopsis && (
              <p className="text-text-secondary text-xs lg:text-base xl:text-lg leading-relaxed line-clamp-2 lg:line-clamp-3 xl:line-clamp-4 mb-3.5 lg:mb-6 max-w-prose">
                {currentMovie.synopsis}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 lg:gap-4">
              <button
                onClick={handleWatchClick}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-6 py-2 lg:px-8 lg:py-3 rounded-lg transition-all duration-200 shadow-lg text-xs lg:text-base xl:text-lg"
              >
                WATCH
              </button>
              <button
                onClick={handleTrailerClick}
                className="bg-black/50 backdrop-blur-sm border-2 border-yellow-400 text-yellow-400 font-bold px-5 py-2 lg:px-7 lg:py-3 rounded-lg hover:bg-yellow-400 hover:text-black transition-all duration-200 text-xs lg:text-base xl:text-lg"
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
