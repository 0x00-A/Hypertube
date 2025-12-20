import type { IMovie, IWatchProgress, ITrendingMovie } from '../../types/movie.types';
import { SliderMovies } from './SliderMovies';
import { LastWatchingSection } from './LastWatchingSection';
import { clsx } from 'clsx';

interface HeroSectionProps {
  heroMovies: ITrendingMovie[];
  lastWatchingList: IWatchProgress[];
  onPlayClick?: (movie: IMovie) => void;
  onViewAllLastWatching?: () => void;
  className?: string;
}

export const HeroSection = ({
  heroMovies,
  lastWatchingList,
  onPlayClick,
  onViewAllLastWatching,
  className,
}: HeroSectionProps) => {
  // Check if we should show the LastWatching section
  const showLastWatching = lastWatchingList && lastWatchingList.length > 0;

  return (
    <div className={clsx('w-full', className)}>
      <div className={clsx(
        'grid gap-4 h-[400px] md:h-[480px] lg:h-[calc(100vh-140px)] min-h-[550px]',
        showLastWatching ? 'grid-cols-1 lg:grid-cols-[1fr_350px]' : 'grid-cols-1'
      )}>
        {/* Main Content: SliderMovies */}
        <div className="w-full h-full overflow-hidden rounded-xl">
          <SliderMovies
            movies={heroMovies}
            autoPlayInterval={5000}
            className="h-full"
          />
        </div>

        {/* Sidebar: LastWatching (Hidden on mobile/tablet and when list is empty) */}
        {showLastWatching && (
          <div className="hidden lg:flex flex-col h-full">
            <LastWatchingSection
              progressList={lastWatchingList}
              onPlayClick={onPlayClick}
              onViewAll={onViewAllLastWatching}
              className="h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
};
