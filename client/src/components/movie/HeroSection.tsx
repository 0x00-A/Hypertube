import type { IMovie, IWatchProgress } from '../../types/movie.types';
import { SliderMovies } from './SliderMovies';
import { LastWatchingSection } from './LastWatchingSection';
import { clsx } from 'clsx';

interface HeroSectionProps {
  heroMovies: IMovie[];
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
  return (
    <div className={clsx('w-full', className)}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-4 h-[400px] md:h-[480px] lg:h-[calc(100vh-140px)] min-h-[550px]">
        {/* Main Content: SliderMovies */}
        <div className="w-full h-full overflow-hidden rounded-xl">
          <SliderMovies
            movies={heroMovies}
            autoPlayInterval={5000}
            className="h-full"
          />
        </div>

        {/* Sidebar: LastWatching (Hidden on mobile/tablet) */}
        <div className="hidden lg:flex flex-col h-full">
          <LastWatchingSection
            progressList={lastWatchingList}
            onPlayClick={onPlayClick}
            onViewAll={onViewAllLastWatching}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
};
