import { clsx } from 'clsx';

export const HeroSkeleton = () => {
    return (
        <div className="w-full animate-pulse">
            <div className={clsx(
                'grid gap-4 h-[400px] md:h-[480px] lg:h-[calc(100vh-140px)] min-h-[550px]',
                'grid-cols-1 lg:grid-cols-[1fr_350px]'
            )}>
                {/* Main Content: SliderMovies Skeleton */}
                <div className="w-full h-full overflow-hidden rounded-xl bg-border relative">
                    <div className="absolute inset-0 bg-white/5" />
                    <div className="absolute bottom-12 left-12 right-12 space-y-4">
                        <div className="h-10 md:h-16 bg-white/10 rounded-lg w-3/4 max-w-2xl" />
                        <div className="h-4 md:h-6 bg-white/10 rounded w-1/2 max-w-xl" />
                        <div className="flex gap-4 pt-4">
                            <div className="h-12 w-32 bg-white/10 rounded-xl" />
                            <div className="h-12 w-32 bg-white/5 rounded-xl" />
                        </div>
                    </div>
                </div>

                {/* Sidebar: LastWatching Skeleton (Hidden on mobile/tablet) */}
                <div className="hidden lg:flex flex-col h-full bg-border rounded-xl p-6 space-y-6">
                    <div className="h-8 bg-white/10 rounded w-40" />
                    <div className="flex-1 space-y-4 overflow-hidden">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex gap-4 p-3 bg-white/5 rounded-lg">
                                <div className="w-32 h-20 bg-white/10 rounded-md" />
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-4 bg-white/10 rounded w-3/4" />
                                    <div className="h-3 bg-white/5 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
