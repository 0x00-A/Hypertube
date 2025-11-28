# 🎬 Hypertube

[cite\_start]**A Web App for the 21st Century [cite: 2]**

Hypertube is a high-performance video streaming platform that aggregates external torrent data and streams video content directly to the browser. [cite\_start]Unlike traditional clients, Hypertube handles downloading and transcoding simultaneously on the server, allowing for instant playback of heavy video files without waiting for a full download[cite: 11, 12].

> [cite\_start]**Note:** This project was built strictly without the use of "plug-and-play" streaming libraries like `webtorrent`, `pulsar`, or `peerflix`[cite: 19]. [cite\_start]The streaming engine and buffer management were built from scratch for educational purposes[cite: 18].

## ✨ Key Features

### 🔐 Authentication & Security

  * [cite\_start]**Multiple Strategies:** Secure login via username/password and OmniAuth (42 School, Google/GitHub)[cite: 40, 41].
  * [cite\_start]**Security First:** Passwords are hashed (never plain text) [cite: 28][cite\_start], and all forms are protected against SQL injections and XSS attacks[cite: 29, 31].
  * [cite\_start]**Profile Management:** Users can edit profiles, upload avatars, and view other user profiles while maintaining email privacy [cite: 47-49].

### 🕵️‍♂️ Smart Library

  * [cite\_start]**Aggregated Search:** Queries multiple external APIs (YTS, PopcornTime, etc.) simultaneously to build a unified movie catalog[cite: 10, 60].
  * [cite\_start]**Advanced Filtering:** Sort by genre, rating, production year, and name[cite: 69].
  * [cite\_start]**Infinite Scroll:** Seamlessly loads more results as the user scrolls[cite: 67].
  * [cite\_start]**Watched Status:** Visually distinguishes between watched and unwatched content[cite: 66].

### ⚡ The Streaming Engine

  * [cite\_start]**Real-Time Transcoding:** Converts incompatible formats (like `.mkv`) to HTML5-friendly streams (WebM/MP4) on the fly using FFmpeg[cite: 84, 85].
  * [cite\_start]**Background Processing:** Downloads continue in the background non-blockingly[cite: 79].
  * [cite\_start]**Smart Caching:** Downloaded movies are stored on the server for future viewing and automatically deleted if unwatched for one month[cite: 80, 81].
  * [cite\_start]**Subtitle Integration:** Automatically downloads English subtitles and subtitles matching the user's preferred language if available[cite: 82, 83].

### 🌐 RESTful API

  * [cite\_start]A fully documented API allows external clients to fetch movie metadata and user comments[cite: 87].

## 🛠️ Technology Stack

  * **Frontend:** React (TypeScript), CSS Modules/Tailwind.
  * **Backend:** Node.js (Express/NestJS).
  * **Database:** MongoDB (Metadata & User Data).
  * **Streaming:** `torrent-stream` (Low-level protocol), `fluent-ffmpeg`.
  * **DevOps:** Docker, Docker Compose.

## 🚀 Installation & Setup

**Prerequisites:**

  * Docker & Docker Compose
  * Node.js (for local development)

### 1\. Clone the Repository

```bash
git clone https://github.com/your-username/hypertube.git
cd hypertube
```

### 2\. Environment Configuration ⚠️

You must create a `.env` file in the root directory.
[cite\_start]**Important:** Never commit credentials to Git[cite: 32].

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

This project adheres to strict coding standards. [cite\_start]No console errors or warnings are permitted[cite: 141].

```bash
# Run backend tests
npm run test:backend

# Run frontend tests
npm run test:frontend
```

## 👥 Authors

  * **[Dev 1 Name]** - *Auth, Architecture & DevOps*
  * **[Dev 2 Name]** - *Streaming Engine & Transcoding*
  * **[Dev 3 Name]** - *API, Scraper & Data Aggregation*
  * **[Dev 4 Name]** - *Frontend Interface & Player Experience*

## ⚖️ Disclaimer

This application is for educational purposes only. It demonstrates the ability to handle large data streams and complex backend logic. The developers do not endorse piracy.
