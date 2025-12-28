import type { IMovie } from '../types/movie.types';

/**
 * Determine if movie is stored locally
 */
export const determineIsTmdbMovie = (
    movie: IMovie
): boolean => {
    if ('_id' in movie && movie._id) return false;
    if ('tmdbId' in movie && movie.tmdbId) return true;
    return false;
};

/**
 * Get correct ID for navigation
 */
export const getMovieIdentifier = (
    movie: IMovie
): string => {
    if ('_id' in movie && movie._id) return movie._id;
    if ('tmdbId' in movie && movie.tmdbId) return movie.tmdbId.toString();
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
