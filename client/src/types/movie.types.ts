export interface IMovie {
  _id?: string;
  imdbId: string;
  title: string;
  year: number;
  rating?: number;
  duration?: number;
  synopsis?: string;
  genres?: string[];
  language?: string;
  trailer?: string;
  images: {
    thumbnail?: string;
    poster?: string;
    backdrop?: string;
  };
}

export interface IMoviesResponse {
  data: IMovie[];
  pagination: IPagination;
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
  movie: IMovie;
  onMovieClick?: (movie: IMovie) => void;
  onWatchlistToggle?: (movie: IMovie) => void;
  isInWatchlist?: boolean;
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

