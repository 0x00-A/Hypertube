import { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Play, Heart, Share2, Star, Calendar, Clock, Languages } from 'lucide-react';
import { clsx } from 'clsx';
import { useMovieDetails } from '../../hooks/useMovieDetails';
import { formatRuntime } from '../../utils/movieHelpers';
import type { ICastMember } from '../../types/movie.types';

export default function MovieDetails() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();

    // If we don't know if it's local (e.g. direct link), we might default to local or try both?
    // For now, rely on passed state or assume local if ID looks like ObjectId (24 hex chars)?
    // But let's stick to the plan: passed state. 
    // If no state (refresh), we might need logic.
    // Simple logic: if id is numeric -> tmdb (isLocal=false). if string/hex -> local.
    const derivedIsLocal = location.state?.isLocal ?? (id && !/^\d+$/.test(id));

    const { data: movie, isLoading, error } = useMovieDetails({
        id: id!,
        isLocal: derivedIsLocal
    });

    const [activeTab, setActiveTab] = useState<'info' | 'similar' | 'reviews'>('info');

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
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
                {/* Ticket Hero Section */}
                <div className="relative w-full rounded-xl overflow-hidden  flex flex-col md:flex-row bg-[#111]">

                    {/* Cutouts for Ticket Effect */}
                    <div className="hidden md:block absolute top-[0px] left-[35%] -translate-x-1/2 -translate-y-1/2 w-[72px] h-[72px] bg-[#1A1A1A] rounded-full z-30" />
                    <div className="hidden md:block absolute bottom-[0px] left-[35%] -translate-x-1/2 translate-y-1/2 w-[72px] h-[72px] bg-[#1A1A1A] rounded-full z-30" />

                    {/* Dashed Line */}
                    <div className="hidden md:block absolute top-9 bottom-9 left-[35%] -translate-x-1/2 border-l-2 border-dashed border-white/30 z-30" />

                    {/* Left Side - Poster */}
                    <div className="hidden md:block relative w-[35%] z-20 bg-black">
                        <div className="h-full w-full">
                            <img
                                src={posterImage}
                                alt={movie.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Right Side - Info with Backdrop Background */}
                    <div className="relative w-full md:w-[65%] flex-1 flex flex-col">
                        {/* Background Image & Overlay */}
                        <div className="absolute inset-0">
                            <img
                                src={backdropImage}
                                alt="Backdrop"
                                className="w-full h-full object-cover"
                            />
                            {/* Gradient Overlay for Text Readability */}
                            <div className="absolute inset-0 bg-gradient-to-r from-[#000] via-[#000]/80 to-[#000]/40" />
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
                                    <div className="flex items-center gap-2 ml-2">
                                        <span className="text-white font-bold text-base md:text-lg">{typeof movie.rating === 'number' ? movie.rating.toFixed(1) : movie.rating}</span>
                                        <span className="bg-[#F5C518] text-black text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded">IMDb</span>
                                    </div>
                                )}
                            </div>

                            <p className="text-gray-300 text-sm md:text-lg leading-relaxed max-w-2xl mb-6 md:mb-8 line-clamp-4 font-light">
                                {movie.synopsis || movie.overview}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 md:gap-4">
                                <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-black font-bold px-6 py-2.5 md:px-8 md:py-3.5 text-sm md:text-base rounded-xl transition-all active:scale-95 shadow-lg shadow-primary/20">
                                    <Play className="w-4 h-4 md:w-5 md:h-5 fill-black" />
                                    Play
                                </button>
                                <button className="px-6 py-2.5 md:px-8 md:py-3.5 rounded-xl border border-white/20 text-white hover:bg-white/10 font-bold text-sm md:text-base transition-all active:scale-95 backdrop-blur-sm">
                                    Watch Trailer
                                </button>
                                <div className="flex items-center gap-2 md:gap-3">
                                    <button className="p-2.5 md:p-3.5 rounded-xl hover:bg-white/10 text-white transition-colors border border-white/20 backdrop-blur-sm group">
                                        <Heart className={clsx("w-4 h-4 md:w-5 md:h-5 transition-colors group-hover:text-red-500", movie.inWatchlist ? "fill-red-500 text-red-500" : "")} />
                                    </button>
                                    <button className="p-2.5 md:p-3.5 rounded-xl hover:bg-white/10 text-white transition-colors border border-white/20 backdrop-blur-sm group">
                                        <Share2 className="w-4 h-4 md:w-5 md:h-5 transition-colors group-hover:text-primary" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}
                <div className="mt-12">
                    <div className="border-b border-border">
                        <div className="flex items-center gap-8">
                            {['info', 'similar', 'reviews'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as 'info' | 'similar' | 'reviews')}
                                    className={clsx(
                                        "pb-4 text-base font-medium transition-colors relative",
                                        activeTab === tab ? "text-primary" : "text-text-secondary hover:text-white"
                                    )}
                                >
                                    {tab === 'info' && 'Information'}
                                    {tab === 'similar' && 'More Like This'}
                                    {tab === 'reviews' && 'Reviews'}
                                    {activeTab === tab && (
                                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="mt-8">
                        {activeTab === 'info' && (
                            <div className="space-y-12">
                                <h3 className="text-2xl text-white font-bold mb-6">Information</h3>

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
                                                    <span className="text-white font-medium">Similars</span>
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
                                    </div>
                                </div>

                                {/* Cast Section */}
                                {movie.cast && movie.cast.length > 0 && (
                                    <div className="mt-12">
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="text-primary">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                            </div>
                                            <h3 className="text-xl font-bold text-white">Stars</h3>
                                        </div>
                                        <div className="flex overflow-x-auto gap-6 pb-4 custom-scrollbar">
                                            {movie.cast.slice(0, 10).map((member: ICastMember) => (
                                                <div key={member.id} className="flex flex-col items-center gap-3 min-w-[100px]">
                                                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border">
                                                        {member.profilePath ? (
                                                            <img
                                                                src={`https://image.tmdb.org/t/p/w200${member.profilePath}`}
                                                                alt={member.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-card flex items-center justify-center text-text-muted text-xs">
                                                                N/A
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-white text-sm font-medium leading-tight mb-1">{member.name}</p>
                                                        <p className="text-text-secondary text-xs">{member.character}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'similar' && (
                            <div className="text-center py-12 text-text-secondary">
                                <p>Similar movies implementation coming soon...</p>
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="text-center py-12 text-text-secondary">
                                <p>Reviews implementation coming soon...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
