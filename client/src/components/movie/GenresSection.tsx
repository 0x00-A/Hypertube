import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { MovieCard } from './MovieCard';
import type { IMovie } from '../../types/movie.types';
import { clsx } from 'clsx';

export interface GenresSectionProps {
  movies: IMovie[];
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  onViewAll?: () => void;
  isLoading?: boolean;
  className?: string;
}

const GENRES = [
  'Comedy',
  'Drama',
  'Action',
  'Animation',
];

export const GenresSection = ({
  movies,
  selectedGenre,
  onGenreChange,
  onViewAll,
  isLoading = false,
  className,
}: GenresSectionProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const containerWidth = container.clientWidth;
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;

    const gap = 8;
    let cardsVisible = 1;

    if (window.innerWidth >= 1280) {
      cardsVisible = 5;
    } else if (window.innerWidth >= 1024) {
      cardsVisible = 4;
    } else if (window.innerWidth >= 768) {
      cardsVisible = 3;
    } else if (window.innerWidth >= 640) {
      cardsVisible = 2;
    }

    const cardWidth = (containerWidth - (gap * (cardsVisible - 1))) / cardsVisible;
    const scrollAmount = cardWidth + gap;

    let targetScroll: number;

    if (direction === 'left') {
      targetScroll = Math.max(0, scrollLeft - scrollAmount);
    } else {
      const maxScroll = scrollWidth - containerWidth;
      targetScroll = Math.min(maxScroll, scrollLeft + scrollAmount);
    }

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollPosition();

    container.addEventListener('scroll', checkScrollPosition);
    return () => container.removeEventListener('scroll', checkScrollPosition);
  }, [movies]);

  useEffect(() => {
    const handleResize = () => checkScrollPosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={clsx('relative w-full', className)}>
      {/* Header with title and View All button */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-white text-2xl sm:text-3xl font-bold">Genres</h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors group"
          >
            <span className="text-sm font-medium">View All</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        )}
      </div>

      {/* Genre Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {GENRES.map((genre) => (
          <button
            key={genre}
            onClick={() => onGenreChange(genre)}
            className={clsx(
              'px-4 py-2 rounded-full text-sm font-medium transition-all duration-300',
              selectedGenre === genre
                ? 'bg-primary text-black'
                : 'text-text-secondary hover:text-white'
            )}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Movies Carousel */}
      <div className="relative group">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className={clsx(
              'absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30',
              'w-10 h-10 sm:w-12 sm:h-12 rounded-full',
              'bg-primary/80 backdrop-blur-sm',
              'flex items-center justify-center',
              'text-black hover:bg-primary transition-all',
              'shadow-lg hover:shadow-xl',
              'opacity-60 hover:opacity-100 group-hover:opacity-100',
              'transform hover:scale-110'
            )}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className={clsx(
              'absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30',
              'w-10 h-10 sm:w-12 sm:h-12 rounded-full',
              'bg-primary/80 backdrop-blur-sm',
              'flex items-center justify-center',
              'text-black hover:bg-primary transition-all',
              'shadow-lg hover:shadow-xl',
              'opacity-60 hover:opacity-100 group-hover:opacity-100',
              'transform hover:scale-110'
            )}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          className="grid grid-flow-col auto-cols-[100%] sm:auto-cols-[calc(50%-4px)] md:auto-cols-[calc(33.333%-5.33px)] lg:auto-cols-[calc(25%-6px)] xl:auto-cols-[calc(20%-6.4px)] gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="animate-pulse">
                <div className="bg-border rounded-xl p-2">
                  <div className="bg-bg-secondary rounded-lg aspect-2/3 w-full" />
                </div>
              </div>
            ))
          ) : movies.length === 0 ? (
            // Empty state
            <div className="col-span-full text-center py-12">
              <p className="text-text-muted text-lg">No movies available</p>
            </div>
          ) : (
            // Movie cards
            movies.map((movie) => {
              const key = movie._id || movie.imdbId;
              return (
                <div key={key}>
                  <MovieCard
                    movie={movie}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};
