# Hypertube Movie Search API Integration Guide

This guide explains how to integrate the `/api/v1/movies/search` endpoint from the Hypertube backend into your client application. It covers query parameters, request/response formats, error handling, and best practices for building a robust movie search UI.

---

## Endpoint Overview

**URL:** `/api/v1/movies/search`
**Method:** `GET`
**Purpose:** Search for movies by title, genre, year, rating, and more. Results are aggregated from both the local database and external providers (e.g., YTS).

---

## Query Parameters

| Name        | Type    | Required | Default | Description                                    |
| ----------- | ------- | -------- | ------- | ---------------------------------------------- |
| `search`    | string  | Yes      | —       | Search by movie title or synopsis (min 1 char) |
| `page`      | integer | No       | 1       | Page number for pagination                     |
| `limit`     | integer | No       | 20      | Number of items per page (max 100)             |
| `sortOrder` | string  | No       | desc    | Sort order: `asc` or `desc`                    |
| `sortBy`    | string  | No       | —       | Sort field: `title`, `year`, `rating`          |
| `genre`     | string  | No       | —       | Filter by genre (e.g., Action, Drama)          |
| `minRating` | integer | No       | —       | Minimum IMDb rating (0–10)                     |
| `year`      | integer | No       | —       | Filter by release year (1900–2026)             |

**Example Request:**

```
GET /api/v1/movies/search?search=matrix&genre=Action&minRating=7&page=1&limit=20&sortBy=year&sortOrder=desc
```

---

## Response Format

**Success (200):**

```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "imdbId": "tt0133093",
      "title": "The Matrix",
      "year": 1999,
      "rating": 8.7,
      "duration": 136,
      "synopsis": "A computer hacker learns from mysterious rebels...",
      "genres": ["Action", "Sci-Fi"],
      "originalLanguage": "en",
      "trailer": "https://www.youtube.com/watch?v=vKQi3bBA1y8",
      "images": {
        "thumbnail": "https://image.tmdb.org/t/p/w500/thumbnail.jpg",
        "poster": "https://image.tmdb.org/t/p/original/poster.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/backdrop.jpg"
      },
      "torrents": [
        {
          "url": "magnet:?xt=urn:btih:...",
          "hash": "...",
          "quality": "1080p",
          "type": "mp4",
          "videoCodec": "x264",
          "seeds": 150,
          "peers": 45,
          "size": "1.4 GB",
          "sizeBytes": 1503238553,
          "provider": "YTS"
        }
      ],
      "downloadStatus": "not_downloaded",
      "lastWatched": null,
      "localPath": null,
      "lastUpdated": "2025-12-08T10:00:00Z"
    }
    // ...more movies
  ]
}
```

**Notes:**

- Fields like `rating`, `duration`, `trailer`, `backdrop`, and `lastWatched` may be `null` or `0` if unavailable.
- The `torrents` array contains available sources for streaming/downloading.
- Images are provided in multiple sizes for UI flexibility.

---

## Error Responses

**Validation Error (400):**

```json
{
  "status": "fail",
  "message": "Invalid query parameters",
  "path": "/api/v1/movies/search",
  "validationErrors": [
    { "path": "search", "message": "search is required and must be between 1 and 255 characters" },
    { "path": "year", "message": "year must be between 1900 and 2026" }
  ]
}
```

**Internal Server Error (500):**

```json
{
  "status": "error",
  "message": "Internal server error",
  "path": "/api/v1/movies/search"
}
```

---

## UI Integration Tips

- **Search Bar:** Always require a non-empty search string.
- **Filters:** Use dropdowns for year/genre, slider for rating, and toggles for sort order.
- **Pagination:** Use infinite scroll or paginated controls; backend supports `page` and `limit`.
- **Error Handling:** Display validation errors to users (e.g., invalid year/rating).
- **Loading State:** Show a spinner or skeleton while waiting for results.
- **Empty State:** If `data` is empty, show a friendly message ("No movies found").
- **Images:** Use `thumbnail` for lists, `poster`/`backdrop` for detail views.
- **Torrents:** Display available qualities and providers; allow users to select preferred source.
- **Null/Zero Fields:** Handle `null` or `0` for duration, rating, trailer gracefully in UI.

---

## Example Integration (React + TanStack Query)

```typescript
import { useQuery } from '@tanstack/react-query';

function useMovieSearch(params) {
  return useQuery(['movies', params], async () => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`/api/v1/movies/search?${query}`);
    if (!res.ok) throw await res.json();
    return await res.json();
  });
}
```

---

## Best Practices

- Always validate user input before sending requests.
- Use debouncing for search input to avoid excessive requests.
- Handle all error cases and show user-friendly messages.
- Respect pagination and limit for performance.
- Never expose internal API keys or secrets in client code.

---

## Further Reading

- See `SEARCH_FILTERS.md` for recommended filter UI controls.
- See `swagger.yaml` for full API documentation and schema details.

---

If you have questions or need more examples, contact the backend team!
