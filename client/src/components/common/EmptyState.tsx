import { type ReactNode } from 'react';
import { Film, History, Search, Bookmark, Sparkles, Library as LibraryIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

// ============================================================================
// Empty State Types
// ============================================================================

export type EmptyStateVariant = 
  | 'library'
  | 'history'
  | 'search'
  | 'watchlist'
  | 'favorites'
  | 'featured';

interface EmptyStateContent {
  icon: ReactNode;
  headline: string;
  description: string;
  cta?: {
    label: string;
    href: string;
  };
}

interface EmptyStateProps {
  variant: EmptyStateVariant;
  customHeadline?: string;
  customDescription?: string;
  className?: string;
}

// ============================================================================
// Content Configuration
// ============================================================================

const EMPTY_STATE_CONTENT: Record<EmptyStateVariant, EmptyStateContent> = {
  library: {
    icon: <LibraryIcon className="w-16 h-16" strokeWidth={1.5} />,
    headline: 'Your Library is Empty',
    description: 'Start adding movies to build your personal collection',
    cta: {
      label: 'Browse Movies',
      href: '/browse'
    }
  },
  
  history: {
    icon: <History className="w-16 h-16" strokeWidth={1.5} />,
    headline: 'No Watch History',
    description: 'Movies you watch will appear here',
    cta: {
      label: 'Browse Movies',
      href: '/browse'
    }
  },
  
  search: {
    icon: <Search className="w-16 h-16" strokeWidth={1.5} />,
    headline: 'No Results Found',
    description: 'Try adjusting your search or filters',
    cta: {
      label: 'Clear Filters',
      href: '/browse'
    }
  },
  
  watchlist: {
    icon: <Bookmark className="w-16 h-16" strokeWidth={1.5} />,
    headline: 'Your Watchlist is Empty',
    description: 'Save movies you want to watch later',
    cta: {
      label: 'Browse Movies',
      href: '/browse'
    }
  },
  
  favorites: {
    icon: <Sparkles className="w-16 h-16" strokeWidth={1.5} />,
    headline: 'No Favorites Yet',
    description: 'Mark your favorite movies to see them here',
    cta: {
      label: 'Browse Movies',
      href: '/featured'
    }
  },
  
  featured: {
    icon: <Film className="w-16 h-16" strokeWidth={1.5} />,
    headline: 'Coming Soon',
    description: 'New featured content will be available soon'
  }
};

// ============================================================================
// Empty State Component
// ============================================================================

export const EmptyState = ({ 
  variant, 
  customHeadline, 
  customDescription,
  className 
}: EmptyStateProps) => {
  const content = EMPTY_STATE_CONTENT[variant];

  return (
    <div className={clsx('flex items-center justify-center py-16 px-4', className)}>
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="text-text-muted/40">
            {content.icon}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {/* Headline */}
          <h2 className="text-xl font-semibold text-text-primary">
            {customHeadline || content.headline}
          </h2>
          
          {/* Description */}
          <p className="text-sm text-text-secondary">
            {customDescription || content.description}
          </p>
          
          {/* Call to Action */}
          {content.cta && (
            <div className="pt-4">
              <Link
                to={content.cta.href}
                className="inline-block px-6 py-2.5 bg-primary text-black font-medium text-sm rounded-lg hover:bg-primary/90 transition-colors"
              >
                {content.cta.label}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
