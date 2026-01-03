/**
 * Watch Page - Streaming/Watching Experience
 * 
 * Premium streaming page with:
 * - Video player with trailer embed
 * - Movie info section
 * - Storyline section
 * - Watchlist functionality
 */

import { useState, useRef, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Settings,
    Maximize,
    Minimize,
    Share2,
    Star,
    Plus,
    Check
} from 'lucide-react';
import { clsx } from 'clsx';
import { useMovieDetails } from '../../hooks/useMovieDetails';
import { useAddToWatchlist, useRemoveFromWatchlist } from '../../hooks/useMovieInteractions';
import { useUserRating } from '../../hooks/useUserRating';
import { CommentSection } from '../../components/comments';
import { MovieRating } from '../../components/movie';
import ShareModal from '../../components/common/ShareModal';
import toast from 'react-hot-toast';

export default function Watch() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();

    // Get movie details
    const isTmdbMovie = location.state?.isTmdbMovie ?? true;
    const { data: movie, isLoading, error } = useMovieDetails({ id: id || '', isTmdbMovie });

    // Video player state
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [progress, setProgress] = useState(35); // Mock progress at 35%
    const [currentTime, setCurrentTime] = useState('01:04:09');
    const duration = '01:23:47'; // Mock duration

    // Storyline state
    const [isStoryExpanded, setIsStoryExpanded] = useState(false);

    // Rating modal state
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const { data: currentRating } = useUserRating(movie?._id ?? '');

    // Share modal state
    const [isShareOpen, setIsShareOpen] = useState(false);

    // Watchlist mutations
    const { mutate: addToWatchlist, isPending: isAdding } = useAddToWatchlist();
    const { mutate: removeFromWatchlist, isPending: isRemoving } = useRemoveFromWatchlist();

    // Video container ref for fullscreen
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<number | null>(null);

    // Auto-hide controls after 3 seconds
    useEffect(() => {
        if (showControls && isPlaying) {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
        return () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        };
    }, [showControls, isPlaying]);

    // Handle play/pause toggle
    const togglePlay = () => {
        setIsPlaying(!isPlaying);
        setShowControls(true);
    };

    // Handle mute toggle
    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    // Handle fullscreen toggle
    const toggleFullscreen = () => {
        if (!document.fullscreenElement && videoContainerRef.current) {
            videoContainerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Handle progress bar click
    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newProgress = (clickX / rect.width) * 100;
        setProgress(Math.max(0, Math.min(100, newProgress)));

        // Update mock current time based on progress
        const totalSeconds = 5027; // 01:23:47 in seconds
        const currentSeconds = Math.floor((newProgress / 100) * totalSeconds);
        const hours = Math.floor(currentSeconds / 3600);
        const minutes = Math.floor((currentSeconds % 3600) / 60);
        const seconds = currentSeconds % 60;
        setCurrentTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    // Handle mouse move to show controls
    const handleMouseMove = () => {
        setShowControls(true);
    };

    // Handle watchlist toggle - matching MovieDetails implementation
    const handleWatchlistClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!movie) return;

        if (movie.inWatchlist) {
            if (movie._id) {
                removeFromWatchlist(movie._id);
            } else {
                toast.error('Cannot remove from watchlist: Missing movie ID');
            }
        } else {
            const movieId = movie._id || movie.tmdbId;
            const isTmdb = !movie._id;

            if (movieId) {
                addToWatchlist({ id: movieId, isTmdbMovie: isTmdb });
            } else {
                toast.error('Cannot add to watchlist: Missing movie identifier');
            }
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-text-secondary">Loading movie...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !movie) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl text-white font-bold mb-4">Movie not found</h2>
                    <button
                        onClick={() => navigate('/movies')}
                        className="text-primary hover:underline"
                    >
                        Back to Movies
                    </button>
                </div>
            </div>
        );
    }

    const backdropUrl = movie.images?.backdrop || movie.images?.poster || movie.images?.thumbnail;
    const posterUrl = movie.images?.poster || movie.images?.thumbnail;
    const storyline = movie.synopsis || movie.overview || '';
    const truncatedStoryline = storyline.length > 300 ? storyline.substring(0, 300) + '...' : storyline;

    // Extract YouTube video ID from trailer URL and generate embed URL
    const getYouTubeEmbedUrl = (trailerUrl?: string): string | null => {
        if (!trailerUrl) return null;
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/,
            /youtube\.com\/v\/([^&?/]+)/
        ];
        for (const pattern of patterns) {
            const match = trailerUrl.match(pattern);
            if (match && match[1]) {
                return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`;
            }
        }
        return null;
    };

    const trailerEmbedUrl = getYouTubeEmbedUrl(movie.trailer);
    const isWatchlistLoading = isAdding || isRemoving;

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Video Player Section */}
                <div
                    ref={videoContainerRef}
                    className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border-2 border-primary/30 cursor-pointer"
                    onMouseMove={handleMouseMove}
                    onClick={!isPlaying ? togglePlay : undefined}
                >
                    {/* Video/Poster or Trailer */}
                    <div className="w-full h-full relative">
                        {isPlaying && trailerEmbedUrl ? (
                            <iframe
                                src={trailerEmbedUrl}
                                title={`${movie.title} Trailer`}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="absolute inset-0 w-full h-full border-none"
                            />
                        ) : (
                            <>
                                <img
                                    src={backdropUrl}
                                    alt={movie.title}
                                    className={clsx(
                                        "w-full h-full object-cover transition-all duration-300",
                                        isPlaying && "brightness-50"
                                    )}
                                />

                                {/* Play button overlay when paused */}
                                {!isPlaying && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent to-black/40">
                                        <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:border-primary">
                                            <Play className="w-10 h-10 text-white fill-white ml-1" />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Video Controls */}
                    <div
                        className={clsx(
                            "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-300",
                            showControls ? "opacity-100" : "opacity-0"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Progress Bar */}
                        <div className="w-full py-2 cursor-pointer group" onClick={handleProgressClick}>
                            <div className="w-full h-1 bg-white/20 rounded-full relative group-hover:h-1.5 transition-all">
                                <div
                                    className="h-full bg-primary rounded-full"
                                    style={{ width: `${progress}%` }}
                                />
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ left: `${progress}%` }}
                                />
                            </div>
                        </div>

                        {/* Controls Row */}
                        <div className="flex items-center justify-between mt-3">
                            {/* Left Controls */}
                            <div className="flex items-center gap-3">
                                <button
                                    className="w-9 h-9 flex items-center justify-center rounded text-white hover:bg-white/10 hover:text-primary transition-colors"
                                    onClick={togglePlay}
                                >
                                    {isPlaying ? (
                                        <Pause className="w-6 h-6" />
                                    ) : (
                                        <Play className="w-6 h-6 ml-0.5" />
                                    )}
                                </button>

                                <span className="text-sm text-white/90 tabular-nums">
                                    {currentTime} / {duration}
                                </span>

                                <button
                                    className="w-9 h-9 flex items-center justify-center rounded text-white hover:bg-white/10 hover:text-primary transition-colors"
                                    onClick={toggleMute}
                                >
                                    {isMuted ? (
                                        <VolumeX className="w-5 h-5" />
                                    ) : (
                                        <Volume2 className="w-5 h-5" />
                                    )}
                                </button>
                            </div>

                            {/* Right Controls */}
                            <div className="flex items-center gap-2">
                                <button className="w-9 h-9 flex items-center justify-center rounded text-white hover:bg-white/10 hover:text-primary transition-colors">
                                    <Settings className="w-5 h-5" />
                                </button>
                                <button
                                    className="w-9 h-9 flex items-center justify-center rounded text-white hover:bg-white/10 hover:text-primary transition-colors"
                                    onClick={toggleFullscreen}
                                >
                                    {isFullscreen ? (
                                        <Minimize className="w-5 h-5" />
                                    ) : (
                                        <Maximize className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Movie Info Section */}
                <div className="mt-6">
                    {/* Title Row */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white">
                                {movie.title}
                                {movie.year && (
                                    <span className="text-base text-text-secondary font-normal ml-2">({movie.year})</span>
                                )}
                            </h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsShareOpen(true)}
                                className="w-10 h-10 flex items-center justify-center border border-white/20 rounded text-white/70 hover:border-primary hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                            {movie.rating && (
                                <div className="flex items-center gap-2 ml-2">
                                    {/* IMDb Rating */}
                                    <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
                                        <span className="text-base font-bold text-white">{movie.rating.toFixed(1)}</span>
                                        <span className="bg-[#F5C518] text-black text-[10px] font-bold px-1.5 py-0.5 rounded">IMDb</span>
                                    </div>
                                    {/* User Rating Button */}
                                    <button
                                        onClick={() => setIsRatingModalOpen(true)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-all active:scale-95 group"
                                    >
                                        <Star className={clsx("w-4 h-4 transition-colors", currentRating ? "fill-primary text-primary" : "text-white/60 group-hover:text-white")} />
                                        <span className="text-sm font-bold">
                                            {currentRating ? `${currentRating}/10` : 'Rate'}
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Show Info Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
                                <img
                                    src={posterUrl}
                                    alt={movie.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <span className="text-base font-medium text-white">{movie.title}</span>
                        </div>

                        <button
                            onClick={handleWatchlistClick}
                            disabled={isWatchlistLoading}
                            className={clsx(
                                "flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                                movie.inWatchlist
                                    ? "bg-primary text-black hover:bg-primary/90"
                                    : "border-2 border-primary text-primary hover:bg-primary hover:text-black"
                            )}
                        >
                            {isWatchlistLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    <span>Loading...</span>
                                </>
                            ) : movie.inWatchlist ? (
                                <>
                                    <Check className="w-5 h-5 stroke-[3]" />
                                    <span>In Watchlist</span>
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5 stroke-[3]" />
                                    <span>Add to Watchlist</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-white/10 my-6" />

                    {/* Story Line Section */}
                    <div>
                        <h3 className="text-base font-bold text-white mb-3">Story line:</h3>
                        <p className="text-sm md:text-base leading-relaxed text-white/80">
                            {isStoryExpanded ? storyline : truncatedStoryline}
                            {storyline.length > 300 && (
                                <button
                                    className="text-primary font-semibold ml-2 hover:underline"
                                    onClick={() => setIsStoryExpanded(!isStoryExpanded)}
                                >
                                    {isStoryExpanded ? 'Show Less' : 'Read More'}
                                </button>
                            )}
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-white/10 my-6" />

                    {/* Comments Section */}
                    {movie.tmdbId && <CommentSection tmdbId={movie.tmdbId} />}
                </div>

                {/* Rating Modal */}
                {movie._id && (
                    <MovieRating
                        isOpen={isRatingModalOpen}
                        onClose={() => setIsRatingModalOpen(false)}
                        currentRating={currentRating}
                        movieId={movie._id}
                        movieTitle={movie.title}
                    />
                )}

                {/* Share Modal */}
                <ShareModal
                    isOpen={isShareOpen}
                    onClose={() => setIsShareOpen(false)}
                    title="Share this movie"
                />
            </div>
        </div>
    );
}
