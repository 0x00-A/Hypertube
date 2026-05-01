# Hypertube

![Hypertube Demo](./.github/assets/leetflex.gif)

A full-stack video streaming platform. Aggregates torrent metadata from external sources, streams video directly to the browser with real-time FFmpeg transcoding for non-native formats, and handles[...] 

> Built without plug-and-play streaming libraries (no webtorrent, peerflix, etc.) — the torrent engine and streaming pipeline were implemented from scratch.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + TypeScript, Vite |
| Backend | Node.js, Express |
| Database | MongoDB |
| Streaming | `torrent-stream`, `fluent-ffmpeg` |
| Auth | JWT (httpOnly cookies), Passport.js (Google, 42 OAuth) |
| DevOps | Docker, Docker Compose |

## Setup

### Prerequisites
- Docker & Docker Compose

### 1. Clone

```bash
git clone https://github.com/0x00-A/hypertube.git
cd hypertube
```

### 2. Environment

Create `server/.env`:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://admin:password@mongo:27017/hypertube?authSource=admin

JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=30d

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/oauth/google/callback

FORTYTWO_CLIENT_ID=
FORTYTWO_CLIENT_SECRET=
FORTYTWO_CALLBACK_URL=http://localhost:3000/api/v1/oauth/42/callback

CLIENT_URL=http://localhost:5173

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

TMDB_API_KEY=
TMDB_ACCESS_TOKEN=
OPENSUBTITLES_API_KEY=

DOWNLOADS_DIR=./downloads
```

Create `client/.env`:

```env
VITE_API_URL=/api/v1
```

### 3. Run

```bash
make          # build and start everything
make down     # stop
make logs     # follow logs
```

Frontend at `http://localhost:8080` · API at `http://localhost:8080/api/v1` · Swagger at `http://localhost:8080/api-docs`

## Makefile

```bash
make              # start all services (client + server + mongo)
make down         # stop all services
make logs         # stream all logs
make logs-server  # tail server container logs
make logs-client  # tail client container logs
make lint         # lint client + server
make clean        # stop + prune all docker resources
```

## Features

- **Auth** — local signup with email verification, password reset, Google & 42 OAuth
- **Library** — aggregated movie catalog with filtering, infinite scroll, watchlist
- **Streaming** — HTTP range requests for native formats, FFmpeg transcoding for `.mkv`/`.avi` etc.
- **Subtitles** — auto-downloaded in English + the user's preferred language (OpenSubtitles)
- **Watch progress** — resumes from last position, marks movies as watched
- **Comments & ratings** — per-movie discussion and user ratings
- **Cache management** — downloaded files auto-deleted after 1 month of inactivity

## API Docs

Interactive Swagger UI available at `http://localhost:8080/api-docs` when the server is running.

---

*For educational purposes only. The developers do not endorse piracy.*
