import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { clsx } from 'clsx';

interface MovieRatingProps {
    isOpen: boolean;
    onClose: () => void;
    currentRating: number | null | undefined;
    movieId: string;
    movieTitle: string;
}


import { useMovieRating } from '../../hooks/useMovieRating';

const MovieRating: React.FC<MovieRatingProps> = ({
    isOpen,
    onClose,
    currentRating,
    movieId,
    movieTitle,
}) => {
    const [hoverRating, setHoverRating] = useState<number | null>(null);
    const [selectedRating, setSelectedRating] = useState<number | null>(currentRating || null);
    const { mutate: rateMovie, isPending: isSubmitting } = useMovieRating({ movieId });

    if (!isOpen) return null;

    const stars = Array.from({ length: 10 }, (_, i) => i + 1);

    const handleSubmit = () => {
        if (selectedRating) {
            rateMovie(selectedRating, {
                onSuccess: () => onClose(),
            });
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70"
            role="dialog"
            aria-modal="true"
            aria-labelledby="movie-rating-title"
        >
            <div
                className="relative w-full sm:max-w-lg bg-bg-primary rounded-t-3xl sm:rounded-3xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id="movie-rating-title" className="sr-only">
                    Rate {movieTitle}
                </h2>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors z-10"
                    aria-label="Close"
                >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                <div className="p-5 sm:p-8">
                    {/* Large Star with Rating Number */}
                    <div className="flex justify-center mb-4 sm:mb-6">
                        <div className="relative">
                            <Star 
                                className={clsx(
                                    "w-24 h-24 sm:w-32 sm:h-32 transition-all duration-300",
                                    selectedRating 
                                        ? "text-accent-yellow fill-accent-yellow" 
                                        : "text-accent-yellow fill-accent-yellow"
                                )} 
                            />
                            {selectedRating && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-3xl sm:text-4xl font-bold text-black mt-1 sm:mt-2">
                                        {selectedRating}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-5 sm:mb-8">
                        <h3 className="text-accent-yellow text-xs sm:text-sm font-semibold tracking-wider uppercase mb-1 sm:mb-2">
                            RATE THIS
                        </h3>
                        <h2 className="text-xl sm:text-2xl font-bold text-white">
                            {movieTitle}
                        </h2>
                    </div>

                    {/* Stars Selection */}
                    <div className="flex justify-center items-center gap-0.5 sm:gap-1 mb-5 sm:mb-8">
                        {stars.map((num) => {
                            const isActive = (hoverRating || selectedRating || 0) >= num;

                            return (
                                <button
                                    key={num}
                                    onMouseEnter={() => setHoverRating(num)}
                                    onMouseLeave={() => setHoverRating(null)}
                                    onClick={() => setSelectedRating(num)}
                                    className="transition-all duration-200 active:scale-90 hover:scale-110 p-0.5 sm:p-1"
                                    aria-label={`Rate ${num} stars`}
                                >
                                    <Star
                                        className={clsx(
                                            "w-6 h-6 sm:w-8 sm:h-8 transition-colors duration-200",
                                            isActive 
                                                ? "text-accent-yellow fill-accent-yellow" 
                                                : "text-white/20 fill-transparent"
                                        )}
                                    />
                                </button>
                            );
                        })}
                    </div>

                    {/* Rate Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedRating}
                        className={clsx(
                            "w-full py-3.5 sm:py-4 rounded-xl font-semibold text-base transition-all duration-200 mb-2 sm:mb-3",
                            selectedRating && !isSubmitting
                                ? "bg-white/10 text-white hover:bg-white/15 active:scale-[0.98]"
                                : "bg-white/5 text-white/30 cursor-not-allowed"
                        )}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                Submitting...
                            </span>
                        ) : (
                            'Rate'
                        )}
                    </button>
                </div>
            </div>

            {/* Backdrop Click */}
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
};

export default MovieRating;