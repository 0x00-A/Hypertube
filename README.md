# 🎬 Hypertube
**A Web App for the 21st Century**

Hypertube is a high-performance video streaming platform that aggregates external torrent data and streams video content directly to the browser. Unlike traditional clients, Hypertube handles downloading and transcoding simultaneously on the server, allowing for instant playback of heavy video files without waiting for a full download.

> **Note:** This project was built strictly without the use of "plug-and-play" streaming libraries like `webtorrent`, `pulsar`, or `peerflix`. The streaming engine and buffer management were built from scratch for educational purposes.

## ✨ Key Features

### 🔐 Authentication & Security
* **Multiple Strategies:** Secure login via username/password and OmniAuth (42 School, Google/GitHub).
* **Security First:** Passwords are hashed (never plain text), and all forms are protected against SQL injections and XSS attacks.
* **Profile Management:** Users can edit profiles, upload avatars, and view other user profiles while maintaining email privacy.

### 🕵️‍♂️ Smart Library
* **Aggregated Search:** Queries multiple external APIs (YTS, PopcornTime, etc.) simultaneously to build a unified movie catalog.
* **Advanced Filtering:** Sort by genre, rating, production year, and name.
* **Infinite Scroll:** Seamlessly loads more results as the user scrolls.
* **Watched Status:** Visually distinguishes between watched and unwatched content.

### ⚡ The Streaming Engine
* **Real-Time Transcoding:** Converts incompatible formats (like `.mkv`) to HTML5-friendly streams (WebM/MP4) on the fly using FFmpeg.
* **Background Processing:** Downloads continue in the background non-blockingly.
* **Smart Caching:** Downloaded movies are stored on the server for future viewing and automatically deleted if unwatched for one month.
* **Subtitle Integration:** Automatically downloads English subtitles and subtitles matching the user's preferred language if available.

### 🌐 RESTful API
* A fully documented API allows external clients to fetch movie metadata and user comments.

## 🛠️ Technology Stack

* **Frontend:** React (TypeScript), CSS Modules/Tailwind.
* **Backend:** Node.js (Express).
* **Database:** MongoDB (Metadata & User Data).
* **Streaming:** `torrent-stream` (Low-level protocol), `fluent-ffmpeg`.
* **DevOps:** Docker, Docker Compose.

## 🚀 Installation & Setup

**Prerequisites:**
* Docker & Docker Compose
* Node.js (for local development)

### 1. Clone the Repository
```bash
git clone https://github.com/0x00-A/hypertube.git
cd hypertube
```

### 2. Environment Configuration ⚠️

You must create a `.env` file in both the client and server directories.

**Server `.env` example:**
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://admin:password@mongo:27017/hypertube?authSource=admin
ENABLE_REQUEST_LOGGING=true
JWT_ACCESS_SECRET=your-access-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=30d
```

### 3. Run with Docker

The entire application (Frontend, Backend, Database) is containerized.

```bash
# Start all services
make dev

# Or start server only
make server

# Stop services
make down
```

Access the application at `http://localhost:3000` (client) and `http://localhost:3001` (server).

### 4. Makefile Commands

```bash
# Development
make dev              # Start all services in development mode
make server           # Start server services only
make down-server      # Stop server services

# Testing
make test             # Run all tests (client + server)
make test-server      # Run server tests in Docker

# Linting
make lint             # Run linting on both client and server
make lint-server      # Run server linting in Docker

# Logs
make logs-server      # View server app logs only
make logs-server-all  # View all server container logs
```

## 🧪 Running Tests

This project adheres to strict coding standards. No console errors or warnings are permitted.

```bash
# Run all tests
make test

# Run server tests in Docker (recommended)
make test-server

# Run specific test file
cd server && npm test -- --testPathPattern=auth.test.ts
```

### Test Coverage
- **Authentication Tests:** 23 integration tests
  - Signup validation, security, and error handling
  - Login authentication, JWT cookies, and session management

## 📚 API Documentation

The API is documented using Swagger/OpenAPI 3.1.0. Access the interactive documentation:

```
http://localhost:3001/api-docs
```

### Authentication Endpoints

**POST** `/v1/auth/signup`
- Register a new user
- Returns user data and sets JWT cookies

**POST** `/v1/auth/login`
- Authenticate user with username or email
- Returns user data and sets JWT cookies (HttpOnly, SameSite=Strict)

## 👥 Authors

  * **Mehdi** - *Auth, Architecture & DevOps*
  * **Hamza** - *Streaming Engine & Transcoding*
  * **Abdelatif** - *API, Scraper & Data Aggregation*
  * **Rachid** - *Frontend Interface & Player Experience*

## ⚖️ Disclaimer

This application is for educational purposes only. It demonstrates the ability to handle large data streams and complex backend logic. The developers do not endorse piracy.
