# Movie State Flags API Documentation

## Overview

All movie list and detail endpoints now support **optional authentication** to include user-specific state flags (`isWatched`, `inWatchlist`, `userRating`) in the response. This allows the frontend to show personalized indicators on movie thumbnails without additional API calls.

---

## Supported Endpoints

### Public Endpoints (Optional Auth)

These endpoints work without authentication but provide enhanced data when a valid access token is present:

| Endpoint                          | Description            | Auth     | State Flags |
| --------------------------------- | ---------------------- | -------- | ----------- |
| `GET /api/v1/movies`              | List all movies        | Optional | ✅          |
| `GET /api/v1/movies/trending`     | Trending movies (TMDB) | Optional | ✅          |
| `GET /api/v1/movies/popular`      | Popular movies (TMDB)  | Optional | ✅          |
| `GET /api/v1/movies/search`       | Search movies          | Optional | ✅          |
| `GET /api/v1/movies/:id`          | Get movie by ID        | Optional | ✅          |
| `GET /api/v1/movies/tmdb/:tmdbId` | Get movie by TMDB ID   | Optional | ✅          |

### Protected Endpoints (Required Auth)

| Endpoint                         | Description        | Auth     | State Flags |
| -------------------------------- | ------------------ | -------- | ----------- |
| `GET /api/v1/movies/recommended` | Recommended movies | Required | ✅          |

---

## Response Structure

### Authenticated User Response

```json
{
  "status": "success",
  "data": {
    "data": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "imdbId": "tt0111161",
        "tmdbId": 278,
        "title": "The Shawshank Redemption",
        "year": 1994,
        "rating": 9.3,
        "synopsis": "Two imprisoned men bond over a number of years...",
        "genres": ["Drama"],
        "images": {
          "thumbnail": "https://...",
          "poster": "https://...",
          "backdrop": "https://..."
        },
        "torrents": [...],
        "isWatched": true,
        "inWatchlist": false,
        "userRating": 9
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "message": "Movies fetched successfully."
  }
}
```

### Unauthenticated User Response

```json
{
  "status": "success",
  "data": {
    "data": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "imdbId": "tt0111161",
        "tmdbId": 278,
        "title": "The Shawshank Redemption",
        "year": 1994,
        "rating": 9.3,
        "synopsis": "Two imprisoned men bond over a number of years...",
        "genres": ["Drama"],
        "images": {
          "thumbnail": "https://...",
          "poster": "https://...",
          "backdrop": "https://..."
        },
        "torrents": [...],
        "isWatched": false,
        "inWatchlist": false,
        "userRating": null
      }
    ],
    "pagination": {...},
    "message": "Movies fetched successfully."
  }
}
```

---

## State Flag Definitions

| Field         | Type             | Description                                                         | Default (Unauthenticated) |
| ------------- | ---------------- | ------------------------------------------------------------------- | ------------------------- |
| `isWatched`   | `boolean`        | `true` if user completed watching this movie (watchProgress >= 90%) | `false`                   |
| `inWatchlist` | `boolean`        | `true` if user added this movie to their watchlist                  | `false`                   |
| `userRating`  | `number \| null` | User's rating for this movie (1-10 scale), or `null` if not rated   | `null`                    |

---

## How State Flags Are Populated

### Backend Flow

1. **Optional Auth Middleware** (`optionalAuth`)
   - Checks for `accessToken` cookie
   - If valid → attaches `req.user` (with `_id`)
   - If invalid/missing → continues without `req.user`

2. **MovieService.addUserMovieState()**
   - Accepts `userId`, `movies`, and `isArray` flag
   - If `userId` is provided:
     - Queries `MovieInteractionRepository.findByUserAndMovies()`
     - Builds an interaction map with state flags
     - Merges state into each movie object
   - If `userId` is `undefined`:
     - Returns movies with default values

3. **Controller Response**
   - Returns movies with state flags (always present, even for unauthenticated users)

---

## Frontend Usage Examples

### React Hook: useMovies

```typescript
// src/hooks/useMovies.ts
import { useQuery } from '@tanstack/react-query';
import { movieService } from '../services/movie.service';

export const useMovies = (filters?: MovieFilters) => {
  return useQuery({
    queryKey: ['movies', filters],
    queryFn: () => movieService.list(filters),
    // No need to check auth status - endpoint handles it
  });
};
```

