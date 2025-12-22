export interface ICastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
  order: number;
}

export interface IMovieDetails extends IMovie {
  cast?: ICastMember[];
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
  images: {
    thumbnail?: string;
    poster?: string;
    backdrop?: string;
  };
  isWatched?: boolean;
  inWatchlist?: boolean;
  userRating?: number | null;
}

export interface ITrendingMovie {
  tmdbId: number;
  title: string;
  year: number;
  rating: string;
  originalLanguage: string;
  overview?: string;
  genres?: string[];
  images: {
    thumbnail: string;
    backdrop?: string;
  };
  isLocal: boolean;
  isWatched?: boolean;
  inWatchlist?: boolean;
  userRating?: number | null;
}

export interface IRecommendedMovie {
  tmdbId: number;
  title: string;
  year: number;
  rating: string;
  originalLanguage: string;
  overview?: string;
  genres?: string[];
  images: {
    thumbnail: string;
    backdrop?: string;
  };
  isLocal: boolean;
  isWatched?: boolean;
  inWatchlist?: boolean;
  userRating?: number | null;
}

export interface IMoviesResponse {
  data: IMovie[];
  pagination: IPagination;
}

export interface ITrendingMoviesResponse {
  data: ITrendingMovie[];
  pagination: IPagination;
}

export interface IRecommendedMoviesResponse {
  data: IRecommendedMovie[];
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


export type MovieCardProps = {
  movie: IMovie | ITrendingMovie | IRecommendedMovie;
  onMovieClick?: (movie: IMovie | ITrendingMovie | IRecommendedMovie) => void;
  onWatchlistToggle?: (movie: IMovie | ITrendingMovie | IRecommendedMovie) => void;
  className?: string;
};

export type HeroSliderProps = {
  movies: ITrendingMovie[];
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

