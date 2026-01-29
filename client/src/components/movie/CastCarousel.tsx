import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import type { ICastMember } from '../../types/movie.types';
import { clsx } from 'clsx';

export interface CastCarouselProps {
  title: string;
  cast: ICastMember[];
  maxItems?: number;
  className?: string;
}

export const CastCarousel = ({
  title,
  cast,
  maxItems = 10,
  className,
}: CastCarouselProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const displayedCast = cast.slice(0, maxItems);

  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    // Add a small threshold (1px) to account for rounding errors
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const containerWidth = container.clientWidth;
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;

    // Calculate card width based on viewport
    const gap = 24; // gap-6 in Tailwind
    let cardsVisible = 2;

    if (window.innerWidth >= 1280) { // xl
      cardsVisible = 10;
    } else if (window.innerWidth >= 1024) { // lg
      cardsVisible = 8;
    } else if (window.innerWidth >= 768) { // md
      cardsVisible = 6;
    } else if (window.innerWidth >= 640) { // sm
      cardsVisible = 4;
    }

    const cardWidth = (containerWidth - (gap * (cardsVisible - 1))) / cardsVisible;
    const scrollAmount = cardWidth + gap;

    let targetScroll: number;

    if (direction === 'left') {
      targetScroll = Math.max(0, scrollLeft - scrollAmount);
    } else {
      // When scrolling right, make sure we don't go past the last card
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
  }, [cast]);

  useEffect(() => {
    const handleResize = () => checkScrollPosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!cast || cast.length === 0) {
    return null;
  }

  return (
    <div className={clsx('relative w-full', className)}>
      <div className="flex items-center gap-2 mb-6">
        <div className="text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white">{title}</h3>
      </div>

      <div className="relative group">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className={clsx(
              'absolute left-0 top-[40px] -translate-y-1/2 z-30',
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
              'absolute right-0 top-[40px] -translate-y-1/2 z-30',
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
          className="flex overflow-x-auto gap-6 pb-4 custom-scrollbar scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayedCast.map((member: ICastMember) => (
            <div key={member.id} className="flex flex-col items-center gap-3 min-w-[100px] flex-shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border">
                {member.profilePath ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w200${member.profilePath}`}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-card flex items-center justify-center text-text-muted text-xs">
                    N/A
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="text-white text-sm font-medium leading-tight mb-1">{member.name}</p>
                <p className="text-text-secondary text-xs">{member.character}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
