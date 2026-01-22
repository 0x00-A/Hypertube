import { useState, useEffect, useRef, useCallback } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Film,
  Menu,
  X,
  SlidersHorizontal,
  Compass,
  Library,
  Clock,
  Sparkles,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuthState } from "../../hooks/useAuth";
import { useDebounce } from "../../hooks/useDebounce";
import { useSearchMovies } from "../../hooks/useSearchMovies";
import ProfileDropdown from "./ProfileDropdown";
import SearchDropdown from "./SearchDropdown";
import FilterDropdown from "./FilterDropdown";
import { Avatar } from "../ui";

const navLinks = [
  { label: "Browse", path: "/browse", icon: Compass },
  { label: "Featured", path: "/featured", icon: Sparkles },
  { label: "Movies", path: "/movies", icon: Film },
  { label: "Library", path: "/library", icon: Library },
  { label: "History", path: "/history", icon: Clock },
];

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const { isAuthenticated, user } = useAuthState();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const profileTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileProfileTriggerRef = useRef<HTMLButtonElement>(null);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileFilterTriggerRef = useRef<HTMLButtonElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced search query for API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { data: searchResults, isLoading: isSearchLoading } = useSearchMovies(debouncedSearchQuery);

  // Close mobile menu and search on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobileMenuOpen(false);
    setIsSearchExpanded(false);
    setIsProfileDropdownOpen(false);
    setIsMobileProfileOpen(false);
    setSearchQuery("");
    setIsSearchFocused(false);
  }, [pathname]);

  // Handle click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideDesktop = searchContainerRef.current && !searchContainerRef.current.contains(target);
      const isOutsideMobile = mobileSearchContainerRef.current && !mobileSearchContainerRef.current.contains(target);

      if (isOutsideDesktop && isOutsideMobile) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchExpanded(false);
      setIsSearchFocused(false);
      setSearchQuery("");
    }
  };

  const closeSearchDropdown = useCallback(() => {
    setIsSearchFocused(false);
    setSearchQuery("");
  }, []);

  const handleFilterClick = () => {
    setIsFilterDropdownOpen(!isFilterDropdownOpen);
  };

  const toggleMobileMenu = () => {
    if (isSearchExpanded) setIsSearchExpanded(false);
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSearch = () => {
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    setIsSearchExpanded(!isSearchExpanded);
  };

  const userInitials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : user?.username?.[0]?.toUpperCase() || "U";

  const username = user?.username || "User";

  return (
    <header className="fixed top-0 left-0 right-0 bg-bg-primary border-b border-border z-50">
      {/* Main Header Row */}
      <div className="h-14 max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between gap-2 md:gap-4">
        {/* LEFT SECTION - Mobile Menu + Logo + Desktop Navigation */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {/* Mobile Menu Toggle */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden w-9 h-9 flex items-center justify-center text-text-secondary hover:text-primary transition-colors"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? (
              <X className="w-8 h-8" />
            ) : (
              <Menu className="w-8 h-8" />
            )}
          </button>

          {/* Logo */}
          <Link to="/browse" className="flex items-center shrink-0 group">
            {/* Desktop Logo */}
            <img
              src="/images/logos/leetflixDesktop.svg"
              alt="Leetflix Logo"
              className="h-6 w-auto hidden sm:block object-contain"
            />
            {/* Mobile Logo */}
            <img
              src="/images/logos/leetflixMobile.svg"
              alt="Leetflix Logo"
              className="h-6 w-auto sm:hidden object-contain"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-3 lg:gap-5">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  clsx(
                    "relative px-1 py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap",
                    isActive
                      ? "text-primary"
                      : "text-text-secondary hover:text-text-primary"
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
        <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-[600px] relative">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search the movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full pl-10 pr-10 py-2 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <button
                  ref={filterTriggerRef}
                  type="button"
                  onClick={handleFilterClick}
                  className={clsx(
                    "w-6 h-6 flex items-center justify-center transition-colors relative",
                    isFilterDropdownOpen ? "text-primary" : "text-text-muted hover:text-primary"
                  )}
                  aria-label="Filter"
                  aria-expanded={isFilterDropdownOpen}
                  aria-controls="header-filter-dropdown-desktop"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
                {/* Filter Dropdown */}
                <div id="header-filter-dropdown-desktop">
                  <FilterDropdown
                    isOpen={isFilterDropdownOpen}
                    onClose={() => setIsFilterDropdownOpen(false)}
                    triggerRef={filterTriggerRef}
                  />
                </div>
              </div>
            </div>
          </form>

          {/* Search Dropdown */}
          {isSearchFocused && debouncedSearchQuery.length >= 2 && (
            <SearchDropdown
              movies={searchResults?.data || []}
              isLoading={isSearchLoading}
              searchQuery={debouncedSearchQuery}
              onClose={closeSearchDropdown}
              hasResults={!!searchResults?.data && searchResults.data.length > 0}
            />
          )}
        </div>

        {/* RIGHT SECTION - Mobile Search Icon + Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile Search Toggle */}
          <button
            onClick={toggleSearch}
            className="md:hidden w-9 h-9 flex items-center justify-center text-text-secondary hover:text-primary bg-bg-tertiary border border-border rounded-lg hover:border-primary transition-all"
            aria-label={isSearchExpanded ? "Close search" : "Open search"}
          >
            {isSearchExpanded ? (
              <X className="w-4 h-4" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>

          {/* Auth Buttons or Profile */}
          {isAuthenticated ? (
            <div className="relative hidden md:block">
              <button
                ref={profileTriggerRef}
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary hover:ring-primary-light transition-all"
                aria-label="User menu"
              >
                <Avatar
                  src={user?.avatarUrl}
                  alt={username}
                  fallback={userInitials}
                  size="md"
                />
              </button>
              <ProfileDropdown
                isOpen={isProfileDropdownOpen}
                onClose={() => setIsProfileDropdownOpen(false)}
                userInitials={userInitials}
                username={username}
                avatarUrl={user?.avatarUrl}
                triggerRef={profileTriggerRef}
              />
            </div>
          ) : (
            <>
              {/* Mobile + Desktop Login/SignUp Buttons */}
              <Link
                to="/auth/login"
                className="px-3 py-1.5 text-sm font-medium text-text-primary border border-border rounded-lg hover:border-primary hover:text-primary transition-colors whitespace-nowrap"
              >
                Login
              </Link>
              <Link
                to="/auth/register"
                className="px-4 py-1.5 text-sm font-medium text-black bg-primary rounded-lg hover:bg-primary-light transition-colors whitespace-nowrap"
              >
                Sign Up
              </Link>
            </>
          )}

          {/* Mobile Profile Avatar - Only show when authenticated */}
          {isAuthenticated && (
            <div className="relative md:hidden">
              <button
                ref={mobileProfileTriggerRef}
                onClick={() => setIsMobileProfileOpen(!isMobileProfileOpen)}
                className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-primary hover:ring-primary-light transition-all cursor-pointer"
                aria-label="User menu"
              >
                <Avatar
                  src={user?.avatarUrl}
                  alt={username}
                  fallback={userInitials}
                  size="sm"
                />
              </button>
              <ProfileDropdown
                isOpen={isMobileProfileOpen}
                onClose={() => setIsMobileProfileOpen(false)}
                userInitials={userInitials}
                username={username}
                avatarUrl={user?.avatarUrl}
                triggerRef={mobileProfileTriggerRef}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Expanded Row - INLINE */}
      {isSearchExpanded && (
        <div className="md:hidden border-t border-border bg-bg-primary animate-in slide-in-from-top-2 duration-200">
          <div ref={mobileSearchContainerRef} className="max-w-7xl mx-auto px-4 py-3 relative">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search the movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  autoFocus
                  className="w-full pl-11 pr-11 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <button
                    ref={mobileFilterTriggerRef}
                    type="button"
                    onClick={handleFilterClick}
                    className={clsx(
                      "w-6 h-6 flex items-center justify-center transition-colors relative",
                      isFilterDropdownOpen ? "text-primary" : "text-text-muted hover:text-primary"
                    )}
                    aria-label="Filter"
                    aria-expanded={isFilterDropdownOpen}
                    aria-controls="header-filter-dropdown-mobile"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                  {/* Mobile Filter Dropdown */}
                  <div id="header-filter-dropdown-mobile">
                    <FilterDropdown
                      isOpen={isFilterDropdownOpen}
                      onClose={() => setIsFilterDropdownOpen(false)}
                      triggerRef={mobileFilterTriggerRef}
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* Mobile Search Dropdown */}
            {isSearchFocused && debouncedSearchQuery.length >= 2 && (
              <SearchDropdown
                movies={searchResults?.data || []}
                isLoading={isSearchLoading}
                searchQuery={debouncedSearchQuery}
                onClose={closeSearchDropdown}
                hasResults={!!searchResults?.data && searchResults.data.length > 0}
              />
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu Expanded Row - INLINE with Icons */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-bg-secondary/50 backdrop-blur-sm animate-in slide-in-from-top-2 duration-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <nav className="grid grid-cols-2 gap-3">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      clsx(
                        "flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-primary/10 border border-primary text-primary shadow-lg shadow-primary/20"
                          : "bg-bg-tertiary border border-border text-text-secondary hover:text-primary hover:border-primary/50 hover:bg-bg-tertiary/80"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={clsx(
                            "w-6 h-6",
                            isActive ? "text-primary" : "text-text-secondary"
                          )}
                        />
                        <span className="text-sm font-medium">
                          {link.label}
                        </span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
