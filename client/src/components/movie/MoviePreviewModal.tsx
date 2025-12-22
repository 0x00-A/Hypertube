import { X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import type { IMovie, ITrendingMovie, IRecommendedMovie } from '../../types/movie.types';

interface MoviePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    movie: IMovie | ITrendingMovie | IRecommendedMovie | null;
}

export default function MoviePreviewModal({ isOpen, onClose, movie }: MoviePreviewModalProps) {
    const navigate = useNavigate();

    // Close on escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !movie) return null;

    const handleGetStarted = () => {
        navigate('/auth/register');
        onClose();
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Helper to get backdrop image from different movie types
    const getMovieBackdrop = () => {
        if ('images' in movie) {
            const images = movie.images;
            // Check if images has backdrop property
            if ('backdrop' in images && images.backdrop) {
                return images.backdrop;
            }
        }
        return '';
    };

    const backdrop = getMovieBackdrop();

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div className="relative w-full max-w-4xl mx-4 bg-bg-card rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                    aria-label="Close modal"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Backdrop Image */}
                <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
                    {backdrop ? (
                        <>
                            <img
                                src={backdrop}
                                alt={movie.title}
                                className="w-full h-full object-cover"
                            />
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-bg-card/60 to-transparent" />
                        </>
                    ) : (
                        <div className="w-full h-full bg-bg-tertiary flex items-center justify-center">
                            <span className="text-text-muted text-lg">No Image Available</span>
                        </div>
                    )}

                    {/* Content overlay on image */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                        {/* Title */}
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
                            {movie.title}
                        </h2>

                        {/* Metadata badges */}
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            {movie.year && (
                                <span className="px-3 py-1 bg-bg-tertiary/80 backdrop-blur-sm border border-border rounded-lg text-sm text-text-secondary">
                                    {movie.year}
                                </span>
                            )}
                            {movie.rating && (
                                <span className="px-3 py-1 bg-primary/20 backdrop-blur-sm border border-primary rounded-lg text-sm text-primary font-semibold">
                                    ★ {typeof movie.rating === 'number' ? movie.rating.toFixed(1) : movie.rating}
                                </span>
                            )}
                            {movie.genres && movie.genres.length > 0 && (
                                <span className="px-3 py-1 bg-bg-tertiary/80 backdrop-blur-sm border border-border rounded-lg text-sm text-text-secondary">
                                    {movie.genres.slice(0, 2).join(', ')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom section with description and CTA */}
                <div className="p-6 md:p-8">
                    {/* Description */}
                    <p className="text-text-secondary text-base md:text-lg leading-relaxed mb-6 line-clamp-3">
                        {('overview' in movie && movie.overview) || ('synopsis' in movie && movie.synopsis) || 'No description available.'}
                    </p>

                    {/* Get Started Button */}
                    <button
                        onClick={handleGetStarted}
                        className="w-full md:w-auto px-8 py-3.5 bg-primary hover:bg-primary-light text-black font-bold text-base rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group shadow-lg shadow-primary/20 hover:shadow-primary/30"
                    >
                        <span>Get Started</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}
