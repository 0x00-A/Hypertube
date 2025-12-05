export interface ITorrent {
  url: string;
  hash: string;
  quality: string;
  type: string; // "mp4", "mkv" (if available)
  seeds: number;
  peers: number;
  size: string;
  sizeBytes: number;
  provider: string;
}
export interface IMovie {
  id: string;
  imdbId: string;
  title: string;
  year: number;
  rating?: number;
  duration?: number;
  synopsis?: string;
  genres?: string[];
  language?: string;
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
  synopsis: string;
  duration: number;
  rating: number;
  genres: string[];
  language: string;

  images: {
    thumbnail: string;
    poster: string;
    backdrop: string;
  };

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
