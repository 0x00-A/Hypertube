# Streaming Engine Guide

> Manual torrent-to-browser streaming via `torrent-stream` + `fluent-ffmpeg`.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Service Layer — `StreamingService`](#service-layer--streamingservice)
4. [Controller Layer — `StreamingController`](#controller-layer--streamingcontroller)
5. [Routes & Validation](#routes--validation)
6. [Torrent Engine Lifecycle](#torrent-engine-lifecycle)
7. [Transcoding Pipeline](#transcoding-pipeline)
8. [HTTP Range Requests (206)](#http-range-requests-206)
9. [Subtitle Integration](#subtitle-integration)
10. [Environment & Configuration](#environment--configuration)
11. [API Endpoints](#api-endpoints)
12. [Frontend Integration](#frontend-integration)
13. [Common Patterns](#common-patterns)
14. [Anti-Patterns](#anti-patterns)
15. [Quick Reference](#quick-reference)

---

## Overview

The streaming engine converts magnet links into browser-playable video streams **without** using high-level libraries like `webtorrent` or `peerflix`. The stack is:

```
Magnet Link → torrent-stream → select largest file → ffmpeg (if needed) → HTTP Response
```

Key characteristics:

| Aspect          | Detail                                                      |
| --------------- | ----------------------------------------------------------- |
| Torrent library | `torrent-stream` (low-level engine)                         |
| Transcoding     | `fluent-ffmpeg` (MKV/AVI → MP4)                             |
| Range support   | HTTP 206 Partial Content for MP4/WebM                       |
| Subtitle fetch  | Automatic background fetch via `SubtitleService`            |
| Cleanup         | `destroyAll()` on server shutdown; cron for stale downloads |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Client (React)                                        │
│  <video src="/api/v1/stream/:movieId" />               │
└──────────────────────┬──────────────────────────────────┘
                       │  HTTP GET (with Range header)
                       ▼
┌──────────────────────────────────────────────────────────┐
│  StreamingController                                     │
│  - Parses Range headers                                  │
│  - Decides: direct serve vs. transcode                   │
│  - Pipes stream → res                                    │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  StreamingService                                        │
│  - getStreamableFile(movieId) → StreamableFile           │
│  - createTranscodingStream() → Readable (ffmpeg)         │
│  - getStatus(movieId) → download status + subtitles      │
│  - Manages _activeEngines Map<movieId, ActiveEngine>     │
└──────────────────────┬───────────────────────────────────┘
                       │
            ┌──────────┴──────────┐
            ▼                     ▼
    ┌───────────────┐    ┌────────────────┐
    │ torrent-stream│    │ fluent-ffmpeg  │
    │ (download)    │    │ (transcode)    │
    └───────────────┘    └────────────────┘
```

---

## Service Layer — `StreamingService`

**Location:** `src/services/streaming.service.ts`

### Constructor

```typescript
constructor(movieRepository: MovieRepository, subtitleService: SubtitleService)
```

Dependencies are injected via constructor. The service is instantiated once in `src/bootstrap/` and shared across the application.

### Key Types

```typescript
interface ActiveEngine {
  engine: ReturnType<typeof torrentStream>;
  movieId: string;
  file: { name: string; path: string; length: number; createReadStream: Function } | null;
  ready: boolean;
  readyPromise: Promise<void>;
}

interface StreamableFile {
  filePath?: string; // Local disk path (downloaded movies)
  fileSize: number; // Total size in bytes
  mimeType: string; // e.g. "video/mp4"
  needsTranscoding: boolean; // true for .mkv, .avi
  createTorrentStream?: (start?: number, end?: number) => Readable;
  movie: IMovieDocument;
}
```

### Main Methods

| Method                           | Returns                                                 | Description                                          |
| -------------------------------- | ------------------------------------------------------- | ---------------------------------------------------- |
| `getStreamableFile(movieId)`     | `Promise<StreamableFile>`                               | Main entry — checks downloaded → active → new engine |
| `createTranscodingStream(input)` | `Readable`                                              | ffmpeg pipe: input → MP4 H.264/AAC → PassThrough     |
| `getStatus(movieId)`             | `Promise<{downloadStatus, hasActiveEngine, subtitles}>` | Status check without starting a stream               |
| `destroyAll()`                   | `void`                                                  | Shutdown cleanup — destroys all torrent engines      |

### Private Methods

| Method                                       | Description                                                   |
| -------------------------------------------- | ------------------------------------------------------------- |
| `selectTorrent(movie)`                       | Quality priority: 720p → 480p → 1080p → most seeds            |
| `getOrCreateEngine(movie)`                   | Reuses or creates torrent-stream engine, returns ActiveEngine |
| `fetchSubtitlesInBackground(movie, torrent)` | Non-blocking subtitle download after engine ready             |

---

## Controller Layer — `StreamingController`

**Location:** `src/controllers/streaming.controller.ts`

### `stream` handler

Determines how to serve the video based on `needsTranscoding` and the `Range` header:

| Condition                   | Behavior                                           |
| --------------------------- | -------------------------------------------------- |
| `needsTranscoding === true` | Pipe input → ffmpeg → res (chunked, 200)           |
| Range header present        | Parse `bytes=start-end`, serve 206 Partial Content |
| No Range header             | Serve full file with 200, `Accept-Ranges: bytes`   |

### `getStatus` handler

Returns JSON with `downloadStatus`, `hasActiveEngine`, and `subtitles` map.

---

## Routes & Validation

**Location:** `src/routes/v1/streaming.routes.ts`

```typescript
router.get('/:movieId', auth, validate(StreamMovieParamSchema), stream);
router.get('/:movieId/status', auth, validate(StreamMovieParamSchema), getStatus);
```

**Validation schema** (`src/validators/streaming.schema.ts`):

```typescript
const StreamMovieParamSchema = z.object({
  params: z.object({
    movieId: z.string().regex(/^[a-fA-F0-9]{24}$/i, 'Invalid movie ID format'),
  }),
});
```

---

## Torrent Engine Lifecycle

### 1. Engine Creation

When `getStreamableFile()` is called and no active engine exists:

1. `selectTorrent()` picks the best torrent (720p preferred).
2. `getMagnetLinks()` builds the magnet URI from the movie's torrent data.
3. `torrentStream(magnetUri, opts)` starts the engine with:
   - `connections: 100`, `uploads: 10`
   - `verify: true`, `dht: true`, `tracker: true`
   - Download path: `DOWNLOADS_DIR/<movieId>/`

### 2. Engine Ready

On the `ready` event:

1. Select the **largest file** in the torrent (the actual video).
2. `deselect()` all other files to save bandwidth.
3. `select()` the video file.
4. Resolve the `readyPromise` so the controller can start streaming.
5. Trigger `fetchSubtitlesInBackground()`.

### 3. Download Complete

On the `idle` event:

1. Update `movie.downloadStatus = 'downloaded'`.
2. Save `movie.localPath` to the resolved file path.

### 4. Shutdown Cleanup

`destroyAll()` iterates `_activeEngines` and calls `engine.destroy()` on each.

---

## Transcoding Pipeline

For non-browser-playable formats (`.mkv`, `.avi`), `createTranscodingStream()` sets up:

```typescript
ffmpeg(inputStream)
  .outputFormat('mp4')
  .videoCodec('libx264')
  .audioCodec('aac')
  .outputOptions([
    '-preset ultrafast',
    '-tune zerolatency',
    '-movflags frag_keyframe+empty_moov+faststart',
    '-crf 23',
  ])
  .pipe(passthrough);
```

| Option                                         | Purpose                                             |
| ---------------------------------------------- | --------------------------------------------------- |
| `-preset ultrafast`                            | Minimize CPU usage for real-time encoding           |
| `-tune zerolatency`                            | Reduce latency for streaming                        |
| `-movflags frag_keyframe+empty_moov+faststart` | Fragmented MP4 — playback starts before full encode |
| `-crf 23`                                      | Balanced quality/size                               |

**Important:** Transcoded streams do NOT support Range requests. The response uses `Transfer-Encoding: chunked`.

---

## HTTP Range Requests (206)

For browser-playable formats (MP4/WebM), the controller supports seeking:

```
Client:  GET /api/v1/stream/:movieId
         Range: bytes=1048576-2097151

Server:  HTTP/1.1 206 Partial Content
         Content-Range: bytes 1048576-2097151/5242880
         Content-Length: 1048576
         Content-Type: video/mp4
```

### Edge Cases

| Scenario             | Response                                  |
| -------------------- | ----------------------------------------- |
| `start >= fileSize`  | 416 Range Not Satisfiable                 |
| `end >= fileSize`    | 416 Range Not Satisfiable                 |
| `start > end`        | 416 Range Not Satisfiable                 |
| No Range header      | 200 with full file                        |
| Transcoding required | 200 with chunked encoding (Range ignored) |

---

## Subtitle Integration

After a torrent engine becomes ready, subtitles are fetched **in the background**:

```typescript
this._subtitleService.ensureForMovie(movie.imdbId, 'en', torrent);
```

- Uses OpenSubtitles API to find matching subtitles.
- Downloads SRT → converts to VTT → saves to `public/subtitles/`.
- Stored on the movie document's `subtitles` Map field.
- Available via the `/status` endpoint.

---

## Environment & Configuration

| Variable                 | Default       | Description                   |
| ------------------------ | ------------- | ----------------------------- |
| `DOWNLOADS_DIR`          | `./downloads` | Where torrent files are saved |
| `OPEN_SUBTITLES_API_KEY` | —             | OpenSubtitles API key         |
| `OPEN_SUBTITLES_API_URL` | —             | OpenSubtitles base URL        |

Ensure `ffmpeg` is installed in the Docker image (the Dockerfile includes it).

---

## API Endpoints

### `GET /api/v1/stream/:movieId`

Stream video content.

| Header          | Required | Description                    |
| --------------- | -------- | ------------------------------ |
| `Cookie` (auth) | ✅       | Authentication cookies         |
| `Range`         | ❌       | Byte range for partial content |

**Responses:** 200 (full / transcoded), 206 (partial), 400, 401, 404, 416

### `GET /api/v1/stream/:movieId/status`

Check download/streaming status.

**Response body:**

```json
{
  "status": "success",
  "data": {
    "downloadStatus": "downloading",
    "hasActiveEngine": true,
    "subtitles": {
      "en": [{ "language": "English", "label": "English (SRT)", "url": "/subtitles/tt123_en.vtt" }]
    }
  }
}
```

---

## Frontend Integration

The React player uses a standard `<video>` element pointing at the stream endpoint:

```tsx
<video src={`${API_BASE_URL}/api/v1/stream/${movieId}`} controls autoPlay />
```

- The browser automatically sends `Range` headers when seeking.
- Subtitles are loaded as `<track>` elements from the `/status` endpoint URLs.
- The `useStreamingStatus` hook polls the status endpoint to show download progress.

---

## Common Patterns

### ✅ DO: Use dependency injection

```typescript
const streamingService = new StreamingService(movieRepository, subtitleService);
const streamingController = new StreamingController(streamingService);
```

### ✅ DO: Let asyncHandler catch errors

```typescript
stream = asyncHandler(async (req: Request, res: Response) => {
  // Throw AppError subclasses — global handler catches them
  const streamable = await this._streamingService.getStreamableFile(movieId);
});
```

### ✅ DO: Clean up on client disconnect

```typescript
res.on('close', () => {
  readStream.destroy();
});
```

### ✅ DO: Call `destroyAll()` on shutdown

```typescript
process.on('SIGTERM', () => {
  streamingService.destroyAll();
});
```

---

## Anti-Patterns

### ❌ DON'T: Use webtorrent/peerflix

```typescript
// BAD — prohibited by project rules
import WebTorrent from 'webtorrent';
```

### ❌ DON'T: Send Range responses for transcoded streams

```typescript
// BAD — ffmpeg output has no known total size
res.status(206).setHeader('Content-Range', `bytes 0-${end}/${total}`);
```

### ❌ DON'T: Block on subtitle fetch

```typescript
// BAD — subtitles should be non-blocking
await this._subtitleService.ensureForMovie(imdbId, 'en', torrent);
// GOOD — fire and forget with .catch()
this._subtitleService.ensureForMovie(imdbId, 'en', torrent).catch(/* log */);
```

### ❌ DON'T: Forget to deselect unused torrent files

```typescript
// BAD — downloads entire torrent (movies, samples, subtitles, NFO files)
engine.on('ready', () => {
  /* no deselect */
});
```

---

## Quick Reference

| File                                      | Purpose                                            |
| ----------------------------------------- | -------------------------------------------------- |
| `src/services/streaming.service.ts`       | Core engine logic, torrent management, transcoding |
| `src/controllers/streaming.controller.ts` | HTTP handler, Range parsing, stream piping         |
| `src/routes/v1/streaming.routes.ts`       | Route definitions with auth + validation           |
| `src/validators/streaming.schema.ts`      | Zod schema for movieId param                       |
| `src/docs/swagger.streaming.yaml`         | OpenAPI documentation                              |

### Summary

| DO ✅                                  | DON'T ❌                               |
| -------------------------------------- | -------------------------------------- |
| Use `torrent-stream` + `fluent-ffmpeg` | Use `webtorrent`, `peerflix`, `pulsar` |
| Handle Range headers for MP4/WebM      | Send Range for transcoded streams      |
| Clean up streams on `res.close`        | Leave dangling streams                 |
| Deselect non-video torrent files       | Download entire torrent contents       |
| Fetch subtitles in background          | Block stream on subtitle download      |
| Call `destroyAll()` on shutdown        | Leave engines running                  |