### Movie Card Component

```typescript
// src/components/movie/MovieCard.tsx
interface MovieCardProps {
  movie: IMovie;
}

export const MovieCard = ({ movie }: MovieCardProps) => {
  return (
    <div className="movie-card">
      <div className="relative">
        <img src={movie.images.thumbnail} alt={movie.title} />

        {/* Overlay badges */}
        <div className="absolute top-2 right-2 flex gap-2">
          {movie.isWatched && (
            <span className="badge bg-green-500">✓ Watched</span>
          )}
          {movie.inWatchlist && (
            <span className="badge bg-blue-500">★ Watchlist</span>
          )}
          {movie.userRating && (
            <span className="badge bg-yellow-500">⭐ {movie.userRating}/10</span>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold">{movie.title}</h3>
        <p className="text-sm text-gray-500">{movie.year}</p>
      </div>
    </div>
  );
};
```

### Conditional Rendering Based on State

```typescript
// src/pages/movie/MovieDetail.tsx
export const MovieDetail = ({ movie }: { movie: IMovie }) => {
  return (
    <div>
      {/* Show "Continue Watching" if partially watched */}
      {movie.isWatched === false && movie.lastWatchedPosition > 0 ? (
        <button>Continue Watching</button>
      ) : movie.isWatched ? (
        <button>Watch Again</button>
      ) : (
        <button>Watch Now</button>
      )}

      {/* Watchlist toggle */}
      <button onClick={() => toggleWatchlist(movie._id)}>
        {movie.inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
      </button>

      {/* Rating display/input */}
      {movie.userRating ? (
        <div>Your rating: {movie.userRating}/10</div>
      ) : (
        <RatingInput movieId={movie._id} />
      )}
    </div>
  );
};
```

---

## Authentication Scenarios

### Scenario 1: User Logs Out

When a user logs out:

- Frontend should clear auth tokens
- Subsequent API calls will return movies with default state flags
- UI should update to remove personalized badges

### Scenario 2: User Logs In

When a user logs in:

- Frontend receives and stores access token
- Subsequent API calls will include state flags
- UI should update to show personalized indicators

### Scenario 3: Token Expiration

When an access token expires:

- `optionalAuth` middleware will silently continue without `req.user`
- Movies will return with default state flags
- Frontend should handle token refresh or prompt re-login

---

## Best Practices

### ✅ Do's

- **Always render state flags** (they're guaranteed to exist)
- **Use visual indicators** (badges, icons, overlays) to show state
- **Handle both authenticated and unauthenticated states** gracefully
- **Cache movie data with React Query** to avoid redundant requests
- **Update local cache** after user interactions (watchlist toggle, rating)

### ❌ Don'ts

- **Don't make separate API calls** to check watch status (use provided flags)
- **Don't assume fields are missing** (they're always present, just with defaults)
- **Don't show personalized UI elements** (like "My Rating") when flags are default
- **Don't ignore state flags** on list views (thumbnails should reflect state)

---

## Testing State Flags

### Integration Tests

See `tests/integration/movie.state.api.test.ts` for examples:

1. **Authenticated User Tests**
   - User with interactions sees correct `isWatched`, `inWatchlist`, `userRating`
   - Multiple movies return different states based on user interactions

2. **Unauthenticated User Tests**
   - No token provided → all movies return default values
   - Invalid token → treated as unauthenticated

3. **Edge Cases**
   - Partially watched movie (progress < 90%) → `isWatched: false`
   - Completed movie (progress >= 90%) → `isWatched: true`
   - Movie in watchlist + rated → both flags set

---

## Related Documentation

- [Frontend Movie Interactions Guide](./FRONTEND_MOVIE_INTERACTIONS.md) - Detailed React implementation
- [Global Error Handling](./GLOBAL_ERROR_HANDLING.md) - Error response structure
- [Async Handler Pattern](./ASYNC_HANDLER_PATTERN.md) - Controller best practices

---

## Changelog

- **2025-12-20**: Initial documentation for movie state flags with optional auth support
