import { useNavigate } from "react-router-dom";
import { Star, Bookmark, Loader2 } from "lucide-react";
import type { IMovie } from "../../types/movie.types";

interface SearchDropdownProps {
    movies: IMovie[];
    isLoading: boolean;
    searchQuery: string;
    onClose: () => void;
    hasResults: boolean;
}

export default function SearchDropdown({
    movies,
    isLoading,
    searchQuery,
    onClose,
    hasResults,
}: SearchDropdownProps) {
    const navigate = useNavigate();

    const handleMovieClick = (movie: IMovie) => {
        onClose();
        const id = movie._id || movie.tmdbId;
        const isTmdbMovie = !movie._id;
        navigate(`/movies/${id}`, { state: { isTmdbMovie } });
    };

    // Show nothing if no query
    if (!searchQuery || searchQuery.length < 2) {
        return null;
    }

    return (
        <div className="absolute top-full left-0 right-0 mt-2 bg-bg-secondary border border-border rounded-xl shadow-2xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-8 gap-2">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <span className="text-text-muted text-sm">Searching...</span>
                </div>
            )}

            {/* No Results State */}
            {!isLoading && !hasResults && (
                <div className="py-8 text-center">
                    <p className="text-text-muted text-sm">No results found.</p>
                    <div className="flex items-center justify-center gap-1 mt-3">
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse delay-100"></span>
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse delay-200"></span>
                    </div>
                </div>
            )}

            {/* Results */}
            {!isLoading && hasResults && (
                <>
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-border">
                        <span className="text-text-secondary text-sm">Your search result</span>
                    </div>

                    {/* Movie List */}
                    <div className="divide-y divide-border/50">
                        {movies.slice(0, 5).map((movie) => (
                            <button
                                key={movie._id || movie.tmdbId || movie.imdbId}
                                onClick={() => handleMovieClick(movie)}
                                className="w-full flex items-start gap-3 p-3 hover:bg-bg-tertiary transition-colors text-left"
                            >
                                {/* Poster */}
                                <img
                                    src={movie.images?.thumbnail || movie.images?.poster || '/placeholder-movie.png'}
                                    alt={movie.title}
                                    className="w-14 h-20 object-cover rounded-lg flex-shrink-0"
                                />

                                {/* Info */}
                                <div className="flex-1 min-w-0 py-1">
                                    {/* Title with Bookmark */}
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-text-primary font-semibold text-base truncate">
                                            {movie.title}
                                        </h4>
                                        {movie.inWatchlist && (
                                            <Bookmark className="w-4 h-4 text-primary fill-primary flex-shrink-0" />
                                        )}
                                    </div>

                                    {/* Rating and Year */}
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 text-primary fill-primary" />
                                            <span className="text-text-secondary text-sm">
                                                {movie.rating?.toFixed(1) || 'N/A'}/10
                                            </span>
                                        </div>
                                        <span className="text-text-muted text-sm">{movie.year}</span>
                                    </div>

                                    {/* Genres */}
                                    {movie.genres && movie.genres.length > 0 && (
                                        <p className="text-text-muted text-sm mt-1.5 truncate">
                                            {movie.genres.join(' | ')}
                                        </p>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
