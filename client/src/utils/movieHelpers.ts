import type { IMovie, ITrendingMovie, IRecommendedMovie } from '../types/movie.types';

/**
 * Determine if movie is stored locally
 */
export const determineIsLocal = (
    movie: IMovie | ITrendingMovie | IRecommendedMovie
): boolean => {
    if ('_id' in movie && movie._id) return true;
    if ('isLocal' in movie) return movie.isLocal;
    return false;
};

/**
 * Get correct ID for navigation
 */
export const getMovieIdentifier = (
    movie: IMovie | ITrendingMovie | IRecommendedMovie
): string => {
    if ('_id' in movie && movie._id) return movie._id;
    if ('tmdbId' in movie && movie.tmdbId) return movie.tmdbId.toString();
    if ('imdbId' in movie) return movie.imdbId;
    throw new Error('No valid identifier');
};

/**
 * Format runtime: 142 → "2h 22m"
 */
export const formatRuntime = (minutes?: number): string => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};
