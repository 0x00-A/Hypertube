import {
  useCuratedMovies,
} from "../../hooks/useCuratedMovies";
// import { useGenres } from "../../hooks/useGenres";
import Loader from "../../components/common/Loader";
import ErrorMessage from "../../components/common/ErrorMessage";
// import CuratedFilterBar from "../../components/movie/CuratedFilterBar";
import type { IMovie } from "../../types/movie.types";
import { useNavigate } from "react-router-dom";
import { Play, Info, Star } from "lucide-react";
import { clsx } from "clsx";
import { useState, useEffect, useRef } from "react";

export default function Featured() {
  const { movies, isLoading, error, hasNextPage, loadMore } =
    useCuratedMovies();
  // const { data: genres = [] } = useGenres();
  const navigate = useNavigate();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite scroll implementation
  useEffect(() => {
    if (!loadMoreRef.current || isLoading || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isLoading, hasNextPage, loadMore]);

  // Show loader only on initial load
  if (isLoading && movies.length === 0) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error && movies.length === 0) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <ErrorMessage message="Failed to load curated movies" />
      </div>
    );
  }

  // Slice movies according to the layout strategy
  // Note: Only slice for display sections when we have the full curated list (no filters)
  // When filters are applied, show all results in The Collection
  const heroMovie = movies[0]; // Rank 1
  const spotlightMovies = movies.slice(1, 5); // Ranks 2-5 (4 movies)
  const editorialMovies = movies.slice(5, 19); // Ranks 6-19
  const archiveMovies = movies; // Show all movies in The Collection (includes filtered results)

  const handleMovieClick = (movie: IMovie) => {
    const isTmdbMovie = movie.tmdbId != null;
    const id = isTmdbMovie ? movie.tmdbId : movie.imdbId;
    navigate(`/movies/${id}`, { state: { isTmdbMovie } });
  };

  // const handleFilterChange = (filters: ICuratedFilters) => {
  //   refetch(filters);
  // };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Hero Section - Rank 1 */}
      {heroMovie && (
        <HeroSection movie={heroMovie} onMovieClick={handleMovieClick} />
      )}

      {/* Spotlight Section - Ranks 2-5 (Bento Box) */}
      {spotlightMovies.length > 0 && (
        <SpotlightSection
          movies={spotlightMovies}
          onMovieClick={handleMovieClick}
        />
      )}

      {/* Editorial Section - Ranks 6-19 (Horizontal Scroll) */}
      {editorialMovies.length > 0 && (
        <EditorialSection
          movies={editorialMovies}
          onMovieClick={handleMovieClick}
        />
      )}

      {/* Archive Section - The Collection (shows ALL movies, including ones above) */}
      <ArchiveSection
        movies={archiveMovies}
        onMovieClick={handleMovieClick}
        isLoadingMore={isLoading && movies.length > 0}
        // filterBar={
        //   <CuratedFilterBar
        //     genres={genres}
        //     onFilterChange={handleFilterChange}
        //     isLoading={isLoading}
        //   />
        // }
      />

      {/* Infinite scroll trigger */}
      {hasNextPage && !isLoading && movies.length > 0 && (
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          <div className="text-text-secondary text-sm">Loading more...</div>
        </div>
      )}

      {/* Loading indicator for infinite scroll */}
      {isLoading && movies.length > 0 && (
        <div className="py-12 flex justify-center">
          <Loader />
        </div>
      )}

      {/* End of results */}
      {!hasNextPage && movies.length > 0 && (
        <div className="text-center py-12 text-text-secondary text-sm">
          You've reached the end of our curated collection
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Hero Section Component (Rank 1)
// ============================================================================
interface HeroSectionProps {
  movie: IMovie;
  onMovieClick: (movie: IMovie) => void;
}

function HeroSection({ movie, onMovieClick }: HeroSectionProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const backdropUrl =
    movie.images.backdrop || movie.images.poster || movie.images.thumbnail;

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0">
        <img
          src={backdropUrl}
          alt={movie.title}
          className={clsx(
            "w-full h-full object-cover transition-opacity duration-1000",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setImageLoaded(true)}
        />
        {/* Multi-layer gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/80 via-transparent to-bg-primary/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-primary" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-end">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-32 w-full">
          <div className="max-w-3xl">
            {/* Top Rank Badge */}
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full">
              <Star className="w-4 h-4 text-primary fill-primary" />
              <span className="text-primary font-semibold text-sm tracking-wide uppercase">
                Editor's Choice
              </span>
            </div>

            {/* Title - Serif Font for Editorial Feel */}
            <h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 text-white leading-tight tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {movie.title}
            </h1>

            {/* Metadata */}
            <div className="flex items-center gap-4 mb-6 text-text-secondary">
              <div className="flex items-center gap-1.5">
                <Star className="w-5 h-5 text-primary fill-primary" />
                <span className="text-white font-bold text-lg">
                  {movie.rating?.toFixed(1)}
                </span>
              </div>
              <span className="w-1 h-1 rounded-full bg-text-muted" />
              <span className="font-medium">{movie.year}</span>
              {movie.duration && (
                <>
                  <span className="w-1 h-1 rounded-full bg-text-muted" />
                  <span className="font-medium">{movie.duration} min</span>
                </>
              )}
              {movie.genres && movie.genres.length > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-text-muted" />
                  <span className="font-medium">{movie.genres[0]}</span>
                </>
              )}
            </div>

            {/* Synopsis */}
            <p className="text-lg text-text-secondary leading-relaxed mb-8 max-w-2xl line-clamp-3">
              {movie.synopsis || movie.overview}
            </p>

            {/* CTA Buttons with Glassmorphism */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => onMovieClick(movie)}
                className="group relative px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:border-white/40"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center gap-3">
                  <Play className="w-5 h-5 text-white fill-white" />
                  <span className="text-white font-semibold text-lg">
                    Watch Now
                  </span>
                </div>
              </button>

              <button
                onClick={() => onMovieClick(movie)}
                className="px-8 py-4 bg-transparent border border-white/30 rounded-full transition-all duration-300 hover:bg-white/5 hover:border-white/50"
              >
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-white" />
                  <span className="text-white font-semibold text-lg">
                    More Info
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/60 animate-bounce">
        <span className="text-xs uppercase tracking-widest">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-white/60 to-transparent" />
      </div>
    </section>
  );
}

// ============================================================================
// Spotlight Section Component (Ranks 2-6) - Bento Box Layout
// ============================================================================
interface SpotlightSectionProps {
  movies: IMovie[];
  onMovieClick: (movie: IMovie) => void;
}

function SpotlightSection({ movies, onMovieClick }: SpotlightSectionProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      {/* Section Header */}
      <div className="mb-12">
        <h2
          className="text-4xl md:text-5xl font-bold text-white mb-3"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Editor's Top Picks
        </h2>
        <p className="text-text-secondary text-lg">
          Handpicked by our curators
        </p>
      </div>

      {/* Bento Box Grid - Masonry Layout (4 items) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px] md:auto-rows-[250px]">
        {movies.map((movie, index) => (
          <SpotlightCard
            key={movie.imdbId || movie.tmdbId}
            movie={movie}
            className={clsx(
              index === 0 && "col-span-2 row-span-2", // First item is larger
              index === 1 && "col-span-1 row-span-2",
              index === 2 && "col-span-1 row-span-1",
              index === 3 && "col-span-1 row-span-1"
            )}
            onClick={() => onMovieClick(movie)}
          />
        ))}
      </div>
    </section>
  );
}

interface SpotlightCardProps {
  movie: IMovie;
  className?: string;
  onClick: () => void;
}

function SpotlightCard({ movie, className, onClick }: SpotlightCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const posterUrl = movie.images.poster || movie.images.thumbnail;

  // Extract dominant color from image (simplified - using genre-based colors)
  const getGlowColor = () => {
    const genre = movie.genres?.[0]?.toLowerCase();
    if (genre?.includes("action")) return "rgba(239, 68, 68, 0.4)"; // Red
    if (genre?.includes("drama")) return "rgba(59, 130, 246, 0.4)"; // Blue
    if (genre?.includes("comedy")) return "rgba(245, 197, 24, 0.4)"; // Yellow
    if (genre?.includes("horror")) return "rgba(139, 92, 246, 0.4)"; // Purple
    if (genre?.includes("romance")) return "rgba(236, 72, 153, 0.4)"; // Pink
    return "rgba(245, 197, 24, 0.4)"; // Default yellow
  };

  return (
    <div
      className={clsx(
        "group relative overflow-hidden rounded-2xl cursor-pointer",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Glow effect behind card */}
      <div
        className={clsx(
          "absolute -inset-4 blur-3xl transition-opacity duration-500 -z-10",
          isHovered ? "opacity-100" : "opacity-0"
        )}
        style={{ backgroundColor: getGlowColor() }}
      />

      {/* Image */}
      <div className="relative w-full h-full overflow-hidden bg-border">
        <img
          src={posterUrl}
          alt={movie.title}
          className={clsx(
            "w-full h-full object-cover transition-all duration-700",
            isHovered && "scale-110 brightness-50"
          )}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

        {/* Rating Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10">
          <Star className="w-4 h-4 text-primary fill-primary" />
          <span className="text-white font-bold text-sm">
            {movie.rating?.toFixed(1)}
          </span>
        </div>

        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
          <h3 className="text-white font-bold text-lg md:text-xl mb-2 line-clamp-2 leading-tight">
            {movie.title}
          </h3>

          <div
            className={clsx(
              "flex items-center gap-2 text-text-secondary text-sm transition-opacity duration-300",
              isHovered ? "opacity-100" : "opacity-70"
            )}
          >
            <span>{movie.year}</span>
            {movie.genres && movie.genres[0] && (
              <>
                <span className="w-1 h-1 rounded-full bg-text-muted" />
                <span className="line-clamp-1">{movie.genres[0]}</span>
              </>
            )}
          </div>
        </div>

        {/* Hover Play Icon */}
        <div
          className={clsx(
            "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center transform transition-transform duration-300 group-hover:scale-110">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Editorial Section Component (Ranks 7-20) - Magazine-style Horizontal Scroll
// ============================================================================
interface EditorialSectionProps {
  movies: IMovie[];
  onMovieClick: (movie: IMovie) => void;
}

function EditorialSection({ movies, onMovieClick }: EditorialSectionProps) {
  return (
    <section className="py-16 md:py-24 bg-bg-tertiary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Split Layout: Static Text on Left, Scrollable Cards on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 lg:gap-12">
          {/* Left: Static Editorial Text */}
          <div className="lg:sticky lg:top-32 lg:h-fit">
            <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
              <span className="text-primary font-semibold text-sm uppercase tracking-wide">
                Must-Watch
              </span>
            </div>
            <h2
              className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Capturing the Moment
            </h2>

            {/* Editorial Quote */}
            <blockquote className="relative pl-6 border-l-2 border-primary/30">
              <p
                className="text-white/90 text-xl md:text-2xl leading-relaxed italic"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                "Life is a movie but there'll never be a sequel"
              </p>
            </blockquote>
          </div>

          {/* Right: Horizontal Scroll */}
          <div className="overflow-x-auto custom-scrollbar pb-4">
            <div className="flex gap-6 min-w-max">
              {movies.map((movie) => (
                <EditorialCard
                  key={movie.imdbId || movie.tmdbId}
                  movie={movie}
                  onClick={() => onMovieClick(movie)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface EditorialCardProps {
  movie: IMovie;
  onClick: () => void;
}

function EditorialCard({ movie, onClick }: EditorialCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const backdropUrl =
    movie.images.backdrop || movie.images.poster || movie.images.thumbnail;

  return (
    <div
      className="group relative cursor-pointer w-[320px] md:w-[400px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* 16:9 Landscape Card */}
      <div className="relative w-full aspect-video overflow-hidden rounded-xl bg-border">
        <img
          src={backdropUrl}
          alt={movie.title}
          className={clsx(
            "w-full h-full object-cover transition-all duration-700",
            isHovered && "scale-105 brightness-75"
          )}
        />

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Rating */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 backdrop-blur-md rounded-lg">
          <Star className="w-4 h-4 text-primary fill-primary" />
          <span className="text-white font-bold text-sm">
            {movie.rating?.toFixed(1)}
          </span>
        </div>

        {/* Play button on hover */}
        <div
          className={clsx(
            "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Title and Info Below */}
      <div className="mt-4">
        <h3 className="text-white font-bold text-lg mb-2 line-clamp-2 leading-tight">
          {movie.title}
        </h3>
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <span>{movie.year}</span>
          {movie.duration && (
            <>
              <span className="w-1 h-1 rounded-full bg-text-muted" />
              <span>{movie.duration} min</span>
            </>
          )}
          {movie.genres && movie.genres[0] && (
            <>
              <span className="w-1 h-1 rounded-full bg-text-muted" />
              <span>{movie.genres[0]}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Archive Section Component (Ranks 21+) - High-Density Grid
// ============================================================================
interface ArchiveSectionProps {
  movies: IMovie[];
  onMovieClick: (movie: IMovie) => void;
  isLoadingMore?: boolean;
  filterBar?: React.ReactNode;
}

function ArchiveSection({
  movies,
  onMovieClick,
  // isLoadingMore,
  filterBar,
}: ArchiveSectionProps) {
  return (
    <section className="py-16 md:py-24" data-section="archive">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8">
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            The Collection
          </h2>
          <p className="text-text-secondary text-lg">
            Explore our complete curated archive
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      {filterBar}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* High-Density Grid or Empty State */}
        {movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {movies.map((movie) => (
              <ArchiveCard
                key={movie.imdbId || movie.tmdbId}
                movie={movie}
                onClick={() => onMovieClick(movie)}
              />
            ))}
          </div>
        ) : (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-bg-tertiary flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                  />
                </svg>
              </div>
              <h3
                className="text-2xl md:text-3xl font-bold text-white mb-3"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                No Movies Found
              </h3>
              <p className="text-text-secondary text-lg mb-6 leading-relaxed">
                We couldn't find any movies matching your filters. Try adjusting
                your criteria to discover more films.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                <span className="text-primary text-sm font-medium">
                  💡 Tip: Reset filters or try different combinations
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

interface ArchiveCardProps {
  movie: IMovie;
  onClick: () => void;
}

function ArchiveCard({ movie, onClick }: ArchiveCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const posterUrl = movie.images.poster || movie.images.thumbnail;

  return (
    <div
      className="group relative cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Poster Container */}
      <div className="relative w-full aspect-[2/3] overflow-hidden rounded-lg bg-border">
        <img
          src={posterUrl}
          alt={movie.title}
          className={clsx(
            "w-full h-full object-cover transition-all duration-500",
            isHovered && "scale-110 brightness-50"
          )}
        />

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Rank Badge (Top Left) */}
        {movie.topRank && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2.5 py-1 bg-primary/90 backdrop-blur-sm rounded-md shadow-lg">
            <span className="text-black font-bold text-xs">#{movie.topRank}</span>
          </div>
        )}

        {/* Rating Badge (Top Right) */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-md">
          <Star className="w-3 h-3 text-primary fill-primary" />
          <span className="text-white font-bold text-xs">
            {movie.rating?.toFixed(1)}
          </span>
        </div>

        {/* Title Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3 className="text-white font-semibold text-sm line-clamp-2 leading-tight mb-1">
            {movie.title}
          </h3>
          <p className="text-text-secondary text-xs">{movie.year}</p>
        </div>

        {/* Play Icon on Hover */}
        <div
          className={clsx(
            "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
