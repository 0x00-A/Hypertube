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

// TMDB Trending Response (paginated)
export interface ITmdbTrendingResponse {
  page: number;
  results: ITmdbTrendingMovie[];
  total_results: number;
  total_pages: number;
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
export interface IMovie {
  imdbId: string;
  tmdbId: number | null;
  title: string;
  year: number;
  rating?: number | null | undefined;
  duration?: number | null | undefined;
  synopsis?: string;
  genres?: string[];
  originalLanguage?: string;
  trailer?: string;
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
}

export interface IScrapedMovie {
  imdbId: string; // UNIQUE KEY
  title: string;
  year: number;
  slug: string;
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
