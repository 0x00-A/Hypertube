import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Star, Clock, Calendar, Languages, Play, PlayCircle, Plus, Check, Film, User } from 'lucide-react';
import { clsx } from 'clsx';
import { useMovieDetails } from '../../hooks/useMovieDetails';
import { useUserRating } from '../../hooks/useUserRating';
import { useRecommendedMovies } from '../../hooks/useRecommendedMovies';
import { formatRuntime } from '../../utils/movieHelpers';
import { MovieRating, MovieCarousel, CastCarousel } from '../../components/movie';
import { Sparkles } from 'lucide-react';
import TrailerModal from '../../components/movie/TrailerModal';
import { CommentSection } from '../../components/comments';
import { MovieDetailsSkeleton } from '../../components/movie/MovieDetailsSkeleton';
import { useAddToWatchlist, useRemoveFromWatchlist } from '../../hooks/useMovieInteractions';
import toast from 'react-hot-toast';


export default function MovieDetails() {
    // Image loading states
    const [isPosterLoaded, setIsPosterLoaded] = useState(false);
    const [isBackdropLoaded, setIsBackdropLoaded] = useState(false);
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();

    const isTmdbMovie = location.state?.isTmdbMovie ?? (id && !/^\d+$/.test(id));

    const { data: movie, isLoading, error } = useMovieDetails({
        id: id!,
        isTmdbMovie
    });

    const { data: recommendedMoviesData, isLoading: isLoadingRecommended } = useRecommendedMovies({
        tmdbId: movie?.tmdbId,
        enabled: !!movie?.tmdbId
    });


    const [activeTab, setActiveTab] = useState<string>('information');
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [isTrailerOpen, setIsTrailerOpen] = useState(false);

    const { data: currentRating } = useUserRating(movie?._id ?? '');
    const { mutate: addToWatchlist, isPending: isAdding } = useAddToWatchlist();
    const { mutate: removeFromWatchlist, isPending: isRemoving } = useRemoveFromWatchlist();

    const handleWatchlistClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!movie) return;

        if (movie.inWatchlist) {
            if (movie._id) {
                removeFromWatchlist(movie._id);
            } else {
                toast.error('Cannot remove from watchlist: Missing movie ID');
            }
        } else {
            const id = movie._id || movie.tmdbId;
            const isTmdbMovie = !movie._id;

            if (id) {
                addToWatchlist({ id: id, isTmdbMovie });
            } else {
                toast.error('Cannot add to watchlist: Missing movie identifier');
            }
        }
    };

    // IntersectionObserver to update active tab based on scroll position
    useEffect(() => {
        const sections = ['information', 'more-like-this', 'comments'];
        const observers: IntersectionObserver[] = [];

        sections.forEach((sectionId) => {
            const element = document.getElementById(sectionId);
            if (!element) return;

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            setActiveTab(sectionId);
                        }
                    });
                },
                {
                    rootMargin: '-100px 0px -66% 0px', // Trigger when section is near top
                    threshold: 0
                }
            );

            observer.observe(element);
            observers.push(observer);
        });

        return () => {
            observers.forEach((observer) => observer.disconnect());
        };
    }, [movie]); // Re-run when movie data changes



    if (isLoading) {
        return <MovieDetailsSkeleton />;
    }

    if (error || !movie) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl text-white font-bold mb-4">Movie not found</h2>
                    <button
                        onClick={() => navigate('/movies')}
                        className="text-primary hover:underline"
                    >
                        Back to Movies
                    </button>
                </div>
            </div>
        );
    }

    const backdropImage = movie.images?.backdrop || movie.images?.thumbnail;
    const posterImage = movie.images?.poster || movie.images?.thumbnail;

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm mb-6">
                    <button
                        onClick={() => navigate('/')}
                        className="text-text-secondary hover:text-white transition-colors"
                    >
                        Home
                    </button>
                    <span className="text-text-muted">/</span>
                    <button
                        onClick={() => navigate('/movies')}
                        className="text-text-secondary hover:text-white transition-colors"
                    >
                        Movies
                    </button>
                    <span className="text-text-muted">/</span>
                    <span className="text-white">{movie.title}</span>
                </div>

                {/* Ticket Hero Section */}
                <div className="relative w-full rounded-xl overflow-hidden  flex flex-col md:flex-row bg-[#111]">

                    {/* Cutouts for Ticket Effect */}
                    <div className="hidden md:block absolute top-0 left-[35%] -translate-x-1/2 -translate-y-1/2 w-[72px] h-[72px] bg-[#1A1A1A] rounded-full z-30" />
                    <div className="hidden md:block absolute bottom-0 left-[35%] -translate-x-1/2 translate-y-1/2 w-[72px] h-[72px] bg-[#1A1A1A] rounded-full z-30" />

                    {/* Dashed Line */}
                    <div className="hidden md:block absolute top-9 bottom-9 left-[35%] -translate-x-1/2 border-l-2 border-dashed border-white/30 z-30" />

                    {/* Left Side - Poster */}
                    <div className="hidden md:block relative w-[35%] z-20 bg-black">
                        <div className="h-full w-full relative">
                            {/* Skeleton loader for poster */}
                            {!isPosterLoaded && (
                                <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-pulse" />
                            )}
                            <img
                                src={posterImage}
                                alt={movie.title}
                                className={clsx(
                                    "w-full h-full object-cover transition-opacity duration-300",
                                    isPosterLoaded ? "opacity-100" : "opacity-0"
                                )}
                                onLoad={() => setIsPosterLoaded(true)}
                            />
                        </div>
                    </div>

                    {/* Right Side - Info with Backdrop Background */}
                    <div className="relative w-full md:w-[65%] flex-1 flex flex-col">
                        {/* Background Image & Overlay */}
                        <div className="absolute inset-0">
                            {/* Skeleton loader for backdrop */}
                            {!isBackdropLoaded && (
                                <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-pulse" />
                            )}
                            <img
                                src={backdropImage}
                                alt="Backdrop"
                                className={clsx(
                                    "w-full h-full object-cover transition-opacity duration-300",
                                    isBackdropLoaded ? "opacity-100" : "opacity-0"
                                )}
                                onLoad={() => setIsBackdropLoaded(true)}
                            />
                            {/* Gradient Overlay for Text Readability */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10 p-6 md:p-12 flex flex-col justify-center flex-1">
                            <h1 className="text-3xl md:text-6xl font-serif font-bold text-white mb-2 leading-tight tracking-tight">
                                {movie.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-3 md:gap-4 text-text-secondary text-xs md:text-sm font-medium mb-4 md:mb-6">
                                <span>{movie.year}</span>
                                {movie.duration && (
                                    <>
                                        <span>•</span>
                                        <span>{formatRuntime(movie.duration)}</span>
                                    </>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-6 md:mb-8">
                                {movie.genres?.map((genre, index) => (
                                    <span key={index} className="px-3 py-1 md:px-4 md:py-1.5 rounded-full border border-white/10 text-white/80 text-xs md:text-sm hover:bg-white/5 transition-colors backdrop-blur-md bg-white/5">
                                        {genre}
                                    </span>
                                ))}
                                {movie.rating && (
                                    <div className="flex items-center gap-3 ml-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-bold text-base md:text-lg">{typeof movie.rating === 'number' ? movie.rating.toFixed(1) : movie.rating}</span>
                                            <span className="bg-[#F5C518] text-black text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded">IMDb</span>
                                        </div>

                                        <button
                                            onClick={() => setIsRatingModalOpen(true)}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 text-white hover:bg-white/10 text-xs md:text-sm transition-all active:scale-95 backdrop-blur-sm group"
                                        >
                                            <Star className={clsx("w-3.5 h-3.5 transition-colors", currentRating ? "fill-primary text-primary" : "text-white/60 group-hover:text-white")} />
                                            <span className="font-bold">
                                                {currentRating ? `${currentRating}/10` : 'Rate'}
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p className="text-gray-300 text-sm md:text-lg leading-relaxed max-w-2xl mb-6 md:mb-8 line-clamp-4 font-light">
                                {movie.synopsis || movie.overview}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 md:gap-4">
                                <button
                                    onClick={() => navigate(`/watch/${id}`, { state: { isTmdbMovie } })}
                                    className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-black font-bold px-6 py-2.5 md:px-8 md:py-3.5 text-sm md:text-base rounded-xl transition-all active:scale-95 shadow-lg shadow-primary/20"
                                >
                                    <Play className="w-4 h-4 md:w-5 md:h-5 fill-black" />
                                    Play
                                </button>
                                {movie.trailer && (movie.trailer.startsWith('http') || movie.trailer.startsWith('//')) && (
                                    <button
                                        onClick={() => setIsTrailerOpen(true)}
                                        className="flex items-center gap-2 px-6 py-2.5 md:px-8 md:py-3.5 rounded-xl border border-white/20 text-white hover:bg-white/10 font-bold text-sm md:text-base transition-all active:scale-95 backdrop-blur-sm"
                                    >
                                        <PlayCircle className="w-4 h-4 md:w-5 md:h-5" />
                                        Watch Trailer
                                    </button>
                                )}
                                <div className="flex items-center gap-2 md:gap-3">
                                    <button
                                        onClick={handleWatchlistClick}
                                        disabled={isAdding || isRemoving}
                                        className="flex items-center justify-center gap-2 bg-primary text-black hover:bg-primary/90 px-6 py-2.5 md:px-8 md:py-3.5 rounded-xl font-bold text-sm md:text-base transition-all active:scale-95 backdrop-blur-sm group disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px] md:min-w-[220px]"
                                    >
                                        {(isAdding || isRemoving) ? (
                                            <>
                                                <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                
                                            </>
                                        ) : movie.inWatchlist ? (
                                            <>
                                                <Check className="w-4 h-4 md:w-5 md:h-5 stroke-[3]" />
                                                <span>In Watchlist</span>
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-4 h-4 md:w-5 md:h-5 stroke-[3]" />
                                                <span>Add to Watchlist</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <MovieRating
                    isOpen={isRatingModalOpen}
                    onClose={() => setIsRatingModalOpen(false)}
                    currentRating={currentRating}
                    movieId={movie._id!}
                    movieTitle={movie.title}
                />

                <TrailerModal
                    isOpen={isTrailerOpen}
                    onClose={() => setIsTrailerOpen(false)}
                    trailerUrl={movie.trailer}
                    title={movie.title}
                />

                {/* Sticky Navigation */}
                <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border mt-12">
                    <div className="flex items-center gap-8">
                        {[
                            { id: 'information', label: 'Information' },
                            { id: 'more-like-this', label: 'More Like This' },
                            { id: 'comments', label: 'Comments' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    const element = document.getElementById(tab.id);
                                    if (element) {
                                        const offset = 80; // Account for sticky header
                                        const elementPosition = element.getBoundingClientRect().top;
                                        const offsetPosition = elementPosition + window.pageYOffset - offset;

                                        window.scrollTo({
                                            top: offsetPosition,
                                            behavior: 'smooth'
                                        });
                                    }
                                }}
                                className={clsx(
                                    "pb-4 text-base font-medium transition-colors relative",
                                    activeTab === tab.id ? "text-primary" : "text-text-secondary hover:text-white"
                                )}
                            >
                                {tab.label}
                                {activeTab === tab.id && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Information Section */}
                <section id="information" className="scroll-mt-20 py-12">
                    <div className="space-y-6">
                        <h2 className="text-white text-2xl sm:text-3xl font-bold">Information</h2>

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 md:gap-x-24 gap-y-8">
                            {/* Left Column */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between py-4 border-b border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 flex items-center justify-center">
                                            <span className="text-primary font-bold text-lg">T</span>
                                        </div>
                                        <span className="text-white font-medium">Title</span>
                                    </div>
                                    <span className="text-text-secondary">{movie.title}</span>
                                </div>

                                {movie.year && (
                                    <div className="flex items-center justify-between py-4 border-b border-white/10">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-5 h-5 text-primary" />
                                            <span className="text-white font-medium">Year</span>
                                        </div>
                                        <span className="text-text-secondary">{movie.year}</span>
                                    </div>
                                )}

                                {movie.originalLanguage && (
                                    <div className="flex items-center justify-between py-4 border-b border-white/10">
                                        <div className="flex items-center gap-3">
                                            <Languages className="w-5 h-5 text-primary" />
                                            <span className="text-white font-medium">Language</span>
                                        </div>
                                        <span className="text-text-secondary uppercase">{movie.originalLanguage}</span>
                                    </div>
                                )}

                                {movie.director && (
                                    <div className="flex items-center justify-between py-4 border-b border-white/10">
                                        <div className="flex items-center gap-3">
                                            <User className="w-5 h-5 text-primary" />
                                            <span className="text-white font-medium">Director</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {movie.director.profilePath && (
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w45${movie.director.profilePath}`}
                                                    alt={movie.director.name}
                                                    className="w-6 h-6 rounded-full object-cover"
                                                />
                                            )}
                                            <span className="text-text-secondary">{movie.director.name}</span>
                                        </div>
                                    </div>
                                )}

                            </div>

                            {/* Right Column */}
                            <div className="space-y-1">
                                {movie.duration && (
                                    <div className="flex items-center justify-between py-4 border-b border-white/10">
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-5 h-5 text-primary" />
                                            <span className="text-white font-medium">Runtime</span>
                                        </div>
                                        <span className="text-text-secondary">{formatRuntime(movie.duration)}</span>
                                    </div>
                                )}

                                {movie.rating && (
                                    <div className="flex items-center justify-between py-4 border-b border-white/10">
                                        <div className="flex items-center gap-3">
                                            <Star className="w-5 h-5 text-primary" />
                                            <span className="text-white font-medium">Rating</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-text-secondary">
                                                {typeof movie.rating === 'number' ? movie.rating.toFixed(1) : movie.rating}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {movie.producer && (
                                    <div className="flex items-center justify-between py-4 border-b border-white/10">
                                        <div className="flex items-center gap-3">
                                            <Film className="w-5 h-5 text-primary" />
                                            <span className="text-white font-medium">Producer</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {movie.producer.profilePath && (
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w45${movie.producer.profilePath}`}
                                                    alt={movie.producer.name}
                                                    className="w-6 h-6 rounded-full object-cover"
                                                />
                                            )}
                                            <span className="text-text-secondary">{movie.producer.name}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Production Companies Section */}
                        {movie.productionCompanies && movie.productionCompanies.length > 0 && (
                            <div className="mt-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <Film className="w-5 h-5 text-primary" />
                                    <h3 className="text-lg font-bold text-white">Production Companies</h3>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    {movie.productionCompanies.map((company) => (
                                        <div key={company.id} className="flex flex-col items-center gap-2 w-[100px]">
                                            <div className="w-full aspect-square rounded-lg overflow-hidden border border-white/10 bg-white/95 hover:bg-white flex items-center justify-center p-3 transition-all duration-300 shadow-md hover:shadow-lg">
                                                {company.logoPath ? (
                                                    <img
                                                        src={`https://image.tmdb.org/t/p/w200${company.logoPath}`}
                                                        alt={company.name}
                                                        className="w-full h-full object-contain"
                                                    />
                                                ) : (
                                                    <div className="text-center">
                                                        <Film className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                                                        <p className="text-gray-600 text-[10px] font-medium px-1 line-clamp-2">{company.name}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-center w-full px-1">
                                                <p className="text-white text-xs font-medium leading-tight line-clamp-2">{company.name}</p>
                                                {company.originCountry && (
                                                    <p className="text-text-secondary text-[10px] mt-0.5">{company.originCountry}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Cast Section */}
                        {movie.cast && movie.cast.length > 0 && (
                            <CastCarousel
                                title="Stars"
                                cast={movie.cast}
                                maxItems={10}
                                className="mt-12"
                            />
                        )}
                    </div>
                </section>

                {/* More Like This Section */}
                <section id="more-like-this" className="scroll-mt-20 py-12">
                    <MovieCarousel
                        title="More Like This"
                        movies={recommendedMoviesData?.data || []}
                        icon={Sparkles}
                        isLoading={isLoadingRecommended}
                    />
                </section>

                {/* Comments Section */}
                <section id="comments" className="scroll-mt-20 py-12">
                    {movie.tmdbId && <CommentSection tmdbId={movie.tmdbId} />}
                </section>
            </div>
        </div>
    );
}
