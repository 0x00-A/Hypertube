
export const MovieDetailsSkeleton = () => {
    return (
        <div className="min-h-screen bg-background animate-pulse">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Ticket Hero Skeleton */}
                <div className="relative w-full rounded-xl overflow-hidden flex flex-col md:flex-row bg-[#111] h-[500px] md:h-[600px]">
                    {/* Left Side - Poster Skeleton */}
                    <div className="hidden md:block w-[35%] bg-white/5" />

                    {/* Right Side - Info Skeleton */}
                    <div className="relative w-full md:w-[65%] p-6 md:p-12 flex flex-col justify-center gap-6">
                        {/* Title */}
                        <div className="h-12 md:h-20 bg-white/10 rounded-lg w-3/4 mb-4" />

                        {/* Year/Duration info */}
                        <div className="flex gap-4">
                            <div className="h-4 bg-white/5 rounded w-16" />
                            <div className="h-4 bg-white/5 rounded w-20" />
                        </div>

                        {/* Genres */}
                        <div className="flex gap-2">
                            <div className="h-8 bg-white/5 rounded-full w-24" />
                            <div className="h-8 bg-white/5 rounded-full w-20" />
                            <div className="h-8 bg-white/5 rounded-full w-28" />
                        </div>

                        {/* Synopsis */}
                        <div className="space-y-3">
                            <div className="h-4 bg-white/5 rounded w-full" />
                            <div className="h-4 bg-white/5 rounded w-full" />
                            <div className="h-4 bg-white/5 rounded w-5/6" />
                            <div className="h-4 bg-white/5 rounded w-4/6" />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-4 mt-4">
                            <div className="h-12 bg-white/10 rounded-xl w-32" />
                            <div className="h-12 bg-white/5 rounded-xl w-40" />
                            <div className="h-12 bg-white/5 rounded-xl w-12" />
                            <div className="h-12 bg-white/5 rounded-xl w-12" />
                        </div>
                    </div>
                </div>

                {/* Tabs Skeleton */}
                <div className="mt-12">
                    <div className="border-b border-border flex gap-8 pb-4">
                        <div className="h-6 bg-white/10 rounded w-24" />
                        <div className="h-6 bg-white/5 rounded w-28" />
                        <div className="h-6 bg-white/5 rounded w-20" />
                    </div>

                    <div className="mt-8 space-y-12">
                        <div className="h-8 bg-white/10 rounded w-40" />

                        {/* Info Grid Skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex justify-between py-4 border-b border-white/5">
                                        <div className="h-5 bg-white/5 rounded w-32" />
                                        <div className="h-5 bg-white/5 rounded w-24" />
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-4">
                                {[1, 2].map((i) => (
                                    <div key={i} className="flex justify-between py-4 border-b border-white/5">
                                        <div className="h-5 bg-white/5 rounded w-32" />
                                        <div className="h-5 bg-white/5 rounded w-24" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Cast Skeleton */}
                        <div className="space-y-6">
                            <div className="h-8 bg-white/10 rounded w-32" />
                            <div className="flex gap-6 overflow-hidden">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="flex flex-col items-center gap-3 min-w-[100px]">
                                        <div className="w-20 h-20 rounded-full bg-white/5 border-2 border-border" />
                                        <div className="h-4 bg-white/5 rounded w-16" />
                                        <div className="h-3 bg-white/5 rounded w-12" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
