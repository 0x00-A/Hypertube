export interface ITmdbTrendingMovie {
  adult: boolean;
  backdrop_path: string | null;
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  media_type: string;
  original_language: string;
  genre_ids: number[];
  popularity: number;
  release_date: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

export interface ITmdbTrendingResponse {
  page: number;
  results: ITmdbTrendingMovie[];
  total_results: number;
  total_pages: number;
}

export interface ITmdbListMovie {
  tmdbId: number;
  title: string;
  year: number;
  rating: string;
  originalLanguage: string;
  overview: string;
  genres: string[];
  images: {
    thumbnail: string;
    backdrop: string;
  };
  isLocal: boolean;
  isWatched?: boolean;
  inWatchlist?: boolean;
  userRating?: number | null;
  /**
   * Numeric rank for curated top-ranked movies seeded from `scripts/movies.csv`.
   * This represents the position in the curated list. `null` when not part of the list.
   */
  topRank?: number | null;
}

export interface ITorrent {
  url: string;
  hash: string;
  quality: string;
  type?: string; // "mp4", "mkv"
  videoCodec?: string;
  seeds: number;
  peers: number;
  size: string;
  sizeBytes: number;
  provider?: string;
}

export interface ICast {
  id: number;
  name: string;
  character: string;
  profilePath?: string;
}

export interface IMovie {
  imdbId: string;
  tmdbId: number;
  title: string;
  year: number;
  rating?: number | null | undefined;
  duration?: number | null | undefined;
  synopsis?: string;
  genres?: string[];
  originalLanguage?: string;
  trailer?: string;
  cast?: ICast[];
  images: {
    thumbnail: string;
    poster: string;
    backdrop: string;
  };
  torrents: ITorrent[];
  downloadStatus: 'not_downloaded' | 'downloading' | 'downloaded';
  lastWatched?: Date;
  localPath?: string;
  lastUpdated: Date;
  metadataSource?: string;
  isWatched?: boolean;
  inWatchlist?: boolean;
  userRating?: number | null;
  topRank?: number | null;
}

export interface IScrapedMovie {
  imdbId: string; // UNIQUE KEY
  title: string;
  year: number;
  slug: string;
  rating: number;
  torrents: ITorrent[]; // Array of torrents from this specific source
  trailer?: string;
  images?: {
    thumbnail: string;
    poster: string;
    backdrop: string;
  };
}

export interface ICreateMovieDTO {
  imdbId: string;
  title: string;
  year: number;
  rating?: number;
  duration?: number;
  summary?: string;
  coverImage?: string;
  backgroundImage?: string;
  torrents?: ITorrent[];
}

export interface IUpdateMovieDTO extends Partial<ICreateMovieDTO> {}

export interface IMovieState {
  isWatched: boolean;
  inWatchlist: boolean;
  userRating: number | null;
}
