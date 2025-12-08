import { NavLink } from 'react-router-dom';
import {
  Film,
  Library,
  Star,
  Clock,
  Download,
  User,
  Settings,
  ChevronLeft,
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: string;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const sidebarSections: SidebarSection[] = [
  {
    title: 'DISCOVERY',
    items: [
      { icon: Film, label: 'Browse', path: '/browse' },
    ],
  },
  {
    title: 'MY COLLECTION',
    items: [
      { icon: Library, label: 'Library', path: '/library' },
      { icon: Star, label: 'Watchlist', path: '/watchlist' },
      { icon: Clock, label: 'History', path: '/history'},
      { icon: Download, label: 'Downloads', path: '/downloads' },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { icon: User, label: 'Profile', path: '/profile' },
      { icon: Settings, label: 'Settings', path: '/settings' },
    ],
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  return (
    <>
      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed left-0 top-0 h-screen bg-bg-primary transition-all duration-300 ease-in-out z-40 overflow-visible',
          isCollapsed ? 'w-[70px]' : 'w-[220px]'
        )}
        style={{
          clipPath: 'inset(0 -20px 0 0)',
        }}
      >
        {/* Top gradient: from gray (border-color) to white at button position */}
        <div 
          className="absolute top-0 right-0 w-[2px] pointer-events-none bg-gradient-to-b from-border to-white" 
          style={{ height: '62px' }}
          aria-hidden="true"
        />
        {/* Bottom gradient: from white at button position to gray (border-color) */}
        <div 
          className="absolute right-0 w-[2px] pointer-events-none bg-gradient-to-b from-white to-border" 
          style={{ top: '108px', bottom: '0' }}
          aria-hidden="true"
        />
        
        {/* Logo Section */}
        <div className="h-[70px] flex items-center px-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded flex items-center justify-center">
              <Film className="w-5 h-5 text-black" />
            </div>
            {!isCollapsed && (
              <span className="text-lg font-bold text-text-primary">
                St.Movie
              </span>
            )}
          </div>
        </div>

        {/* Toggle Button Container with Custom Border Shape */}
        <div className="relative h-8 flex items-center justify-end">

          {/* Toggle Button - Matches curved cutout */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-12 h-12 bg-bg-primary border-2 border-white flex items-center justify-center transition-all z-50 group"
            style={{
              borderRadius: '50% 50px 50px 50%',
              clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
            }}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <div className="relative -ml-2">
              {isCollapsed ? (
                <ChevronLeft className="w-5 h-5 text-text-primary rotate-180 group-hover:text-primary transition-colors" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-text-primary group-hover:text-primary transition-colors" />
              )}
            </div>
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="mt-2">
          {sidebarSections.map((section, sectionIndex) => (
            <div key={section.title} className={clsx(sectionIndex > 0 && 'mt-8')}>
              {/* Section Header - Fixed height to prevent vibration */}
              <div className="mb-3 h-[16px] flex items-center">
                {!isCollapsed ? (
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-5 block w-full whitespace-nowrap overflow-hidden">
                    {section.title}
                  </span>
                ) : (
                  <div className="w-full h-[2px] bg-border rounded-full mx-5" />
                )}
              </div>

              {/* Section Items */}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          clsx(
                            'flex items-center transition-all duration-200 group relative',
                            isCollapsed ? 'justify-center py-3' : 'py-3 pr-4',
                            isActive
                              ? 'text-primary'
                              : 'text-sidebar-text hover:text-text-primary'
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {/* Yellow left border for active item - Shorter with rounded right corners */}
                            {isActive && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"></span>
                            )}
                            
                            {/* Content wrapper with padding AFTER border */}
                            <div className={clsx(
                              'flex items-center w-full',
                              isCollapsed ? 'justify-center' : 'pl-5'
                            )}>
                              {/* Icon */}
                              <Icon className="w-[22px] h-[22px] shrink-0" />
                              
                              {/* Label (only when expanded) */}
                              {!isCollapsed && (
                                <span className="ml-3 text-[15px] font-normal">
                                  {item.label}
                                </span>
                              )}
                              
                              {/* NEW Badge (only when expanded) */}
                              {!isCollapsed && item.badge && (
                                <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-accent-red text-white rounded uppercase">
                                  {item.badge}
                                </span>
                              )}
                              
                              {/* Red dot indicator when collapsed */}
                              {isCollapsed && item.badge && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-accent-red rounded-full"></span>
                              )}
                            </div>
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Spacer to prevent content from going under sidebar */}
      <div
        className={clsx(
          'shrink-0 transition-all duration-300',
          isCollapsed ? 'w-[70px]' : 'w-[220px]'
        )}
      />
    </>
  );
}
