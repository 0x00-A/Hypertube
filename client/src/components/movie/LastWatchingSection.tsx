import { Play, ArrowRight } from 'lucide-react';
import type { LastWatchingCardProps } from '../../types/movie.types';
import { clsx } from 'clsx';

export const LastWatchingCard = ({
  progress,
  onPlayClick,
  className,
}: LastWatchingCardProps) => {
  const { movie, watchedDuration, totalDuration, percentage } = progress;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatRating = (rating?: number) => {
    return rating ? rating.toFixed(1) : 'N/A';
  };

  // Circular Progress Calculation - Scale down for smaller card
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={clsx(
        'relative cursor-pointer rounded-xl overflow-hidden bg-bg-card',
        'border-4 border-border',
        className
      )}
      onClick={() => onPlayClick?.(movie)}
    >
      {/* Movie Thumbnail */}
      <div className="relative w-full h-32">
        <img
          src={movie.images.backdrop || movie.images.poster || '/images/movies/placeholder.jpg'}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />

        {/* Play Button with Circular Progress */}
        <div className="absolute inset-0 flex items-center justify-center pb-4">
          <div className="relative flex items-center justify-center transform transition-all duration-300 group-hover:scale-110">
            {/* SVG Progress Circle */}
            <div className="w-14 h-14 group-hover:animate-spin">
              <svg className="w-full h-full transform -rotate-90 drop-shadow-lg">
                {/* Track */}
                <circle
                  cx="28"
                  cy="28"
                  r={radius}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="2.5"
                  fill="transparent"
                />
                {/* Progress */}
                <circle
                  cx="28"
                  cy="28"
                  r={radius}
                  stroke="#F5C518" // Primary Yellow
                  strokeWidth="2.5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
            </div>

            {/* Play Icon (Inside Circle) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors">
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Info Section */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          {/* Time & Title */}
          <div className="pr-14">
            <div className="text-text-secondary text-[10px] font-medium tracking-wide mb-0.5">
              {formatTime(watchedDuration)} / {formatTime(totalDuration)}
            </div>
            <h4 className="text-white font-bold text-base line-clamp-1 leading-tight drop-shadow-sm">
              {movie.title}
            </h4>
          </div>

          {/* Rating - Bottom Right Absolute */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded-md backdrop-blur-md border border-white/10">
            <span className="text-primary text-[10px]">★</span>
            <span className="text-white text-[10px] font-bold">
              {formatRating(movie.rating)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface LastWatchingSectionProps {
  progressList: Array<{
    movie: {
      _id?: string;
      imdbId: string;
      title: string;
      year: number;
      rating?: number;
      duration?: number;
      synopsis?: string;
      genres?: string[];
      language?: string;
      trailer?: string;
      images: {
        thumbnail?: string;
        poster?: string;
        backdrop?: string;
      };
    };
    watchedDuration: number;
    totalDuration: number;
    percentage: number;
    lastWatchedAt: Date | string;
  }>;
  onPlayClick?: (movie: LastWatchingSectionProps['progressList'][0]['movie']) => void;
  onViewAll?: () => void;
  className?: string;
}

export const LastWatchingSection = ({
  progressList,
  onPlayClick,
  onViewAll,
  className,
}: LastWatchingSectionProps) => {
  // Limit to 4 items to better fill the height of the hero section on large screens
  const displayList = progressList.slice(0, 5);
  const hasMore = progressList.length > 5;

  return (
    <div className={clsx('rounded-lg h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-white text-2xl font-bold">Last Watching</h2>
      </div>

      {/* Movie Cards - Flex grow to fill space, justify-start or between depending on preference. 
          Using space-y-3 is good, but let's ensure they stack nicely.
      */}
      <div className="flex-1 space-y-3 min-h-0">
        {displayList.map((progress) => (
          <LastWatchingCard
            key={progress.movie._id || progress.movie.imdbId}
            progress={progress}
            onPlayClick={onPlayClick}
          />
        ))}
      </div>

      {/* View All Button - Only show if there are more items */}
      {hasMore && onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full mt-4 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-lg text-sm transition-colors duration-200 flex items-center justify-center gap-2 shrink-0 shadow-lg"
        >
          See All
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
