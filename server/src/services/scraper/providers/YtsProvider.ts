import { IScrapedMovie } from '../../../interfaces/movie.interface';
import { BaseProvider } from './BaseProvider';
import { env } from '../../../config/env';
import { logger } from '../../../utils/logger';
import { IPaginationOptions, MovieFilterOptions } from '../../../core/interfaces/IPagination';

type YtsMovie = {
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
};

type YtsListResponse = {
  status: string;
  status_message: string;
  data: {
    movie_count: number;
    limit: number;
    page_number: number;
    movies?: YtsMovie[];
  };
};

export class YtsProvider extends BaseProvider {
  constructor() {
    super('YTS', env.YTS_BASE_API_URL);
  }

  async scrape(page: number): Promise<IScrapedMovie[]> {
    try {
      const { data } = await this.api.get<YtsListResponse>('/list_movies.json', {
        params: { page, limit: 50 },
      });

      const movies = data.data.movies || [];

      return movies.map((m: YtsMovie) => this.normalize(m));
    } catch (error) {
      logger.error(`[YTS] Error scraping page ${page}: ${(error as Error).message}`);
      return [];
    }
  }

  async search(
    filters: Partial<IPaginationOptions & MovieFilterOptions>,
  ): Promise<IScrapedMovie[]> {
    try {
      const params = {
        page: filters.page || 1,
        limit: 25,
        sort_by: filters.sortBy || 'download_count',
        sort_order: filters.sortOrder || 'desc',
        genre: filters.genre,
        minimum_rating: filters.minRating,
        year: filters.year,
        query_term: filters.search || '',
      };

      const { data } = await this.api.get<YtsListResponse>(`/list_movies.json`, {
        params,
      });

      // log the above params
      logger.info(
        `[YTS] Search params: ${JSON.stringify({
          page: filters.page || 1,
          limit: filters.limit || 20,
          sort_by: filters.sortBy || 'download_count',
          sort_order: filters.sortOrder || 'desc',
          genre: filters.genre,
          minimum_rating: filters.minRating,
          year: filters.year,
        })}`,
      );

      const movies = data.data.movies || [];

      return movies.map((m: YtsMovie) => this.normalize(m));
    } catch (error) {
      logger.error(
        `[YTS] Error searching for "${filters.search || ''}": ${(error as Error).message}`,
      );
      return [];
    }
  }

  private normalize(m: YtsMovie): IScrapedMovie {
    return {
      imdbId: m.imdb_code,
      title: m.title,
      year: m.year,
      slug: m.slug,

      torrents: (m.torrents ?? []).map((t) => ({
        url: t.url,
        hash: t.hash,
        quality: t.quality,
        type: t.type,
        videoCodec: t.video_codec,
        seeds: t.seeds,
        peers: t.peers,
        size: t.size,
        sizeBytes: t.size_bytes,
        provider: 'YTS',
      })),
    };
  }
}
