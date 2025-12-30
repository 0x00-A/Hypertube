import { clsx } from "clsx";
import { MovieCardSkeleton } from "./MovieCardSkeleton";

export const FeaturedPageSkeleton = () => {
    return (
        <div className="min-h-screen bg-bg-primary">
            {/* Hero Skeleton - Using SliderMovies skeleton pattern */}
            <div className="relative h-screen w-full overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-bg-secondary via-bg-tertiary to-bg-secondary animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/80 via-transparent to-bg-primary/40" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-primary" />
                </div>

                <div className="relative h-full flex items-end">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-12 lg:pb-32 w-full">
                        <div className="max-w-sm md:max-w-xl lg:max-w-3xl transition-all duration-300">
                            <div className="backdrop-blur-sm bg-black/20 rounded-lg p-4 md:p-6 lg:p-8 shadow-2xl border border-white/10">
                                <div className="h-4 w-32 bg-primary/30 rounded-full mb-3 animate-pulse" />
                                <div className="h-8 md:h-10 lg:h-12 bg-white/20 rounded-md mb-3 animate-pulse w-2/3" />
                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                    <div className="h-5 w-14 bg-yellow-400/30 rounded animate-pulse" />
                                    <div className="h-5 w-12 bg-white/20 rounded animate-pulse" />
                                    <div className="h-4 w-8 bg-white/20 rounded animate-pulse" />
                                </div>
                                <div className="space-y-2 mb-4">
                                    <div className="h-4 bg-white/20 rounded animate-pulse w-full" />
                                    <div className="h-4 bg-white/20 rounded animate-pulse w-full" />
                                    <div className="h-4 bg-white/20 rounded animate-pulse w-5/6" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-10 w-28 bg-primary/30 rounded-lg animate-pulse" />
                                    <div className="h-10 w-24 bg-white/20 rounded-lg animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Spotlight Skeleton */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="h-10 w-64 bg-bg-tertiary rounded-md mb-12 animate-pulse" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px] md:auto-rows-[250px]">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className={clsx(
                                "rounded-2xl bg-bg-tertiary animate-pulse",
                                i === 0 && "col-span-2 row-span-2",
                                i === 1 && "col-span-1 row-span-2",
                                i === 2 && "col-span-1 row-span-1",
                                i === 3 && "col-span-1 row-span-1"
                            )}
                        />
                    ))}
                </div>
            </section>

            {/* Editorial Skeleton */}
            <section className="py-16 md:py-24 bg-bg-tertiary">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 lg:gap-12">
                        <div>
                            <div className="h-8 w-48 bg-bg-secondary rounded-md mb-6 animate-pulse" />
                            <div className="h-32 w-full bg-bg-secondary rounded-md animate-pulse" />
                        </div>
                        <div className="overflow-x-auto pb-4">
                            <div className="flex gap-6 min-w-max">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="w-[320px] md:w-[400px]">
                                        <div className="aspect-video bg-bg-secondary rounded-xl animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Collection Skeleton */}
            <section className="py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="h-10 w-64 bg-bg-tertiary rounded-md mb-8 animate-pulse" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                        {Array.from({ length: 18 }).map((_, i) => (
                            <MovieCardSkeleton key={i} />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};
