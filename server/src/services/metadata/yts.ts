import axios from 'axios';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export interface YtsMovie {
  id: number;
  imdb_code: string;
  title: string;
  year: number;
  rating: number;
  runtime: number;
  genres?: string[];
  summary?: string;
  synopsis?: string;
  slug: string;
  language?: string;
  background_image?: string;
  background_image_original?: string;
  small_cover_image?: string;
  medium_cover_image?: string;
  large_cover_image?: string;
  torrents?: Array<{
    url: string;
    hash: string;
    quality: string;
    type: string;
    is_repack: string;
    video_codec: string;
    bit_depth: string;
    audio_channels: string;
    seeds: number;
    peers: number;
    size: string;
    size_bytes: number;
    date_uploaded: string;
    date_uploaded_unix: number;
  }>;
}

export interface YtsMovieDetail extends YtsMovie {
  url: string;
  title_english: string;
  title_long: string;
  like_count?: number;
  description_intro?: string;
  description_full?: string;
  yt_trailer_code?: string;
  mpa_rating?: string;
  medium_screenshot_image1?: string;
  medium_screenshot_image2?: string;
  medium_screenshot_image3?: string;
  large_screenshot_image1?: string;
  large_screenshot_image2?: string;
  large_screenshot_image3?: string;
  cast?: Array<{
    name: string;
    character_name: string;
    url_small_image: string;
    imdb_code: string;
  }>;
  date_uploaded?: string;
  date_uploaded_unix?: number;
}

/**
 * Fetches full YTS movie details by IMDb ID.
 * @param imdbId - The IMDb ID of the movie
 * @returns YtsMovieDetail or null if not found
 */
export async function getYtsMovieDetailsByImdbId(imdbId: string): Promise<YtsMovieDetail | null> {
  try {
    const baseUrl = env.YTS_BASE_API_URL;
    const { data } = await axios.get(`${baseUrl}/movie_details.json`, {
      params: { imdb_id: imdbId, with_images: true, with_cast: true },
    });
    if (data.status === 'ok' && data.data && data.data.movie) {
      return data.data.movie as YtsMovieDetail;
    }
    return null;
  } catch (error) {
    logger.warn({ imdbId, error }, 'Failed to fetch YTS movie details');
    return null;
  }
}
