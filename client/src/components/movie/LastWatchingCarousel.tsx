import { ChevronLeft, ChevronRight, ArrowRight, Play } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { LastWatchingCard } from "./LastWatchingSection";
import type { IMovie, IWatchProgress } from "../../types/movie.types";
import { clsx } from "clsx";

export interface LastWatchingCarouselProps {
  title: string;
  progressList: IWatchProgress[];
  onPlayClick?: (movie: IMovie) => void;
  onViewAll?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const LastWatchingCarousel = ({
  title,
  progressList,
  onPlayClick,
  onViewAll,
  isLoading,
  className,
}: LastWatchingCarouselProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;

    const scrollAmount = scrollContainerRef.current.clientWidth;
    const targetScroll =
      direction === "left"
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;

    scrollContainerRef.current.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollPosition();

    container.addEventListener("scroll", checkScrollPosition);
    return () => container.removeEventListener("scroll", checkScrollPosition);
  }, [progressList]);

  useEffect(() => {
    const handleResize = () => checkScrollPosition();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className={clsx("relative w-full", className)}>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-white text-2xl sm:text-3xl font-bold">{title}</h2>
        {onViewAll && progressList.length > 0 && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors group"
          >
            <span className="text-sm font-medium">View All</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        )}
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-flow-col auto-cols-[85%] sm:auto-cols-[calc(50%-8px)] md:auto-cols-[calc(33.333%-11px)] lg:auto-cols-[calc(25%-12px)] xl:auto-cols-[calc(20%-13px)] gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`skeleton-${String(i)}`}
              className="rounded-xl overflow-hidden bg-bg-card border-4 border-border animate-pulse"
            >
              <div className="w-full h-30 bg-white/5" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && progressList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl border border-dashed border-border bg-bg-card/50">
          <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Play className="w-6 h-6 text-text-secondary" />
          </div>
          <p className="text-text-secondary text-sm text-center">
            Movies you start watching will appear here.
          </p>
        </div>
      )}

      {/* Actual carousel */}
      {!isLoading && progressList.length > 0 && (
        <div className="relative group">
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className={clsx(
                "absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30",
                "w-10 h-10 sm:w-12 sm:h-12 rounded-full",
                "bg-primary/80 backdrop-blur-sm",
                "flex items-center justify-center",
                "text-black hover:bg-primary transition-all",
                "shadow-lg hover:shadow-xl",
                "opacity-60 hover:opacity-100 group-hover:opacity-100",
                "transform hover:scale-110",
              )}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className={clsx(
                "absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30",
                "w-10 h-10 sm:w-12 sm:h-12 rounded-full",
                "bg-primary/80 backdrop-blur-sm",
                "flex items-center justify-center",
                "text-black hover:bg-primary transition-all",
                "shadow-lg hover:shadow-xl",
                "opacity-60 hover:opacity-100 group-hover:opacity-100",
                "transform hover:scale-110",
              )}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            className="grid grid-flow-col auto-cols-[85%] sm:auto-cols-[calc(50%-8px)] md:auto-cols-[calc(33.333%-11px)] lg:auto-cols-[calc(25%-12px)] xl:auto-cols-[calc(20%-13px)] gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {progressList.map((progress) => (
              <div key={progress.movie._id || progress.movie.imdbId}>
                <LastWatchingCard
                  progress={progress}
                  onPlayClick={onPlayClick}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};
