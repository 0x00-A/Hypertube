import axios from 'axios';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export interface OmdbRating {
  Source: string;
  Value: string;
}

export interface OmdbApiResponse {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: OmdbRating[];
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD: string;
  BoxOffice: string;
  Production: string;
  Website: string;
  Response: string;
}

const OMDB_KEY = env.OMDB_API_KEY;
const OMDB_BASE = 'http://www.omdbapi.com/';

/**
 * Fetches movie metadata from OMDb API using an IMDb ID
 * @param imdbId - The IMDb ID of the movie (e.g., "tt1234567")
 * @returns Movie metadata object with title, year, images, etc., or null if not found
 */
export async function getOmdbMetadata(imdbId: string) {
  if (!imdbId || !/^tt\d+$/.test(imdbId)) {
    logger.warn({ imdbId }, 'Invalid ID');
    return null;
  }

  const url = `${OMDB_BASE}?i=${imdbId}&apikey=${OMDB_KEY}`;
  try {
    const { data } = await axios.get<OmdbApiResponse>(url);
    if (data.Response !== 'True') {
      logger.warn(`OMDb metadata not found for ${imdbId}.`);
      logger.warn({ data }, 'OMDb response');
      return null;
    }

    logger.debug({ data }, 'OMDb full response');

    // Helper to check if value is N/A or invalid
    const isValidValue = (val: string) => val && val !== 'N/A';

    const parseRating = (rating: string): number | null => {
      if (!isValidValue(rating)) return null;
      const parsed = parseFloat(rating);
      return isNaN(parsed) ? null : parsed;
    };

    const parseDuration = (runtime: string): number | null => {
      if (!isValidValue(runtime)) return null;
      const parsed = parseInt(runtime, 10);
      return isNaN(parsed) || parsed === 0 ? null : parsed;
    };

    const parseYear = (year: string): number => {
      if (!isValidValue(year)) return 0;
      const parsed = parseInt(year, 10);
      return isNaN(parsed) ? 0 : parsed;
    };

    // same structure as TMDB for consistency
    return {
      title: isValidValue(data.Title) ? data.Title : '',
      tmdbId: null,
      year: parseYear(data.Year),
      synopsis: isValidValue(data.Plot) ? data.Plot : '',
      duration: parseDuration(data.Runtime),
      rating: parseRating(data.imdbRating),
      genres: isValidValue(data.Genre) ? data.Genre.split(',').map((g: string) => g.trim()) : [],
      originalLanguage: isValidValue(data.Language) ? data.Language.split(',')[0].trim() : 'en',
      images: {
        poster: isValidValue(data.Poster) ? data.Poster : '',
        backdrop: '', // OMDb does not provide backdrop
        thumbnail: isValidValue(data.Poster) ? data.Poster : '',
      },
      trailer: '', // OMDb does not provide trailer links
      metadataSource: 'omdb',
    };
  } catch (error) {
    logger.warn({ imdbId, error }, 'OMDb metadata fetch failed');
    return null;
  }
}
