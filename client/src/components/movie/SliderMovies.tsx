import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { HeroSliderProps, IMovie } from '../../types/movie.types';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import TrailerModal from './TrailerModal';

const SlideImage = ({ movie }: { movie: IMovie }) => {
  const [hasError, setHasError] = useState(false);
  const src = movie.images.backdrop || movie.images.poster || movie.images.thumbnail;

  if (!src || hasError) return null;

  return (
    <img
      src={src}
      alt={movie.title}
      className="w-full h-full object-cover"
      onError={() => setHasError(true)}
    />
  );
};

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
      const id = currentMovie.tmdbId
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
      <div className={clsx('relative w-full h-full overflow-hidden', className)}>
        {/* Skeleton Background - Full Width */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-bg-secondary via-bg-tertiary to-bg-secondary animate-pulse" />
          {/* Multi-layer gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/80 via-transparent to-bg-primary/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-primary" />
        </div>

        {/* Skeleton Content Container - Clean Modern Layout */}
        <div className="relative h-full flex flex-col justify-between">
          <div className="flex-1 flex items-end">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-20 lg:pb-24 w-full">
              <div className="max-w-2xl md:max-w-3xl lg:max-w-4xl transition-all duration-500">
                
                {/* Skeleton Badge */}
                <div className="h-5 w-32 bg-primary/30 rounded mb-4 animate-pulse" />

                {/* Skeleton Title - Extra Large */}
                <div className="h-12 md:h-16 lg:h-20 bg-white/30 rounded-md mb-4 md:mb-6 animate-pulse w-3/4 md:w-2/3" />

                {/* Skeleton Meta Info */}
                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 flex-wrap">
                  <div className="h-8 w-20 bg-yellow-400/30 rounded animate-pulse" />
                  <div className="h-6 w-8 bg-white/20 rounded animate-pulse" />
                  <div className="h-6 w-20 bg-white/20 rounded animate-pulse" />
                  <div className="h-6 w-24 bg-white/20 rounded animate-pulse" />
                </div>

                {/* Skeleton Overview - Larger */}
                <div className="space-y-3 mb-6 md:mb-8 max-w-3xl">
                  <div className="h-6 md:h-7 bg-white/20 rounded animate-pulse w-full" />
                  <div className="h-6 md:h-7 bg-white/20 rounded animate-pulse w-full" />
                  <div className="h-6 md:h-7 bg-white/20 rounded animate-pulse w-5/6" />
                </div>

                {/* Skeleton Buttons - Prominent */}
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="h-12 md:h-14 lg:h-16 w-36 md:w-44 lg:w-52 bg-primary/30 rounded-md animate-pulse" />
                  <div className="h-12 md:h-14 lg:h-16 w-28 md:w-36 lg:w-40 bg-white/20 rounded-md animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Skeleton Arrow Navigation */}
          <div className="absolute left-4 md:left-6 lg:left-8 top-1/2 -translate-y-1/2">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-black/30 rounded-full animate-pulse" />
          </div>
          <div className="absolute right-4 md:right-6 lg:right-8 top-1/2 -translate-y-1/2">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-black/30 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? movies.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % movies.length);
  };

  return (
    <div className={clsx('relative w-full h-full overflow-hidden group', className)}>
      {/* Background Image - Full Width with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="absolute inset-0 bg-zinc-900"
        >
          <SlideImage movie={currentMovie} />
          {/* Multi-layer gradient overlays for depth and readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/80 via-transparent to-bg-primary/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-primary" />
        </motion.div>
      </AnimatePresence>

      {/* Content Container - Clean Modern Layout with Animation */}
      <div className="relative h-full flex flex-col justify-between">
        {/* Main Content - Bottom Left */}
        <div className="flex-1 flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-20 lg:pb-24 w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                className="max-w-2xl md:max-w-3xl lg:max-w-4xl"
              >
                
                {/* Weekly Badge */}
                {currentMovie.trending && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="inline-block mb-4"
                  >
                    <span className="text-primary text-xs md:text-sm font-semibold tracking-wider uppercase">
                      Trending This Week
                    </span>
                  </motion.div>
                )}

                {/* Movie Title - Large and Bold */}
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.35 }}
                  className="text-4xl md:text-5xl lg:text-7xl font-black text-white leading-none mb-4 md:mb-6 drop-shadow-2xl tracking-tight"
                >
                  {currentMovie.title}
                </motion.h1>

                {/* Metadata Row - Clean and Minimal */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.45 }}
                  className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 flex-wrap"
                >
                  {/* IMDb Badge */}
                  <div className="bg-yellow-400 px-2 py-1 rounded flex items-center gap-1.5">
                    <span className="text-black font-bold text-xs md:text-sm">IMDb</span>
                    <span className="text-black font-bold text-xs md:text-sm">
                      {formatRating(currentMovie.rating)}
                    </span>
                  </div>

                  {/* Original Language */}
                  {currentMovie.originalLanguage && (
                    <span className="text-white text-sm md:text-base font-semibold uppercase tracking-wide">
                      {currentMovie.originalLanguage}
                    </span>
                  )}

                  {/* Genres */}
                  {currentMovie.genres && currentMovie.genres.length > 0 && (
                    <div className="flex items-center gap-2 md:gap-3">
                      {currentMovie.genres.slice(0, 3).map((genre, index) => (
                        <span key={genre} className="text-text-secondary text-sm md:text-base font-medium">
                          {genre}
                          {index < Math.min(currentMovie.genres!.length, 3) - 1 && ' •'}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Overview - Larger and More Readable */}
                {(currentMovie.overview || currentMovie.synopsis) && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.55 }}
                    className="text-white text-base md:text-lg lg:text-xl leading-relaxed line-clamp-3 md:line-clamp-4 mb-6 md:mb-8 max-w-3xl drop-shadow-lg font-normal"
                  >
                    {currentMovie.overview || currentMovie.synopsis}
                  </motion.p>
                )}

                {/* Action Buttons - Prominent */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.65 }}
                  className="flex items-center gap-3 md:gap-4"
                >
                  <button
                    onClick={handleWatchClick}
                    className="bg-primary hover:bg-primary-light text-black font-bold px-8 py-3 md:px-10 md:py-4 lg:px-12 lg:py-4 rounded-md transition-all duration-200 shadow-2xl text-base md:text-lg lg:text-xl hover:scale-105 transform"
                  >
                    Watch Now
                  </button>
                  {currentMovie.trailer && (
                    <button
                      onClick={handleTrailerClick}
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 text-white font-bold px-6 py-3 md:px-8 md:py-4 lg:px-10 lg:py-4 rounded-md transition-all duration-200 text-base md:text-lg lg:text-xl hover:scale-105 transform"
                    >
                      Trailer
                    </button>
                  )}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Arrow Navigation - Hidden by default, visible on hover */}
      {movies.length > 1 && (
        <>
          {/* Left Arrow */}
          <button
            onClick={handlePrevious}
            className="absolute left-4 md:left-6 lg:left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white p-3 md:p-4 rounded-full shadow-2xl hover:scale-110 transform z-10"
            aria-label="Previous slide"
          >
            <svg
              className="w-6 h-6 md:w-8 md:h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Right Arrow */}
          <button
            onClick={handleNext}
            className="absolute right-4 md:right-6 lg:right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white p-3 md:p-4 rounded-full shadow-2xl hover:scale-110 transform z-10"
            aria-label="Next slide"
          >
            <svg
              className="w-6 h-6 md:w-8 md:h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

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
