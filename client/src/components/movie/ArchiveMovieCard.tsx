import { Plus, Check } from 'lucide-react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import type { IMovie } from '../../types/movie.types';
import { useAuthState } from '../../hooks/useAuth';
import MoviePreviewModal from './MoviePreviewModal';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAddToWatchlist, useRemoveFromWatchlist } from '../../hooks/useMovieInteractions';
import { clsx } from 'clsx';

export interface ArchiveMovieCardProps {
    movie: IMovie;
    rank: number;
    className?: string;
}

/**
 * ArchiveMovieCard Component
 * Displays a movie card with a rank ribbon bar for the Archive section
 * Structure: Rank bar at top + Complete MovieCard below
 * 
 * Note: Parent should use a stable key (movie._id or movie.tmdbId) to ensure
 * component re-mounts when displaying a different movie.
 */
export const ArchiveMovieCard = ({ movie, rank, className }: ArchiveMovieCardProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInWatchlist, setIsInWatchlist] = useState(movie.inWatchlist || false);
    
    const { isAuthenticated } = useAuthState();
    const navigate = useNavigate();
    const { mutate: addToWatchlist, isPending: isAdding } = useAddToWatchlist();
    const { mutate: removeFromWatchlist, isPending: isRemoving } = useRemoveFromWatchlist();

    // Memoized image URL getter
    const posterImage = useMemo(() => {
        if ('images' in movie) {
            const { images } = movie;
            if ('poster' in images && images.poster) return images.poster;
            if ('thumbnail' in images && images.thumbnail) return images.thumbnail;
        }
        return '';
    }, [movie]);

    const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
    const hasError = failedImages.has(posterImage);

    const handleImageError = useCallback(() => {
        setFailedImages(prev => new Set(prev).add(posterImage));
    }, [posterImage]);

    // Format rating to one decimal place
    const formattedRating = useMemo(() => {
        if (!movie.rating) return 'N/A';
        return typeof movie.rating === 'string'
            ? movie.rating
            : movie.rating.toFixed(1);
    }, [movie.rating]);

    // Get synopsis text
    const synopsis = useMemo(() => {
        if ('synopsis' in movie && movie.synopsis) return movie.synopsis;
        if ('overview' in movie && movie.overview) return movie.overview;
        return '';
    }, [movie]);

    // Get genres
    const genres = useMemo(() => {
        if ('genres' in movie && movie.genres) {
            return movie.genres.slice(0, 3).join(', ');
        }
        return null;
    }, [movie]);

    // Get duration
    const duration = useMemo(() => {
        if ('duration' in movie && movie.duration) return movie.duration;
        return null;
    }, [movie]);

    // Handle card click - navigate or show modal
    const handleCardClick = useCallback(() => {
        if (!isAuthenticated) {
            setIsModalOpen(true);
            return;
        }

        try {
            const id = movie._id || movie.tmdbId;
            const isTmdbMovie = !movie._id;
            navigate(`/movies/${id}`, { state: { isTmdbMovie } });
        } catch {
            toast.error('Failed to navigate to movie details');
        }
    }, [isAuthenticated, movie._id, movie.tmdbId, navigate]);

    // Handle watchlist button click
    const handleWatchlistClick = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (!isAuthenticated) {
            setIsModalOpen(true);
            return;
        }

        const previousState = isInWatchlist;

        if (isInWatchlist) {
            const id = movie._id;
            if (!id) {
                toast.error('Cannot remove: Missing movie ID');
                return;
            }

            setIsInWatchlist(false);
            removeFromWatchlist(id, {
                onError: () => setIsInWatchlist(previousState),
            });
        } else {
            const id = movie._id || movie.tmdbId;
            const isTmdbMovie = !movie._id;

            if (!id) {
                toast.error('Cannot add: Missing movie identifier');
                return;
            }

            setIsInWatchlist(true);
            addToWatchlist({ id, isTmdbMovie }, {
                onError: () => setIsInWatchlist(previousState),
            });
        }
    }, [isAuthenticated, isInWatchlist, movie._id, movie.tmdbId, addToWatchlist, removeFromWatchlist]);

    // Handle keyboard navigation for watchlist button
    const handleWatchlistKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleWatchlistClick(e);
        }
    }, [handleWatchlistClick]);

    // Handle keyboard navigation for card
    const handleCardKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleCardClick();
        }
    }, [handleCardClick]);

    const isLoading = isAdding || isRemoving;

    return (
        <>
            <article
                className={clsx(
                    'relative rounded-xl shadow-lg transition-all duration-500 overflow-hidden',
                    'hover:shadow-2xl hover:z-10 w-full h-full flex flex-col group',
                    className
                )}
            >
                {/* Part 1: Rank Ribbon Bar - Completely separate section at top */}
                <div
                    className="flex items-center justify-between px-3 py-2 bg-[#1a1a1a]"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
                >
                    <span className="text-[#f5c518] text-lg font-bold">
                        #{rank}
                    </span>
                    <span className="text-white text-xs font-semibold tracking-wider uppercase">
                        TOP RATED
                    </span>
                </div>

                {/* Part 2: Complete MovieCard - Exactly like original */}
                <div
                    className={clsx(
                        'relative cursor-pointer bg-border p-2 flex-1 transition-all duration-500',
                        movie.isWatched && 'border-2 border-green-500'
                    )}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onClick={handleCardClick}
                    onKeyDown={handleCardKeyDown}
                    tabIndex={0}
                    role="button"
                    aria-label={`View details for ${movie.title}`}
                >
                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg flex-1 bg-zinc-900">
                        {/* Poster Image or Clean Background */}
                        {!posterImage || hasError ? (
                            <div className={clsx(
                                "w-full h-full flex flex-col items-center justify-center bg-zinc-900 overflow-hidden",
                                "transition-all duration-700 ease-in-out",
                                isHovered && 'scale-110 brightness-[0.4]',
                                movie.isWatched && !isHovered && 'grayscale brightness-50'
                            )}>
                                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]" />
                                <div className="w-16 h-24 border-2 border-zinc-800 rounded-lg flex items-center justify-center rotate-[-12deg] mb-2 shadow-2xl">
                                    <span className="text-zinc-800 font-black text-4xl select-none">?</span>
                                </div>
                            </div>
                        ) : (
                            <img
                                src={posterImage}
                                alt={`${movie.title} poster`}
                                className={clsx(
                                    'w-full h-full object-cover transition-all duration-700 ease-in-out',
                                    isHovered && 'scale-110 brightness-[0.4]',
                                    movie.isWatched && !isHovered && 'grayscale brightness-50 blur-[1px]'
                                )}
                                loading="lazy"
                                onError={handleImageError}
                            />
                        )}

                        {/* Watchlist Button - ribbon style at top-left corner, always visible */}
                        <button
                            className={clsx(
                                'absolute top-0 left-2 z-20 flex items-center justify-center',
                                'w-8 h-10 border-none cursor-pointer',
                                'transition-all duration-300',
                                'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                // Background changes based on watchlist state
                                isInWatchlist
                                    ? 'bg-primary hover:bg-primary/80'
                                    : 'bg-zinc-800/90 hover:bg-zinc-700'
                            )}
                            style={{
                                clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)',
                            }}
                            onClick={handleWatchlistClick}
                            onKeyDown={handleWatchlistKeyDown}
                            disabled={isLoading}
                            aria-label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                            aria-pressed={isInWatchlist}
                            tabIndex={0}
                        >
                            {isInWatchlist ? (
                                <Check className="w-4 h-4 text-black -mt-1" strokeWidth={3} aria-hidden="true" />
                            ) : (
                                <Plus className="w-4 h-4 text-white -mt-1" strokeWidth={2.5} aria-hidden="true" />
                            )}
                        </button>

                        {/* Rating Badge - Always visible, top right */}
                        <div
                            className="absolute top-2 right-2 z-15 flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-1.5 rounded-lg border border-white/10"
                            aria-label={`Rating: ${formattedRating} out of 10`}
                        >
                            <span className="text-yellow-400 text-xs" aria-hidden="true">★</span>
                            <span className="text-white text-xs font-bold">{formattedRating}</span>
                        </div>

                        {/* Synopsis Overlay - Visible on hover */}
                        {synopsis && (
                            <div
                                className={clsx(
                                    'absolute inset-0 flex items-center justify-center px-4 text-center z-10 pointer-events-none transition-opacity duration-500',
                                    isHovered ? 'opacity-100' : 'opacity-0'
                                )}
                            >
                                <p className="text-white/90 text-sm font-medium leading-relaxed drop-shadow-md line-clamp-4">
                                    {synopsis}
                                </p>
                            </div>
                        )}

                        {/* Info Footer */}
                        <footer className="absolute bottom-0 left-0 right-0 backdrop-blur-md bg-black/60 z-10 rounded-b-md">
                            <div className="p-3 text-center">
                                <h3
                                    className={clsx(
                                        'text-white font-bold text-base leading-tight mb-1 drop-shadow-sm transition-colors line-clamp-2',
                                        isHovered && 'text-primary-400'
                                    )}
                                >
                                    {movie.title}
                                </h3>

                                <div className="h-5 relative overflow-hidden">
                                    {/* Genres - Default view */}
                                    <div
                                        className={clsx(
                                            'absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out',
                                            isHovered ? 'translate-y-8 opacity-0' : 'translate-y-0 opacity-100'
                                        )}
                                    >
                                        {genres ? (
                                            <p className="text-text-secondary text-xs font-medium truncate">{genres}</p>
                                        ) : (
                                            <p className="text-text-secondary text-xs font-medium truncate uppercase">
                                                {movie.originalLanguage || 'Unknown'}
                                            </p>
                                        )}
                                    </div>

                                    {/* Details - Visible on hover */}
                                    <div
                                        className={clsx(
                                            'absolute inset-0 flex items-center justify-center gap-2 transition-all duration-500 ease-out',
                                            isHovered ? 'translate-y-0 opacity-100 delay-100' : '-translate-y-8 opacity-0'
                                        )}
                                    >
                                        <span className="text-white/90 text-xs font-semibold">{movie.year}</span>
                                        {duration && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-text-muted" />
                                                <span className="text-text-secondary text-xs">{duration} min</span>
                                            </>
                                        )}
                                        {movie.originalLanguage && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-text-muted" />
                                                <span className="text-text-secondary text-xs uppercase">{movie.originalLanguage}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </footer>
                    </div>
                </div>
            </article>

            {/* Movie Preview Modal for unauthenticated users */}
            <MoviePreviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                movie={movie}
            />
        </>
    );
};
