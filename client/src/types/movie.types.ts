export interface IResponse<T> {
  data: T;
  message?: string;
}

export interface ICastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
  order: number;
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

export interface ITorrent {
  url: string;
  hash: string;
  quality: string;
  type?: string;
  videoCodec?: string;
  seeds: number;
  peers: number;
  size: string;
  sizeBytes: number;
  provider?: string;
}

export interface IQualityOption {
  quality: string;
  seeds: number;
  peers: number;
  size: string;
  sizeBytes: number;
  downloadStatus: string;
}

export interface ISubtitleTrack {
  language: string;
  label: string;
  url: string;
  forQuality?: string;
}

export interface IStreamStatus {
  downloadStatus: "not_downloaded" | "downloading" | "downloaded";
  hasActiveEngine: boolean;
  needsTranscoding?: boolean;
  runtimeSeconds?: number | null;
  subtitles: Record<string, ISubtitleTrack[]>;
  availableQualities?: IQualityOption[];
}

export interface IAvailableSubtitles {
  english?: ISubtitleTrack[];
  userLanguage?: ISubtitleTrack[];
  userLanguageCode?: string;
}

export interface IMovieDetails extends IMovie {
  cast?: ICastMember[];
  director?: ICrewMember | null;
  producer?: ICrewMember | null;
  productionCompanies?: IProductionCompany[];
  torrents?: ITorrent[];
  subtitles?: Record<string, ISubtitleTrack[]>;
}

export interface IMovie {
  _id?: string;
  imdbId: string;
  tmdbId?: number | null;
  title: string;
  year: number;
  rating?: number;
  duration?: number;
  synopsis?: string;
  overview?: string;
  genres?: string[];
  originalLanguage?: string;
  trailer?: string;
  trending?: boolean;
  images: {
    thumbnail?: string;
    poster?: string;
    backdrop?: string;
  };
  isWatched?: boolean;
  inWatchlist?: boolean;
  userRating?: number | null;
  topRank?: number | null;
}

export interface IMoviesResponse {
  data: IMovie[];
  pagination: IPagination;
}

export interface IMovieDetailsResponse {
  data: IMovieDetails;
  message?: string;
}

export interface IPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface IWatchProgress {
  movie: IMovie;
  watchedDuration: number;
  totalDuration: number;
  percentage: number;
  lastWatchedAt: Date | string;
}

export interface IMovieInteraction {
  _id?: string;
  userId: string;
  movieId: string;
  interactionType: "watched" | "rated" | "watchlist" | "downloaded";
  lastWatchedPosition?: number;
  duration?: number;
  watchProgress?: number;
  isCompleted?: boolean;
  rating?: number;
  watchedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type MovieCardProps = {
  movie: IMovie;
  className?: string;
};

export type ArchiveMovieCardProps = {
  movie: IMovie;
  rank: number;
  className?: string;
};

export type HeroSliderProps = {
  movies: IMovie[];
  autoPlayInterval?: number;
  className?: string;
};

export type LastWatchingCardProps = {
  progress: IWatchProgress;
  onPlayClick?: (movie: IMovie) => void;
  className?: string;
};

export type MovieListProps = {
  title: string;
  movies: IMovie[];
  onMovieClick?: (movie: IMovie) => void;
  onViewAll?: () => void;
  className?: string;
};
