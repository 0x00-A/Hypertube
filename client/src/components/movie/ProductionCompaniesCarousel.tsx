import { ChevronLeft, ChevronRight, Film } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import type { IProductionCompany } from '../../types/movie.types';
import { clsx } from 'clsx';

export interface ProductionCompaniesCarouselProps {
  title: string;
  companies: IProductionCompany[];
  maxItems?: number;
  className?: string;
}

export const ProductionCompaniesCarousel = ({
  title,
  companies,
  maxItems = 20,
  className,
}: ProductionCompaniesCarouselProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const displayedCompanies = companies.slice(0, maxItems);

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
    const gap = 16; // gap-4 in Tailwind
    let cardsVisible = 2;

    if (window.innerWidth >= 1280) { // xl
      cardsVisible = 8;
    } else if (window.innerWidth >= 1024) { // lg
      cardsVisible = 6;
    } else if (window.innerWidth >= 768) { // md
      cardsVisible = 5;
    } else if (window.innerWidth >= 640) { // sm
      cardsVisible = 3;
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
  }, [companies]);

  useEffect(() => {
    const handleResize = () => checkScrollPosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!companies || companies.length === 0) {
    return null;
  }

  return (
    <div className={clsx('relative w-full', className)}>
      <div className="flex items-center gap-2 mb-6">
        <Film className="w-5 h-5 text-primary" />
        <h3 className="text-xl font-bold text-white">{title}</h3>
      </div>

      <div className="relative group">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll('left')}
            className={clsx(
              'absolute left-0 top-[50px] -translate-y-1/2 z-30',
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
            type="button"
            onClick={() => scroll('right')}
            className={clsx(
              'absolute right-0 top-[50px] -translate-y-1/2 z-30',
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
          className="flex overflow-x-auto gap-4 pb-4 scroll-smooth [&::-webkit-scrollbar]:hidden"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {displayedCompanies.map((company) => (
            <div key={company.id} className="flex flex-col items-center gap-2 w-[100px] shrink-0">
              <div className="w-[100px] h-[100px] rounded-lg overflow-hidden border border-white/10 bg-white/95 hover:bg-white flex items-center justify-center p-3 transition-all duration-300 shadow-md hover:shadow-lg">
                {company.logoPath ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w200${company.logoPath}`}
                    alt={`${company.name} logo`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <Film className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                    <p className="text-gray-600 text-[10px] font-medium px-1 line-clamp-2">{company.name}</p>
                  </div>
                )}
              </div>
              <div className="text-center w-full px-1">
                <p className="text-white text-xs font-medium leading-tight line-clamp-2">{company.name}</p>
                {company.originCountry && (
                  <p className="text-text-secondary text-[10px] mt-0.5">{company.originCountry}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
