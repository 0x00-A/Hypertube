import { clsx } from 'clsx';

// ============================================================================
// MovieCardSkeleton Component
// ============================================================================

export const MovieCardSkeleton = ({ className }: { className?: string }) => {
  return (
    <div
      className={clsx(
        'relative rounded-xl bg-border p-2 shadow-lg animate-pulse',
        'w-full h-full flex flex-col',
        className
      )}
    >
      <div className="relative aspect-2/3 w-full overflow-hidden rounded-lg flex-1 bg-bg-tertiary">
        {/* Rating badge skeleton */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <div className="h-8 w-16 bg-bg-card/60 rounded-lg" />
        </div>

        {/* Heart button skeleton */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <div className="h-8 w-8 bg-bg-card/60 rounded-lg" />
        </div>

        {/* Bottom info skeleton */}
        <div className="absolute bottom-0 left-0 right-0 bg-bg-card/60 backdrop-blur-md z-10 rounded-b-md">
          <div className="p-3 space-y-2">
            {/* Title skeleton */}
            <div className="h-4 bg-bg-tertiary rounded w-3/4" />
            <div className="h-4 bg-bg-tertiary rounded w-1/2" />
            
            {/* Genre/info skeleton */}
            <div className="h-3 bg-bg-tertiary rounded w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
};
