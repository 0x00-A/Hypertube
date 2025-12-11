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
  // tmdbId: string;
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
