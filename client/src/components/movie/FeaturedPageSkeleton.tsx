import { clsx } from "clsx";
import { MovieCardSkeleton } from "./MovieCardSkeleton";

export const FeaturedPageSkeleton = () => {
    return (
        <div className="min-h-screen bg-bg-primary">
            {/* Hero Skeleton - Clean Modern Layout */}
            <div className="relative h-screen w-full overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-bg-secondary via-bg-tertiary to-bg-secondary animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/80 via-transparent to-bg-primary/40" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-primary" />
                </div>

                <div className="relative h-full flex flex-col justify-between">
                    <div className="flex-1 flex items-end">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-20 lg:pb-24 w-full">
                            <div className="max-w-2xl md:max-w-3xl lg:max-w-4xl transition-all duration-500">
                                
                                {/* Skeleton #1 Badge */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-10 md:h-12 w-16 md:w-20 bg-primary/30 rounded-lg animate-pulse" />
                                    <div className="h-5 w-32 bg-primary/30 rounded animate-pulse" />
                                </div>

                                {/* Skeleton Title - Extra Large */}
                                <div className="h-12 md:h-16 lg:h-20 bg-white/30 rounded-md mb-4 md:mb-6 animate-pulse w-3/4 md:w-2/3" />

                                {/* Skeleton Meta Info */}
                                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 flex-wrap">
                                    <div className="h-8 w-20 bg-yellow-400/30 rounded animate-pulse" />
                                    <div className="h-6 w-12 bg-white/20 rounded animate-pulse" />
                                    <div className="h-6 w-16 bg-white/20 rounded animate-pulse" />
                                    <div className="h-6 w-20 bg-white/20 rounded animate-pulse" />
                                    <div className="h-6 w-24 bg-white/20 rounded animate-pulse" />
                                </div>

                                {/* Skeleton Overview - Larger */}
                                <div className="space-y-3 mb-6 md:mb-8 max-w-3xl">
                                    <div className="h-6 md:h-7 bg-white/20 rounded animate-pulse w-full" />
                                    <div className="h-6 md:h-7 bg-white/20 rounded animate-pulse w-full" />
                                    <div className="h-6 md:h-7 bg-white/20 rounded animate-pulse w-5/6" />
                                </div>

                                {/* Skeleton Buttons - Prominent */}
                                <div className="flex items-center gap-3 md:gap-4">
                                    <div className="h-12 md:h-14 lg:h-16 w-36 md:w-44 lg:w-52 bg-primary/30 rounded-md animate-pulse" />
                                    <div className="h-12 md:h-14 lg:h-16 w-28 md:w-36 lg:w-40 bg-white/20 rounded-md animate-pulse" />
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
