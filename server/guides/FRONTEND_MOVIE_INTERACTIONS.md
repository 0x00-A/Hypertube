# Frontend Implementation Guide: Movie Interactions

This guide explains how to implement the MovieInteraction features on the frontend (React client).

## Table of Contents

1. [API Service Setup](#api-service-setup)
2. [Watch Progress Tracking](#watch-progress-tracking)
3. [Rating System](#rating-system)
4. [Watchlist Management](#watchlist-management)
5. [History & Continue Watching](#history--continue-watching)
6. [React Hooks](#react-hooks)
7. [Complete Examples](#complete-examples)

---

## API Service Setup

First, create an API service for movie interactions (matching backend endpoints):

```typescript
// src/services/movieInteractions.service.ts
import { http } from './http';

export interface WatchProgressData {
  lastWatchedPosition: number;
  duration: number;
}

export interface MovieInteraction {
  _id: string;
  userId: string;
  movieId: string;
  interactionType: 'watched' | 'rated' | 'watchlist' | 'downloaded';
  lastWatchedPosition?: number;
  duration?: number;
  watchProgress?: number;
  isCompleted?: boolean;
  rating?: number;
  watchedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MovieStats {
  totalWatches: number;
  watchlistCount: number;
  averageRating?: number;
  totalRatings: number;
}

export const movieInteractionsService = {
  // Watch Progress
  updateWatchProgress: (movieId: string, data: WatchProgressData) =>
    http.post<{ data: MovieInteraction; message: string }>(
      `/api/v1/interactions/movies/${movieId}/progress`,
      data,
    ),

  getWatchProgress: (movieId: string) =>
    http.get<{ data: MovieInteraction | null; message: string }>(
      `/api/v1/interactions/movies/${movieId}/progress`,
    ),

  // Ratings
  rateMovie: (movieId: string, rating: number) =>
    http.post<{ data: MovieInteraction; message: string }>(
      `/api/v1/interactions/movies/${movieId}/rating`,
      { rating },
    ),

  getUserRating: (movieId: string) =>
    http.get<{ data: { rating: number | null }; message: string }>(
      `/api/v1/interactions/movies/${movieId}/rating`,
    ),

  // Watchlist
  addToWatchlist: (movieId: string) =>
    http.post<{ data: MovieInteraction; message: string }>(
      `/api/v1/interactions/movies/${movieId}/watchlist`,
    ),

  removeFromWatchlist: (movieId: string) =>
    http.delete<{ message: string }>(`/api/v1/interactions/movies/${movieId}/watchlist`),

  // Stats
  getMovieStats: (movieId: string) =>
    http.get<{ data: MovieStats; message: string }>(`/api/v1/interactions/movies/${movieId}/stats`),

  getUserStats: () =>
    http.get<{ data: MovieStats; message: string }>(`/api/v1/interactions/user/stats`),

  // Lists
  getWatchHistory: (limit = 20) =>
    http.get<{ data: any[]; message: string }>(`/api/v1/interactions/history?limit=${limit}`),

  getWatchlist: (params?: Record<string, any>) =>
    http.get<{ data: any[]; pagination: any; message: string }>('/api/v1/interactions/watchlist', {
      params,
    }),

  getContinueWatching: (limit = 10) =>
    http.get<{ data: any[]; message: string }>(
      `/api/v1/interactions/continue-watching?limit=${limit}`,
    ),
};
```

---

## Watch Progress Tracking

### Custom Hook: useWatchProgress

```typescript
// src/hooks/useWatchProgress.ts
import { useEffect, useRef, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { movieInteractionsService } from '../services/movieInteractions.service';

interface UseWatchProgressOptions {
  movieId: string;
  saveInterval?: number; // milliseconds
  enabled?: boolean;
}

export const useWatchProgress = ({
  movieId,
  saveInterval = 30000, // 30 seconds
  enabled = true,
}: UseWatchProgressOptions) => {
  const lastSavedPosition = useRef<number>(0);

  // Fetch existing progress on mount
  const { data: progressData } = useQuery({
    queryKey: ['watchProgress', movieId],
    queryFn: () => movieInteractionsService.getWatchProgress(movieId),
    enabled,
  });

  // Mutation for saving progress
  const { mutate: saveProgress } = useMutation({
    mutationFn: (data: { position: number; duration: number }) =>
      movieInteractionsService.updateWatchProgress(movieId, {
        lastWatchedPosition: data.position,
        duration: data.duration,
      }),
    onSuccess: (_, variables) => {
      lastSavedPosition.current = variables.position;
    },
  });

  // Save progress function
  const handleSaveProgress = useCallback(
    (position: number, duration: number) => {
      // Only save if position changed significantly (e.g., 5 seconds)
      if (Math.abs(position - lastSavedPosition.current) >= 5) {
        saveProgress({ position, duration });
      }
    },
    [saveProgress],
  );

  return {
    savedProgress: progressData?.data.data,
    saveProgress: handleSaveProgress,
  };
};
```

### Video Player Component

```typescript
// src/components/movie/VideoPlayer.tsx
import { useEffect, useRef } from 'react';
import { useWatchProgress } from '../../hooks/useWatchProgress';

interface VideoPlayerProps {
  movieId: string;
  src: string;
}

export const VideoPlayer = ({ movieId, src }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { savedProgress, saveProgress } = useWatchProgress({ movieId });

  // Restore playback position on mount
  useEffect(() => {
    if (videoRef.current && savedProgress?.lastWatchedPosition) {
      videoRef.current.currentTime = savedProgress.lastWatchedPosition;
    }
  }, [savedProgress]);

  // Save progress periodically
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const interval = setInterval(() => {
      if (!video.paused && video.duration) {
        saveProgress(video.currentTime, video.duration);
      }
    }, 30000); // Every 30 seconds

    // Save on pause
    const handlePause = () => {
      if (video.duration) {
        saveProgress(video.currentTime, video.duration);
      }
    };

    // Save on seeking
    const handleSeeked = () => {
      if (video.duration) {
        saveProgress(video.currentTime, video.duration);
      }
    };

    video.addEventListener('pause', handlePause);
    video.addEventListener('seeked', handleSeeked);

    // Save before page unload
    const handleBeforeUnload = () => {
      if (video.duration) {
        saveProgress(video.currentTime, video.duration);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Save on visibility change (user switches tabs)
    const handleVisibilityChange = () => {
      if (document.hidden && video.duration) {
        saveProgress(video.currentTime, video.duration);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeked', handleSeeked);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Final save on unmount
      if (video.duration) {
        saveProgress(video.currentTime, video.duration);
      }
    };
  }, [saveProgress]);

  return (
    <div className="video-player">
      <video
        ref={videoRef}
        src={src}
        controls
        className="w-full h-full"
      />
      {savedProgress && (
        <div className="progress-info">
          Watch progress: {savedProgress.watchProgress?.toFixed(0)}%
          {savedProgress.isCompleted && ' ✓ Completed'}
        </div>
      )}
    </div>
  );
};
```

---

## Rating System

### Custom Hook: useMovieRating

```typescript
// src/hooks/useMovieRating.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { movieInteractionsService } from '../services/movieInteractions.service';

export const useMovieRating = (movieId: string) => {
  const queryClient = useQueryClient();

  const { data: ratingData } = useQuery({
    queryKey: ['movieRating', movieId],
    queryFn: () => movieInteractionsService.getUserRating(movieId),
  });

  const { data: statsData } = useQuery({
    queryKey: ['movieStats', movieId],
    queryFn: () => movieInteractionsService.getMovieStats(movieId),
  });

  const { mutate: rate, isPending } = useMutation({
    mutationFn: (rating: number) => movieInteractionsService.rateMovie(movieId, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movieRating', movieId] });
      queryClient.invalidateQueries({ queryKey: ['movieStats', movieId] });
    },
  });

  return {
    userRating: ratingData?.data.data.rating,
    movieStats: statsData?.data.data,
    rate,
    isRating: isPending,
  };
};
```

### Rating Component

```typescript
// src/components/movie/RatingStars.tsx
import { useState } from 'react';
import { useMovieRating } from '../../hooks/useMovieRating';

interface RatingStarsProps {
  movieId: string;
}

export const RatingStars = ({ movieId }: RatingStarsProps) => {
  const { userRating, movieStats, rate, isRating } = useMovieRating(movieId);
  const [hoverRating, setHoverRating] = useState(0);

  const handleRate = (rating: number) => {
    rate(rating);
  };

  return (
    <div className="rating-container">
      <div className="flex items-center gap-2">
        <div className="stars flex">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
            <button
              key={star}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={isRating}
              className={`star ${
                star <= (hoverRating || userRating || 0)
                  ? 'text-yellow-500'
                  : 'text-gray-400'
              }`}
            >
              ★
            </button>
          ))}
        </div>
        {userRating && (
          <span className="text-sm">Your rating: {userRating}/10</span>
        )}
      </div>

      {movieStats && (
        <div className="stats text-sm text-gray-600 mt-2">
          Average: {movieStats.averageRating?.toFixed(1) || 'N/A'}/10
          ({movieStats.totalRatings} ratings)
        </div>
      )}
    </div>
  );
};
```

---

## Watchlist Management

### Custom Hook: useWatchlist

```typescript
// src/hooks/useWatchlist.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { movieInteractionsService } from '../services/movieInteractions.service';

export const useWatchlist = (movieId?: string) => {
  const queryClient = useQueryClient();

  // Get full watchlist
  const { data: watchlistData } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => movieInteractionsService.getWatchlist(),
  });

  // Check if specific movie is in watchlist
  const isInWatchlist = movieId
    ? watchlistData?.data.data.some((item) => item.movieId === movieId)
    : false;

  // Add to watchlist
  const { mutate: addToWatchlist } = useMutation({
    mutationFn: (id: string) => movieInteractionsService.addToWatchlist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });

  // Remove from watchlist
  const { mutate: removeFromWatchlist } = useMutation({
    mutationFn: (id: string) => movieInteractionsService.removeFromWatchlist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });

  const toggleWatchlist = (id: string) => {
    const movieInList = watchlistData?.data.data.some((item) => item.movieId === id);
    if (movieInList) {
      removeFromWatchlist(id);
    } else {
      addToWatchlist(id);
    }
  };

  return {
    watchlist: watchlistData?.data.data || [],
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
  };
};
```

### Watchlist Button Component

```typescript
// src/components/movie/WatchlistButton.tsx
import { useWatchlist } from '../../hooks/useWatchlist';

interface WatchlistButtonProps {
  movieId: string;
}

export const WatchlistButton = ({ movieId }: WatchlistButtonProps) => {
  const { isInWatchlist, toggleWatchlist } = useWatchlist(movieId);

  return (
    <button
      onClick={() => toggleWatchlist(movieId)}
      className={`watchlist-btn ${isInWatchlist ? 'added' : ''}`}
    >
      {isInWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist'}
    </button>
  );
};
```

---

## History & Continue Watching

### Custom Hooks

```typescript
// src/hooks/useWatchHistory.ts
import { useQuery } from '@tanstack/react-query';
import { movieInteractionsService } from '../services/movieInteractions.service';

export const useWatchHistory = (limit = 20) => {
  const { data, isLoading } = useQuery({
    queryKey: ['watchHistory', limit],
    queryFn: () => movieInteractionsService.getWatchHistory(limit),
  });

  return {
    history: data?.data.data || [],
    isLoading,
  };
};
```

```typescript
// src/hooks/useContinueWatching.ts
import { useQuery } from '@tanstack/react-query';
import { movieInteractionsService } from '../services/movieInteractions.service';

export const useContinueWatching = (limit = 10) => {
  const { data, isLoading } = useQuery({
    queryKey: ['continueWatching', limit],
    queryFn: () => movieInteractionsService.getContinueWatching(limit),
  });

  return {
    continueWatching: data?.data.data || [],
    isLoading,
  };
};
```

### Continue Watching Carousel

```typescript
// src/components/home/ContinueWatchingCarousel.tsx
import { useContinueWatching } from '../../hooks/useContinueWatching';
import { MovieCard } from '../movie/MovieCard';

export const ContinueWatchingCarousel = () => {
  const { continueWatching, isLoading } = useContinueWatching();

  if (isLoading) return <div>Loading...</div>;
  if (continueWatching.length === 0) return null;

  return (
    <section className="continue-watching">
      <h2 className="text-2xl font-bold mb-4">Continue Watching</h2>
      <div className="carousel flex gap-4 overflow-x-auto">
        {continueWatching.map((interaction) => (
          <div key={interaction._id} className="movie-card-wrapper">
            <MovieCard movieId={interaction.movieId} />
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${interaction.watchProgress}%` }}
              />
            </div>
            <span className="progress-text">
              {interaction.watchProgress?.toFixed(0)}% watched
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
```

---

## Complete Examples

### Movie Detail Page

```typescript
// src/pages/movie/MovieDetailPage.tsx
import { useParams } from 'react-router-dom';
import { VideoPlayer } from '../../components/movie/VideoPlayer';
import { RatingStars } from '../../components/movie/RatingStars';
import { WatchlistButton } from '../../components/movie/WatchlistButton';

export const MovieDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) return <div>Movie not found</div>;

  return (
    <div className="movie-detail">
      <VideoPlayer movieId={id} src={`/api/v1/stream/${id}`} />

      <div className="movie-info">
        <div className="actions flex gap-4 my-4">
          <WatchlistButton movieId={id} />
        </div>

        <div className="rating-section">
          <h3>Rate this movie</h3>
          <RatingStars movieId={id} />
        </div>
      </div>
    </div>
  );
};
```

### Home Page with Continue Watching

```typescript
// src/pages/home/HomePage.tsx
import { ContinueWatchingCarousel } from '../../components/home/ContinueWatchingCarousel';

export const HomePage = () => {
  return (
    <div className="home-page">
      <ContinueWatchingCarousel />

      {/* Other sections */}
    </div>
  );
};
```

---

## Best Practices

1. **Debounce Progress Updates**: Don't send updates on every timeupdate event
2. **Handle Offline**: Queue progress updates if user is offline
3. **Error Handling**: Show toast notifications for failed saves
4. **Optimistic Updates**: Update UI before server response for better UX
5. **Cleanup**: Always save progress before component unmounts
6. **Memory Leaks**: Remove all event listeners in cleanup functions

## Testing Tips

- Mock the video element in tests
- Test progress save on unmount
- Test resume from saved position
- Test rating validation (1-10)
- Test watchlist toggle behavior
