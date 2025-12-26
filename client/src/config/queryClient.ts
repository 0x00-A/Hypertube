import { QueryClient, type DefaultOptions } from '@tanstack/react-query';

// ============================================================================
// Query Client Configuration
// ============================================================================

const queryConfig: DefaultOptions = {
  queries: {
    // Default options for all queries
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status && status >= 400 && status < 500) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  },
  mutations: {
    // Default options for all mutations
    retry: false,
  },
};

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

// ============================================================================
// Query Keys Factory
// ============================================================================

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    currentUser: () => [...queryKeys.auth.all, 'current-user'] as const,
    profile: (userId: string) => [...queryKeys.auth.all, 'profile', userId] as const,
  },
  movies: {
    all: ['movies'] as const,
    lists: () => [...queryKeys.movies.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.movies.lists(), filters] as const,
    details: () => [...queryKeys.movies.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.movies.details(), id] as const,
    recommended: (tmdbId?: number) => ['movies', 'recommended', tmdbId] as const,
  },
  comments: {
    all: ['comments'] as const,
    byMovie: (tmdbId: number) => [...queryKeys.comments.all, 'movie', tmdbId] as const,
  },
} as const;
