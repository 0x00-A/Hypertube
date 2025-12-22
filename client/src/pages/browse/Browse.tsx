import { useNavigate } from 'react-router-dom';
import { HeroSection, MovieCarousel, LastWatchingCarousel, GenresSection } from '../../components/movie';
import { lastWatchingMovies } from '../../data/mockMovies';
import type { IMovie, ITrendingMovie, IRecommendedMovie } from '../../types/movie.types';
import { useMovies } from '../../hooks/useMovies';
import { useFetchGenreMovies } from '../../hooks/useMovies';
import { useAuthState } from '../../hooks/useAuth';

export default function Browse() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthState();

  // Fetch movies
  const { trending, recommended } = useMovies();
  const genreData = useFetchGenreMovies();

  // Get first 6 trending movies for hero slider
  const heroMovies = trending.trending.slice(0, 6);
  const handlePlayClick = (movie: IMovie) => {
    navigate(`/watch/${movie.imdbId}`);
  };

  const handleViewAllLastWatching = () => {
    navigate('/history');
  };

  const handleMovieClick = (movie: IMovie | ITrendingMovie | IRecommendedMovie) => {
    // Use tmdbId for trending/recommended movies, imdbId for full movies
    const id = 'imdbId' in movie ? movie.imdbId : movie.tmdbId;
    navigate(`/movies/${id}`);
  };

  const handleWatchlistToggle = () => {
    // Watchlist toggle functionality will be implemented
  };

  const handleViewAllRecommended = () => {
    navigate('/library?filter=recommended');
  };

  const handleViewAllTrending = () => {
    navigate('/library?filter=trending');
  };

  const handleViewAllGenres = () => {
    // Navigate to all-movies with the selected genre pre-applied
    navigate(`/movies?genre=${genreData.selectedGenre}`);
  };

  const handleGenreChange = (genre: string) => {
    genreData.changeGenre(genre);
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <HeroSection
          heroMovies={heroMovies.length > 0 ? heroMovies : []}
          lastWatchingList={isAuthenticated ? lastWatchingMovies : []}
          onPlayClick={handlePlayClick}
          onViewAllLastWatching={handleViewAllLastWatching}
        />

        {isAuthenticated && (
          <div className="mt-8 lg:mt-12 lg:hidden">
            <LastWatchingCarousel
              title="Continue Watching"
              progressList={lastWatchingMovies}
              onPlayClick={handlePlayClick}
              onViewAll={handleViewAllLastWatching}
            />
          </div>
        )}

        {isAuthenticated && (
          <div className="mt-8 lg:mt-12">
            <MovieCarousel
              title="Recommended for You"
              movies={recommended.recommended}
              onMovieClick={handleMovieClick}
              onWatchlistToggle={handleWatchlistToggle}
              onViewAll={handleViewAllRecommended}
              isLoading={recommended.isLoading}
            />
          </div>
        )}

        <div className="mt-8 lg:mt-12">
          <MovieCarousel
            title="Trending Movies"
            movies={trending.trending}
            onMovieClick={handleMovieClick}
            onWatchlistToggle={handleWatchlistToggle}
            onViewAll={handleViewAllTrending}
            isLoading={trending.isLoading}
          />
        </div>

        <div className="mt-8 lg:mt-12">
          <GenresSection
            movies={genreData.movies}
            selectedGenre={genreData.selectedGenre}
            onGenreChange={handleGenreChange}
            onMovieClick={handleMovieClick}
            onWatchlistToggle={handleWatchlistToggle}
            onViewAll={handleViewAllGenres}
            isLoading={genreData.isLoading}
          />
        </div>
      </div>
    </div>
  );
}


