import { useNavigate } from 'react-router-dom';
import { HeroSection, MovieCarousel, LastWatchingCarousel, GenresSection } from '../../components/movie';
import { lastWatchingMovies } from '../../data/mockMovies';
import type { IMovie } from '../../types/movie.types';
import { useMovies } from '../../hooks/useMovies';
import { useFetchGenreMovies } from '../../hooks/useMovies';
import { useAuthState } from '../../hooks/useAuth';

export default function Browse() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthState();

  // Fetch movies
  const { trending, recommended, slider } = useMovies();
  const genreData = useFetchGenreMovies();

  const handlePlayClick = (movie: IMovie) => {
    navigate(`/watch/${movie.imdbId}`);
  };

  const handleViewAllLastWatching = () => {
    navigate('/history');
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
      {/* Hero Section - Full Width */}
      <HeroSection
        sliderMovies={slider.movies}
      />

      {/* Content Sections - Constrained */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isAuthenticated && (
          <div className="mt-8 lg:mt-12">
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
              onViewAll={handleViewAllRecommended}
              isLoading={recommended.isLoading}
            />
          </div>
        )}

        <div className="mt-8 lg:mt-12">
          <MovieCarousel
            title="Trending Movies"
            movies={trending.trending}
            onViewAll={handleViewAllTrending}
            isLoading={trending.isLoading}
          />
        </div>

        <div className="mt-8 lg:mt-12">
          <GenresSection
            movies={genreData.movies}
            selectedGenre={genreData.selectedGenre}
            onGenreChange={handleGenreChange}
            onViewAll={handleViewAllGenres}
            isLoading={genreData.isLoading}
          />
        </div>
      </div>
    </div>
  );
}


