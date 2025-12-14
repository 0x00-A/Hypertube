import { Play, ArrowRight } from 'lucide-react';
import type { IMovie, IWatchProgress, LastWatchingCardProps } from '../../types/movie.types';
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

  // Circular Progress Calculation - Slightly larger
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={clsx(
        'relative cursor-pointer rounded-xl overflow-hidden bg-bg-card border-4 border-border',
        className
      )}
      onClick={() => onPlayClick?.(movie)}
    >
      {/* Movie Thumbnail */}
      <div className="relative w-full h-30">
        <img
          src={movie.images.backdrop || movie.images.poster || '/images/movies/placeholder.jpg'}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Gradient Overlay - Lighter for transparency */}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />

        {/* Play Button with Circular Progress - Centered */}
        <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ top: 'calc(1 / 3 * 80%)' }}>
          <div className="relative flex items-center justify-center transform transition-all duration-300">
            {/* SVG Progress Circle - Slightly larger */}
            <div className="w-18 h-18">
              <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl">
                {/* Track - Darker for better contrast */}
                <circle
                  cx="36"
                  cy="36"
                  r={radius}
                  stroke="rgba(0,0,0,0.6)"
                  strokeWidth="3.5"
                  fill="transparent"
                />
                {/* Progress - Visible stroke */}
                <circle
                  cx="36"
                  cy="36"
                  r={radius}
                  stroke="#F5C518"
                  strokeWidth="3.5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
            </div>

            {/* Play Icon (Inside Circle) - Smaller for better progress visibility */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/60 backdrop-blur-md rounded-full p-2 hover:bg-black/80 transition-colors shadow-2xl border border-white/10">
                <Play className="w-4.5 h-4.5 text-white fill-white ml-0.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Info Section - Glass Bar */}
        <div className="absolute bottom-0 left-0 right-0 backdrop-blur-md bg-black/30">
          <div className="p-2">
            {/* Time & Title */}
            <div className="pr-12">
              <div className="text-white/90 text-xs font-semibold tracking-wide mb-1">
                {formatTime(watchedDuration)} / {formatTime(totalDuration)}
              </div>
              <h4 className="text-white font-bold text-sm line-clamp-1 leading-tight">
                {movie.title}
              </h4>
            </div>

            {/* Rating - Bottom Right */}
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md">
              <span className="text-primary text-xs">★</span>
              <span className="text-white text-xs font-bold">
                {formatRating(movie.rating)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface LastWatchingSectionProps {
  progressList: IWatchProgress[];
  onPlayClick?: (movie: IMovie) => void;
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
  const displayList = progressList.slice(0, 4);
  const hasMore = progressList.length > 4;

  return (
    <div className={clsx('rounded-lg h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-white text-2xl font-bold">Last Watching</h2>
      </div>

      {/* Movie Cards */}
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
