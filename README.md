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

### 2\. Environment Configuration ⚠️

You must create a `.env` file in the root directory.

```bash
# Example .env structure
PORT=3000
DB_HOST=mongo
DB_NAME=hypertube
JWT_SECRET=your_super_secure_secret
# OAuth Credentials
FORTY_TWO_UID=...
FORTY_TWO_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

### 3\. Run with Docker

The entire application (Frontend, Backend, Database) is containerized.

```bash
docker-compose up --build
```

Access the application at `http://localhost:3000`.

## 🧪 Running Tests

This project adheres to strict coding standards. No console errors or warnings are permitted.

```bash
# Run backend tests
npm run test:backend

# Run frontend tests
npm run test:frontend
```

## 👥 Authors

  * **Mehdi** - *Auth, Architecture & DevOps*
  * **Hamza** - *Streaming Engine & Transcoding*
  * **Abdelatif** - *API, Scraper & Data Aggregation*
  * **Rachid** - *Frontend Interface & Player Experience*

## ⚖️ Disclaimer

This application is for educational purposes only. It demonstrates the ability to handle large data streams and complex backend logic. The developers do not endorse piracy.
