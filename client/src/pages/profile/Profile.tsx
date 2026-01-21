import { useAuthState } from '../../hooks/useAuth';
import { useWatchlist } from '../../hooks/useWatchlist';
import { User, Film, Clock, Star, Settings, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { MovieCarousel } from '../../components/movie/MovieCarousel';
import { useMemo } from 'react';

export default function Profile() {
  const { user } = useAuthState();
  const navigate = useNavigate();
  const { data: watchlistData, isLoading: watchlistLoading } = useWatchlist();

  // Calculate stats
  const stats = useMemo(() => {
    const watchlistCount = watchlistData?.pages?.[0]?.pagination?.total || 0;
    const watchedCount = 0; // TODO: Implement watched movies tracking
    
    return {
      watchlist: watchlistCount,
      watched: watchedCount,
      avgRating: 0, // TODO: Calculate from user ratings
    };
  }, [watchlistData]);

  // Get watchlist movies (first 10 for carousel)
  const watchlistMovies = useMemo(() => {
    if (!watchlistData?.pages?.[0]?.data) return [];
    return watchlistData.pages[0].data.slice(0, 10);
  }, [watchlistData]);

  // Format member since date
  const memberSince = useMemo(() => {
    if (!user?.createdAt) return '';
    const date = new Date(user.createdAt);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [user]);

  // Get initials for avatar fallback
  const initials = useMemo(() => {
    if (!user) return '?';
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.username?.[0]?.toUpperCase() || '?';
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-text-secondary">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-primary/5 border border-primary/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        
        <div className="relative p-8 sm:p-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-4 border-primary/50 flex items-center justify-center text-3xl sm:text-4xl font-bold text-primary shadow-xl shadow-primary/20">
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/0 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* User Info */}
            <div className="flex-1 space-y-3">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-text-primary">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.username
                  }
                </h1>
                <p className="text-lg text-text-secondary mt-1">@{user.username}</p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Member since {memberSince}</span>
                </div>
                {user.email && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span>{user.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Settings Button */}
            <Link
              to="/settings"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20"
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Watchlist Count */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 p-6 hover:border-blue-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <Film className="w-8 h-8 text-blue-400" />
              <div className="text-3xl font-bold text-text-primary">{stats.watchlist}</div>
            </div>
            <p className="text-sm text-text-secondary font-medium">Movies in Watchlist</p>
          </div>
        </div>

        {/* Watched Count */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 p-6 hover:border-green-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-green-400" />
              <div className="text-3xl font-bold text-text-primary">{stats.watched}</div>
            </div>
            <p className="text-sm text-text-secondary font-medium">Movies Watched</p>
          </div>
        </div>

        {/* Average Rating */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-6 hover:border-primary/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-8 h-8 text-primary" />
              <div className="text-3xl font-bold text-text-primary">
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
              </div>
            </div>
            <p className="text-sm text-text-secondary font-medium">Average Rating</p>
          </div>
        </div>
      </div>

      {/* Watchlist Section */}
      <div className="space-y-4">
        {watchlistMovies.length > 0 ? (
          <MovieCarousel
            title="My Watchlist"
            movies={watchlistMovies}
            icon={Film}
            onViewAll={() => navigate('/library')}
            isLoading={watchlistLoading}
          />
        ) : !watchlistLoading ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                <Film className="w-7 h-7 text-primary" />
                My Watchlist
              </h2>
            </div>
            <div className="text-center py-12 rounded-xl bg-gray-800/20 border border-gray-700/30">
              <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-text-secondary text-lg mb-4">Your watchlist is empty</p>
              <Link
                to="/browse"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg transition-all duration-300 hover:scale-105"
              >
                Browse Movies
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                <Film className="w-7 h-7 text-primary" />
                My Watchlist
              </h2>
            </div>
            <div className="grid grid-flow-col auto-cols-[100%] sm:auto-cols-[calc(50%-4px)] md:auto-cols-[calc(33.333%-5.33px)] lg:auto-cols-[calc(25%-6px)] xl:auto-cols-[calc(20%-6.4px)] gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[2/3] bg-gray-700/30 rounded-xl" />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Recently Watched Section - Placeholder */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3">
          <Clock className="w-7 h-7 text-primary" />
          Recently Watched
        </h2>
        <div className="text-center py-12 rounded-xl bg-gray-800/20 border border-gray-700/30">
          <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-text-secondary text-lg">No recently watched movies yet</p>
        </div>
      </div>
    </div>
  );
}
