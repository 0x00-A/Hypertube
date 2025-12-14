import { useNavigate } from 'react-router-dom';
import { HeroSection, MovieCarousel, LastWatchingCarousel } from '../../components/movie';
import { heroMovies, lastWatchingMovies, recommendedMovies, trendingMovies } from '../../data/mockMovies';
import type { IMovie } from '../../types/movie.types';

export default function Browse() {
  const navigate = useNavigate();

  const handlePlayClick = (movie: IMovie) => {
    navigate(`/watch/${movie.imdbId}`);
  };

  const handleViewAllLastWatching = () => {
    navigate('/history');
  };

  const handleMovieClick = (movie: IMovie) => {
    navigate(`/movie/${movie.imdbId}`);
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

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <HeroSection
          heroMovies={heroMovies}
          lastWatchingList={lastWatchingMovies}
          onPlayClick={handlePlayClick}
          onViewAllLastWatching={handleViewAllLastWatching}
        />

        <div className="mt-8 lg:mt-12 lg:hidden">
          <LastWatchingCarousel
            title="Continue Watching"
            progressList={lastWatchingMovies}
            onPlayClick={handlePlayClick}
            onViewAll={handleViewAllLastWatching}
          />
        </div>

        <div className="mt-8 lg:mt-12">
          <MovieCarousel
            title="Recommended for You"
            movies={recommendedMovies}
            onMovieClick={handleMovieClick}
            onWatchlistToggle={handleWatchlistToggle}
            onViewAll={handleViewAllRecommended}
          />
        </div>

        <div className="mt-8 lg:mt-12">
          <MovieCarousel
            title="Trending Movies"
            movies={trendingMovies}
            onMovieClick={handleMovieClick}
            onWatchlistToggle={handleWatchlistToggle}
            onViewAll={handleViewAllTrending}
          />
        </div>
      </div>
    </div>
  );
}
