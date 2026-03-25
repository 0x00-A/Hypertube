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

export interface ICrewMember {
  id: number;
  name: string;
  profilePath?: string;
}

export interface IProductionCompany {
  id: number;
  name: string;
  logoPath?: string;
  originCountry?: string;
}

export interface ISubtitle {
  id?: string; // internal DB id or provider subtitle id
  fileId?: number; // OpenSubtitles file_id
  fileName?: string; // original filename from provider (e.g., "Inception.2010.BluRay.720p.x264.YIFY")
  language: string; // 'en', 'fr', etc.
  label: string; // 'English', 'French'
  forHash: string; // torrent hash this subtitle is linked to
  forQuality: string; // torrent quality this subtitle is linked to (e.g., '720p', '1080p')
  url?: string; // backend URL to the .vtt file (after conversion/storage)
  localPath?: string; // filesystem path if stored locally
  provider?: string; // 'opensubtitles' | 'user'
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDownloadInfo {
  status: 'not_downloaded' | 'downloading' | 'downloaded';
  localPath?: string;
}

export interface IQualityOption {
  quality: string;
  seeds: number;
  peers: number;
  size: string;
  sizeBytes: number;
  downloadStatus: string;
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
  director?: ICrewMember | null;
  producer?: ICrewMember | null;
  productionCompanies?: IProductionCompany[];
  images: {
    thumbnail: string;
    poster: string;
    backdrop: string;
  };
  torrents: ITorrent[];
  downloadStatus: 'not_downloaded' | 'downloading' | 'downloaded';
  lastWatched?: Date;
  localPath?: string;
  downloads?: Map<string, IDownloadInfo>;
  lastUpdated: Date;
  metadataSource?: string;
  isWatched?: boolean;
  inWatchlist?: boolean;
  userRating?: number | null;
  topRank?: number | null;
  subtitles?: Map<string, ISubtitle[]>; // keyed by language: { 'en': [...], 'es': [...] }
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
