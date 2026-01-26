import axios from 'axios';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export interface TmdbMovie {
  adult: boolean;
  backdrop_path: string;
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string;
  media_type: string;
  original_language: string;
  genre_ids: number[];
  popularity: number;
  release_date: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

export interface TmdbFindApiResponse {
  movie_results: TmdbMovie[];
  person_results: unknown[];
  tv_results: unknown[];
  tv_episode_results: unknown[];
  tv_season_results: unknown[];
}

const TMDB_KEY = env.TMDB_API_ACCESS_TOKEN;
const TMDB_BASE = env.TMDB_BASE_API_URL;
const IMAGE_BASE = env.TMDB_IMAGE_BASE_URL;

/**
 * Fetches movie metadata from TMDB API using an IMDb ID
 * @param imdbId - The IMDb ID of the movie (e.g., "tt1234567")
 * @returns Movie metadata object with title, year, images, etc., or null if not found
 */
export async function getMetadata(imdbId: string) {
  if (!imdbId || !/^tt\d+$/.test(imdbId)) {
    logger.warn({ imdbId }, 'Invalid ID');
    return null;
  }

  // find is better than search because it guarantees the exact match
  const url = `${TMDB_BASE}/find/${imdbId}?external_source=imdb_id`;
  const { data } = await axios.get<TmdbFindApiResponse>(url, {
    headers: {
      Authorization: `Bearer ${TMDB_KEY}`,
    },
  });
  const tmdbMovie: TmdbMovie | undefined = data.movie_results[0];
  if (!tmdbMovie) {
    logger.warn(`TMDB metadata not found for ${imdbId}.`);
    logger.debug({ data }, 'TMDB full response');
    return null;
  }

  // fetch Details, Trailer, and Cast
  const detailUrl = `${TMDB_BASE}/movie/${tmdbMovie.id}?append_to_response=videos,credits`;
  const detailRes = await axios.get(detailUrl, {
    headers: {
      Authorization: `Bearer ${TMDB_KEY}`,
    },
  });
  const details = detailRes.data;

  // helpers for null/invalid fields
  const parseDuration = (runtime: unknown): number | null => {
    if (typeof runtime !== 'number' || isNaN(runtime) || runtime <= 0) return null;
    return runtime;
  };
  const parseRating = (vote_average: unknown): number | null => {
    if (typeof vote_average !== 'number' || isNaN(vote_average) || vote_average < 0) return null;
    return vote_average;
  };
  const parseYear = (release_date: unknown): number => {
    if (typeof release_date === 'string' && release_date.match(/^\d{4}/)) {
      const year = parseInt(release_date.split('-')[0], 10);
      return isNaN(year) ? 0 : year;
    }
    return 0;
  };
  const parseString = (val: unknown): string => (typeof val === 'string' ? val : '');
  const parseGenres = (genres: unknown): string[] => {
    if (Array.isArray(genres)) {
      return genres
        .map((g) => (typeof g === 'object' && g && 'name' in g ? String((g as any).name) : null))
        .filter((g): g is string => !!g);
    }
    return [];
  };
  const parseImages = (poster_path: unknown, backdrop_path: unknown) => ({
    poster:
      typeof poster_path === 'string' && poster_path ? `${IMAGE_BASE}/w500${poster_path}` : '',
    backdrop:
      typeof backdrop_path === 'string' && backdrop_path
        ? `${IMAGE_BASE}/original${backdrop_path}`
        : '',
    thumbnail:
      typeof poster_path === 'string' && poster_path ? `${IMAGE_BASE}/w200${poster_path}` : '',
  });
  const parseCast = (credits: unknown) => {
    if (
      typeof credits === 'object' &&
      credits &&
      'cast' in credits &&
      Array.isArray((credits as any).cast)
    ) {
      return (credits as any).cast
        .slice(0, 18)
        .map((actor: { id?: number; name?: string; character?: string; profile_path?: string }) => ({
          id: typeof actor.id === 'number' ? actor.id : 0,
          name: typeof actor.name === 'string' ? actor.name : '',
          character: typeof actor.character === 'string' ? actor.character : '',
          profilePath:
            typeof actor.profile_path === 'string' && actor.profile_path
              ? `${IMAGE_BASE}/w185${actor.profile_path}`
              : undefined,
        }))
        .filter((actor: { name: string; character: string }) => actor.name && actor.character);
    }
    return [];
  };

  // Parse director from crew (job === 'Director')
  const parseDirector = (credits: unknown): { id: number; name: string; profilePath?: string } | null => {
    if (
      typeof credits === 'object' &&
      credits &&
      'crew' in credits &&
      Array.isArray((credits as { crew?: unknown[] }).crew)
    ) {
      const director = (credits as { crew: Array<{ id?: number; name?: string; job?: string; profile_path?: string }> }).crew.find(
        (member) => member.job === 'Director'
      );
      if (director) {
        return {
          id: typeof director.id === 'number' ? director.id : 0,
          name: typeof director.name === 'string' ? director.name : '',
          profilePath:
            typeof director.profile_path === 'string' && director.profile_path
              ? `${IMAGE_BASE}/w185${director.profile_path}`
              : undefined,
        };
      }
    }
    return null;
  };

  // Parse first producer with known_for_department === 'Production'
  const parseProducer = (credits: unknown): { id: number; name: string; profilePath?: string } | null => {
    if (
      typeof credits === 'object' &&
      credits &&
      'crew' in credits &&
      Array.isArray((credits as { crew?: unknown[] }).crew)
    ) {
      const producer = (credits as { crew: Array<{ id?: number; name?: string; job?: string; known_for_department?: string; profile_path?: string }> }).crew.find(
        (member) => member.job === 'Producer' && member.known_for_department === 'Production'
      );
      if (producer) {
        return {
          id: typeof producer.id === 'number' ? producer.id : 0,
          name: typeof producer.name === 'string' ? producer.name : '',
          profilePath:
            typeof producer.profile_path === 'string' && producer.profile_path
              ? `${IMAGE_BASE}/w185${producer.profile_path}`
              : undefined,
        };
      }
    }
    return null;
  };

  // Parse production companies
  const parseProductionCompanies = (companies: unknown): Array<{ id: number; name: string; logoPath?: string; originCountry?: string }> => {
    if (Array.isArray(companies)) {
      return companies
        .map((company: { id?: number; name?: string; logo_path?: string; origin_country?: string }) => ({
          id: typeof company.id === 'number' ? company.id : 0,
          name: typeof company.name === 'string' ? company.name : '',
          logoPath:
            typeof company.logo_path === 'string' && company.logo_path
              ? `${IMAGE_BASE}/w200${company.logo_path}`
              : undefined,
          originCountry: typeof company.origin_country === 'string' ? company.origin_country : undefined,
        }))
        .filter((company) => company.name);
    }
    return [];
  };
  const youtubeTrailer =
    details.videos && details.videos.results && Array.isArray(details.videos.results)
      ? details.videos.results.find(
          (v: { site?: string; type?: string }) =>
            v && v.site === 'YouTube' && v.type === 'Trailer',
        )
      : undefined;
  const trailerUrl =
    youtubeTrailer && youtubeTrailer.key
      ? `https://www.youtube.com/watch?v=${youtubeTrailer.key}`
      : '';

  return {
    title: parseString(details.title),
    tmdbId: details.id,
    year: parseYear(details.release_date),
    synopsis: parseString(details.overview),
    duration: parseDuration(details.runtime),
    rating: parseRating(details.vote_average),
    genres: parseGenres(details.genres),
    originalLanguage: parseString(details.original_language) || 'en',
    images: parseImages(details.poster_path, details.backdrop_path),
    trailer: trailerUrl,
    cast: parseCast(details.credits),
    director: parseDirector(details.credits),
    producer: parseProducer(details.credits),
    productionCompanies: parseProductionCompanies(details.production_companies),
  };
}

/**
 * Given a TMDB movie ID, fetches the corresponding IMDb ID using TMDB API.
 * @param tmdbId - The TMDB movie ID (number or string)
 * @returns The IMDb ID as a string, or null if not found
 */
export async function getImdbIdFromTmdbId(tmdbId: string | number): Promise<string | null> {
  try {
    const { data } = await axios.get(`${TMDB_BASE}/movie/${tmdbId}/external_ids`, {
      headers: { Authorization: `Bearer ${TMDB_KEY}` },
    });
    return data.imdb_id || null;
  } catch (error) {
    logger.warn({ tmdbId, error }, 'Failed to fetch IMDb ID from TMDB');
    return null;
  }
}
