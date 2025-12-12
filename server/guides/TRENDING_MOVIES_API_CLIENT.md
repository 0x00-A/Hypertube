Using "Codebase"

Read [](file:///c%3A/Users/abdel/Desktop/Hypertube/server/src/interfaces/movie.interface.ts#1-1), lines 1 to 80

Read [](file:///c%3A/Users/abdel/Desktop/Hypertube/server/src/routes/v1/movies.routes.ts)

Read [](file:///c%3A/Users/abdel/Desktop/Hypertube/server/src/controllers/movie.controller.ts#1-1), lines 1 to 80

Read [](file:///c%3A/Users/abdel/Desktop/Hypertube/server/src/services/movie.service.ts#1-1), lines 1 to 80

Read [](file:///c%3A/Users/abdel/Desktop/Hypertube/server/src/services/movie.service.ts#81-81), lines 81 to 160

Read [](file:///c%3A/Users/abdel/Desktop/Hypertube/server/src/core/errors/customErrors.ts#1-1), lines 1 to 40

Read [](file:///c%3A/Users/abdel/Desktop/Hypertube/server/src/core/errors/customErrors.ts#41-41), lines 41 to 50

Read [](file:///c%3A/Users/abdel/Desktop/Hypertube/server/src/repositories/movie.repository.ts#1-1), lines 1 to 80

Read [](file:///c%3A/Users/abdel/Desktop/Hypertube/server/src/services/movie.service.ts#161-161), lines 161 to 213

I've gathered all the relevant interfaces, error types, and endpoint details. Here’s a comprehensive integration guide for frontend developers working with the trending movies endpoint:

---

# Frontend Integration Guide: Trending Movies Endpoint

## 1. Endpoint Overview

- **Trending Movies List:**
  `GET /v1/movies/trending`
  Returns a paginated list of trending movies from the TMDB API, normalized for the frontend.

- **Movie Details by TMDB ID:**
  `GET /v1/movies/tmdb/:tmdbId`
  Returns full details for a movie, including streaming torrents if available.

## 2. Response Interface

### Trending Movies List Response

```typescript
interface TrendingMovieListResponse {
  data: TrendingMovieItem[];
  pagination: {
    page: number;
    total: number;
    totalPages: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface TrendingMovieItem {
  tmdbId: number;
  title: string;
  year: number;
  rating: string; // e.g. "7.2"
  originalLanguage: string;
  images: {
    thumbnail: string;
    // poster?: string;
    // backdrop?: string;
  };
  isLocal: boolean; // true if movie is in our DB, false if only from TMDB
}
```

### Not Found Error (for details endpoint)

```typescript
interface NotFoundErrorResponse {
  status: 'fail';
  message: string; // e.g. "Movie not found"
  path: string;
}
```

### Movie Details Response (for `/movies/tmdb/:tmdbId`)

```typescript
interface MovieDetailsResponse {
  data: MovieDetails;
}

interface MovieDetails {
  imdbId: string;
  tmdbId: number | null;
  title: string;
  year: number;
  rating?: number | null;
  duration?: number | null;
  synopsis?: string;
  genres?: string[];
  originalLanguage?: string;
  trailer?: string;
  images: {
    thumbnail: string;
    poster: string;
    backdrop: string;
  };
  torrents: Torrent[];
  downloadStatus: 'not_downloaded' | 'downloading' | 'downloaded';
  lastWatched?: Date;
  localPath?: string;
  lastUpdated: Date;
}

interface Torrent {
  url: string;
  hash: string;
  quality: string;
  type?: string;
  videoCodec?: string;
  seeds: number;
  peers: number;
  size: string;
  sizeBytes: number;
  provider?: string;
}
```

## 3. Key Integration Considerations

### a. External Data & `isLocal` Field

- The trending endpoint returns movies from TMDB, not all of which are in your local database.
- Each movie has an `isLocal` boolean:
  - `true`: Movie exists in your DB (details and streaming may be available).
  - `false`: Movie is only from TMDB (details may take 2–3 seconds to fetch).

### b. Loading State for Non-Local Movies

- When a user selects a trending movie with `isLocal: false`, you **must**:
  - Show a loading screen or spinner (fetching details can take 2–3 seconds).
  - Display a message like “Waiting for resource…” while details are being fetched.

### c. Fetching Movie Details

- Use `GET /v1/movies/tmdb/:tmdbId` to fetch full details for any trending movie.
- If the movie is not found, handle the `NotFoundErrorResponse` and show an appropriate message.

### d. Streaming Availability

- After fetching details, check the `torrents` array:
  - If `torrents.length === 0`, show a message:
    “This movie is not yet available for streaming.”
  - **Do not** show the video player if there are no torrents.

### e. Error Handling

- Handle 404 errors gracefully (e.g., “Movie not found”).
- Handle network or 502 errors (e.g., “Failed to fetch trending movies from TMDB.”).

## 4. Example Flow

1. Fetch trending movies:
   `GET /v1/movies/trending`
2. Display the list. For each item:
   - If `isLocal: true`, allow immediate navigation to details.
   - If `isLocal: false`, show a loading state when clicked, and fetch details from `/v1/movies/tmdb/:tmdbId`.
3. After details load:
   - If `torrents` is empty, show “Not available for streaming.”
   - If `torrents` exist, show the video player.

---

**Summary:**

- Always check `isLocal` before showing details.
- Use the correct endpoint for details.
- Show loading and “waiting for resource” states for non-local movies.
- Only show the video player if torrents are available.
- Handle errors and empty states gracefully.

---

few additional tips and best practices that could further help frontend developers:

---

### 5. Additional Best Practices & Tips

#### a. Pagination Handling

- The trending endpoint supports pagination. Always use the `pagination` object from the response to implement infinite scroll or next/previous page navigation.
- Example:
  - Use `hasNextPage` and `hasPrevPage` to enable/disable navigation buttons or infinite scroll triggers.
  - Always pass the correct `page` parameter when fetching more results.

#### b. Image Fallbacks

- Some movies may have missing images (`thumbnail`, `poster`, or `backdrop` may be empty strings).
- Always provide a default/fallback image in the UI if any image field is missing or empty.

#### c. Language and Localization

- The `originalLanguage` field is provided. Consider displaying a language badge or tag if the movie is not in the user’s preferred language.

#### d. Accessibility

- When showing loading states or “waiting for resource” messages, ensure these are accessible (e.g., use ARIA roles for spinners, and make sure screen readers can announce status changes).

#### e. Caching and Optimistic UI

- For a smoother UX, consider caching trending results and movie details locally (e.g., with React Query or SWR).
- If a user requests details for a movie that was just fetched, show cached data immediately while updating in the background.

#### f. Error UI Consistency

- Standardize error messages and empty states across the app for a consistent user experience.
- For example, use a common error component for 404, 502, and network errors.

<!-- #### g. Rate Limiting and API Quotas

- TMDB APIs may have rate limits. If you see repeated 502 or 429 errors, inform the user and consider exponential backoff or retry logic. -->

<!-- #### h. Analytics

- Track user interactions with trending movies (e.g., which movies are clicked, how often “waiting for resource” is shown) to help improve backend caching and UX. -->

#### i. Typescript Types

- Use the provided TypeScript interfaces directly in your codebase to ensure type safety and reduce bugs.

#### j. Mobile Responsiveness

- Ensure the trending list, loading states, and error messages are mobile-friendly and responsive.

---
