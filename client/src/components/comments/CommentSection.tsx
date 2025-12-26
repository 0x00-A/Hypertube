import { useState } from 'react';
import { clsx } from 'clsx';
import { useMovieComments } from '../../hooks/useMovieComments';
import { CommentForm } from './CommentForm';
import { CommentCard } from './CommentCard';

interface CommentSectionProps {
    tmdbId: number;
}

type SortOption = 'createdAt' | 'updatedAt';
type SortOrder = 'desc' | 'asc';

export const CommentSection = ({ tmdbId }: CommentSectionProps) => {
    const [sortBy, setSortBy] = useState<SortOption>('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const { data: commentsData, isLoading, error } = useMovieComments({
        tmdbId,
        sortBy,
        sortOrder,
    });

    const handleSortChange = (newSortBy: SortOption, newSortOrder: SortOrder) => {
        setSortBy(newSortBy);
        setSortOrder(newSortOrder);
    };

    const totalComments = commentsData?.pagination.total || 0;

    return (
        <div className="space-y-6">
            {/* Comment Form */}
            <CommentForm tmdbId={tmdbId} />

            {/* Sort Controls */}
            <div className="flex items-center justify-between bg-card border border-white/10 rounded-xl px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm sm:text-base">Sort by:</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleSortChange('createdAt', 'desc')}
                            className={clsx(
                                'px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors',
                                sortBy === 'createdAt' && sortOrder === 'desc'
                                    ? 'bg-primary text-black'
                                    : 'bg-white/5 text-text-secondary hover:text-white hover:bg-white/10'
                            )}
                        >
                            Newest
                        </button>
                        <button
                            onClick={() => handleSortChange('createdAt', 'asc')}
                            className={clsx(
                                'px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors',
                                sortBy === 'createdAt' && sortOrder === 'asc'
                                    ? 'bg-primary text-black'
                                    : 'bg-white/5 text-text-secondary hover:text-white hover:bg-white/10'
                            )}
                        >
                            Oldest
                        </button>
                    </div>
                </div>

                <span className="text-text-secondary text-xs sm:text-sm">
                    ({totalComments.toLocaleString()})
                </span>
            </div>

            {/* Comments List */}
            {isLoading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="bg-card border border-white/10 rounded-xl p-4 sm:p-6 animate-pulse"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/10" />
                                <div className="flex-1 space-y-3">
                                    <div className="h-4 bg-white/10 rounded w-1/4" />
                                    <div className="h-3 bg-white/10 rounded w-3/4" />
                                    <div className="h-3 bg-white/10 rounded w-1/2" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="text-center py-12 bg-card border border-white/10 rounded-xl">
                    <p className="text-red-500 mb-2">Failed to load comments</p>
                    <p className="text-text-secondary text-sm">Please try again later</p>
                </div>
            ) : !commentsData || commentsData.data.length === 0 ? (
                <div className="text-center py-12 bg-card border border-white/10 rounded-xl">
                    <p className="text-text-secondary text-base sm:text-lg">
                        No comments yet. Be the first to share your thoughts!
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {commentsData.data.map((comment) => (
                        <CommentCard key={comment._id} comment={comment} tmdbId={tmdbId} />
                    ))}
                </div>
            )}
        </div>
    );
};
