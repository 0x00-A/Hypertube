import { useNavigate, Link } from "react-router-dom";
import { Star, Bookmark, Loader2, LogIn, X } from "lucide-react";
import type { IMovie } from "../../types/movie.types";

interface SearchDropdownProps {
    movies: IMovie[];
    isLoading: boolean;
    searchQuery: string;
    onClose: () => void;
    hasResults: boolean;
    isAuthenticated?: boolean;
}

export default function SearchDropdown({
    movies,
    isLoading,
    searchQuery,
    onClose,
    hasResults,
    isAuthenticated = true,
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

    // Not authenticated — show login prompt
    if (!isAuthenticated) {
        return (
            <div className="absolute top-full left-0 right-0 mt-2 bg-bg-secondary border border-border rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="flex flex-col items-center justify-center py-8 px-4 gap-3 text-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <LogIn className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-text-primary font-semibold text-sm">Login to search movies</p>
                        <p className="text-text-muted text-xs mt-1">Create an account or sign in to start searching</p>
                    </div>
                    <Link
                        to="/auth/login"
                        onClick={onClose}
                        className="px-5 py-1.5 text-sm font-medium text-black bg-primary rounded-lg hover:bg-primary-light transition-colors"
                    >
                        Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute top-full left-0 right-0 mt-2 bg-bg-secondary border border-border rounded-xl shadow-2xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
             <button
                onClick={onClose}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors z-[60]"
            >
                <X className="w-4 h-4" />
            </button>

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
