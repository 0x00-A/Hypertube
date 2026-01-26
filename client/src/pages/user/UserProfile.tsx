import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Calendar, Globe, User as UserIcon } from 'lucide-react';
import { getAvatarUrl } from '../../utils/avatarUtils';
import { formatDistanceToNow } from 'date-fns';
import { useUserProfile } from '../../hooks/useUserProfile';

const LANGUAGES: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ru: 'Русский',
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
};

export default function UserProfile() {
  const { id: username } = useParams<{ id: string }>();
  const { data: user, isLoading, error } = useUserProfile(username);
  const [curtainsOpen, setCurtainsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurtainsOpen(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-bg-tertiary rounded mb-8" />
            <div className="bg-bg-card rounded-2xl border border-border p-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-32 h-32 bg-bg-tertiary rounded-full" />
                <div className="flex-1 space-y-4">
                  <div className="h-8 w-48 bg-bg-tertiary rounded" />
                  <div className="h-6 w-64 bg-bg-tertiary rounded" />
                  <div className="h-4 w-32 bg-bg-tertiary rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-bg-card rounded-2xl border border-border p-12 text-center">
            <UserIcon className="w-16 h-16 text-text-secondary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-text-primary mb-2">User Not Found</h2>
            <p className="text-text-secondary">
              The user you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user.username?.slice(0, 2).toUpperCase() || '?';

  const memberSince = user.createdAt
    ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })
    : 'Unknown';

  const languageDisplay = user.language ? LANGUAGES[user.language] || user.language.toUpperCase() : 'Not set';

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="relative overflow-hidden rounded-2xl bg-black shadow-2xl mb-6">
          {/* Main theater background */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-black" />
          
          {/* Red velvet curtain - left side */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-1/2 bg-gradient-to-r from-red-900/95 via-red-800/90 to-red-700/80 z-20 transition-transform duration-[1800ms] ease-in-out"
            style={{
              backgroundImage: `
                linear-gradient(180deg, rgba(127, 29, 29, 0.95) 0%, rgba(153, 27, 27, 0.9) 50%, rgba(127, 29, 29, 0.95) 100%),
                repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(139, 0, 0, 0.4) 3px, rgba(139, 0, 0, 0.4) 6px)
              `,
              boxShadow: 'inset -40px 0 60px rgba(0, 0, 0, 0.9)',
              transform: curtainsOpen ? 'translateX(-100%)' : 'translateX(0)'
            }}>
            <div className="absolute inset-0 bg-gradient-to-r from-red-950/70 to-transparent" />
            {/* Decorative gold rope */}
            <div className="absolute right-4 top-8 bottom-8 w-1 bg-gradient-to-b from-yellow-700/60 via-yellow-600/80 to-yellow-700/60 rounded-full shadow-lg" />
          </div>
          
          {/* Red velvet curtain - right side */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-red-900/95 via-red-800/90 to-red-700/80 z-20 transition-transform duration-[1800ms] ease-in-out"
            style={{
              backgroundImage: `
                linear-gradient(180deg, rgba(127, 29, 29, 0.95) 0%, rgba(153, 27, 27, 0.9) 50%, rgba(127, 29, 29, 0.95) 100%),
                repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(139, 0, 0, 0.4) 3px, rgba(139, 0, 0, 0.4) 6px)
              `,
              boxShadow: 'inset 40px 0 60px rgba(0, 0, 0, 0.9)',
              transform: curtainsOpen ? 'translateX(100%)' : 'translateX(0)'
            }}>
            <div className="absolute inset-0 bg-gradient-to-l from-red-950/70 to-transparent" />
            {/* Decorative gold rope */}
            <div className="absolute left-4 top-8 bottom-8 w-1 bg-gradient-to-b from-yellow-700/60 via-yellow-600/80 to-yellow-700/60 rounded-full shadow-lg" />
          </div>
          
          {/* Center stage spotlight effect */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-full transition-opacity duration-1000 delay-700"
            style={{ opacity: curtainsOpen ? 1 : 0 }}>
            <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 via-yellow-300/5 to-transparent blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
          </div>
          
          {/* Ambient warm glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-950/30 via-transparent to-transparent" />
          
          {/* Floor/stage gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black via-gray-950/50 to-transparent" />
          
          <div 
            className="relative p-6 sm:p-10 lg:p-12 z-10 transition-all duration-1000 delay-500"
            style={{ 
              opacity: curtainsOpen ? 1 : 0,
              transform: curtainsOpen ? 'scale(1)' : 'scale(0.95)'
            }}>
          
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-4 border-primary/50 flex items-center justify-center text-3xl sm:text-4xl font-bold text-primary shadow-xl shadow-primary/20 overflow-hidden">
                  {user.avatarUrl ? (
                    <img 
                      src={getAvatarUrl(user.avatarUrl)} 
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
                  {user.language && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary" />
                      <span>{languageDisplay}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information Card */}
        <div className="bg-bg-card rounded-lg border border-border p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-text-primary mb-1">Profile Information</h3>
            <p className="text-sm text-text-secondary">User account information and details.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-secondary">
                First Name
              </label>
              <div className="w-full px-4 py-3 rounded-lg bg-bg-tertiary text-text-primary border border-border">
                {user.firstName || 'Not provided'}
              </div>
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-secondary">
                Last Name
              </label>
              <div className="w-full px-4 py-3 rounded-lg bg-bg-tertiary text-text-primary border border-border">
                {user.lastName || 'Not provided'}
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-secondary">
                Username
              </label>
              <div className="w-full px-4 py-3 rounded-lg bg-bg-tertiary text-text-primary border border-border">
                {user.username}
              </div>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-secondary">
                Language
              </label>
              <div className="w-full px-4 py-3 rounded-lg bg-bg-tertiary text-text-primary border border-border uppercase">
                {user.language || 'Not provided'}
              </div>
            </div>

            {/* Member Since */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-secondary">
                Member Since
              </label>
              <div className="w-full px-4 py-3 rounded-lg bg-bg-tertiary text-text-primary border border-border">
                {memberSince}
              </div>
            </div>

            {/* Account Status */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-secondary">
                Account Status
              </label>
              <div className="w-full px-4 py-3 rounded-lg bg-bg-tertiary text-text-primary border border-border">
                {user.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
        </div>
          </div>
      </div>
  );
}

