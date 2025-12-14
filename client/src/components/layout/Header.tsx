import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Film, Menu, X, SlidersHorizontal, Compass, Library, Star, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthState } from '../../hooks/useAuth';
import ProfileDropdown from './ProfileDropdown';

const navLinks = [
  { label: 'Browse', path: '/browse', icon: Compass },
  { label: 'Library', path: '/library', icon: Library },
  { label: 'Watchlist', path: '/watchlist', icon: Star },
  { label: 'History', path: '/history', icon: Clock },
];

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const { isAuthenticated, user } = useAuthState();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  // Close mobile menu and search on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobileMenuOpen(false);
    setIsSearchExpanded(false);
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchExpanded(false);
    }
  };

  const handleFilterClick = () => {
    // TODO: Implement filter functionality
  };

  const toggleMobileMenu = () => {
    if (isSearchExpanded) setIsSearchExpanded(false);
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSearch = () => {
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    setIsSearchExpanded(!isSearchExpanded);
  };

  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.username?.[0]?.toUpperCase() || 'U';

  const username = user?.username || user?.email?.split('@')[0] || 'User';

  return (
    <header className="fixed top-0 left-0 right-0 bg-bg-primary border-b border-border z-50">
      {/* Main Header Row */}
      <div className="h-[70px] max-w-[1920px] mx-auto px-4 md:px-6 flex items-center justify-between gap-3 md:gap-6">
        {/* LEFT SECTION - Mobile Menu + Logo + Desktop Navigation */}
        <div className="flex items-center gap-3 md:gap-6 shrink-0">
          {/* Mobile Menu Toggle */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden w-10 h-10 flex items-center justify-center text-text-secondary hover:text-primary transition-colors"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
          </button>

          {/* Logo */}
          <Link to="/browse" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 md:w-9 md:h-9 bg-primary rounded flex items-center justify-center group-hover:bg-primary-light transition-colors">
              <Film className="w-4 h-4 md:w-5 md:h-5 text-black" />
            </div>
            <span className="text-lg md:text-xl font-bold text-text-primary hidden sm:block">
              St.Movie
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  clsx(
                    'relative px-1 py-2 text-sm lg:text-base font-medium transition-colors duration-200 whitespace-nowrap',
                    isActive
                      ? 'text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{link.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* CENTER SECTION - Desktop Search Bar */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-[600px]"
        >
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search the movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-11 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <button
              type="button"
              onClick={handleFilterClick}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-text-muted hover:text-primary transition-colors"
              aria-label="Filter"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* RIGHT SECTION - Mobile Search Icon + Actions */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {/* Mobile Search Toggle */}
          <button
            onClick={toggleSearch}
            className="md:hidden w-9 h-9 flex items-center justify-center text-text-secondary hover:text-primary bg-bg-tertiary border border-border rounded-lg hover:border-primary transition-all"
            aria-label={isSearchExpanded ? 'Close search' : 'Open search'}
          >
            {isSearchExpanded ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          {/* Notification Bell - Only show when authenticated */}
          {isAuthenticated && (
            <button
              className="hidden md:flex relative w-9 h-9 items-center justify-center text-text-secondary hover:text-primary transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-red rounded-full"></span>
            </button>
          )}

          {/* Auth Buttons or Profile */}
          {isAuthenticated ? (
            <div className="relative hidden md:block">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="w-9 h-9 rounded-full bg-primary flex items-center justify-center hover:bg-primary-light transition-colors"
                aria-label="User menu"
              >
                <span className="text-sm font-bold text-black">{userInitials}</span>
              </button>
              <ProfileDropdown
                isOpen={isProfileDropdownOpen}
                onClose={() => setIsProfileDropdownOpen(false)}
                userInitials={userInitials}
                username={username}
              />
            </div>
          ) : (
            <>
              {/* Mobile + Desktop Login/SignUp Buttons */}
              <Link
                to="/auth/login"
                className="px-4 py-2 text-sm font-medium text-text-primary border border-border rounded-lg hover:border-primary hover:text-primary transition-colors whitespace-nowrap"
              >
                Login
              </Link>
              <Link
                to="/auth/register"
                className="px-5 py-2 text-sm font-medium text-black bg-primary rounded-lg hover:bg-primary-light transition-colors whitespace-nowrap"
              >
                Sign Up
              </Link>
            </>
          )}

          {/* Mobile Profile Avatar - Only show when authenticated */}
          {isAuthenticated && (
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="md:hidden w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:bg-primary-light transition-colors"
              aria-label="User menu"
            >
              <span className="text-xs font-bold text-black">{userInitials}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Search Expanded Row - INLINE */}
      {isSearchExpanded && (
        <div className="md:hidden border-t border-border bg-bg-primary animate-in slide-in-from-top-2 duration-200">
          <div className="max-w-[1920px] mx-auto px-4 py-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search the movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-11 pr-11 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <button
                  type="button"
                  onClick={handleFilterClick}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-text-muted hover:text-primary transition-colors"
                  aria-label="Filter"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Menu Expanded Row - INLINE with Icons */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-bg-secondary/50 backdrop-blur-sm animate-in slide-in-from-top-2 duration-200">
          <div className="max-w-[1920px] mx-auto px-4 py-4">
            <nav className="grid grid-cols-2 gap-3">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      clsx(
                        'flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-xl transition-all duration-200',
                        isActive
                          ? 'bg-primary/10 border border-primary text-primary shadow-lg shadow-primary/20'
                          : 'bg-bg-tertiary border border-border text-text-secondary hover:text-primary hover:border-primary/50 hover:bg-bg-tertiary/80'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={clsx('w-6 h-6', isActive ? 'text-primary' : 'text-text-secondary')} />
                        <span className="text-sm font-medium">{link.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Mobile Profile Links - Only show when authenticated */}
            {isAuthenticated && (
              <div className="mt-3 pt-3 border-t border-border space-y-1">
                <Link
                  to="/profile"
                  className="block px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                >
                  View Profile
                </Link>
                <Link
                  to="/settings"
                  className="block px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                >
                  Settings
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Profile Dropdown - Position below avatar */}
      {isAuthenticated && (
        <div className="md:hidden">
          <ProfileDropdown
            isOpen={isProfileDropdownOpen}
            onClose={() => setIsProfileDropdownOpen(false)}
            userInitials={userInitials}
            username={username}
          />
        </div>
      )}
    </header>
  );
}

