# 🎬 Hypertube
**A Web App for the 21st Century**

Hypertube is a high-performance video streaming platform that aggregates external torrent data and streams video content directly to the browser. Unlike traditional clients, Hypertube handles downloading and transcoding simultaneously on the server, allowing for instant playback of heavy video files without waiting for a full download.

> **Note:** This project was built strictly without the use of "plug-and-play" streaming libraries like `webtorrent`, `pulsar`, or `peerflix`. The streaming engine and buffer management were built from scratch for educational purposes.

## ✨ Key Features

### 🔐 Authentication & Security
* **Multiple Strategies:** Secure login via username/password and OAuth 2.0 (42 School, Google).
* **Email Verification:** New users must verify their email address before logging in. Automated verification emails with secure tokens.
* **Password Reset:** Secure password reset flow with email verification and single-use tokens that expire after 24 hours.
* **Rate Limiting:** Password reset requests limited to 3 per hour per email address to prevent abuse and email bombing attacks.
* **OAuth Integration:** Passport.js-based OAuth with automatic account linking and secure token management. OAuth users are automatically verified.
* **Security First:** Passwords are hashed with Argon2 (never plain text), JWT tokens in httpOnly cookies, and all forms are protected against SQL injections and XSS attacks.
* **Profile Management:** Users can view their own profile, browse other users, and search by username or ID. Email privacy is enforced (only visible to the account owner).

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

# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/oauth/google/callback
FORTYTWO_CLIENT_ID=your-42-client-id
FORTYTWO_CLIENT_SECRET=your-42-client-secret
FORTYTWO_CALLBACK_URL=http://localhost:3001/api/v1/oauth/42/callback
CLIENT_URL=http://localhost:3000

# Email Configuration (for email verification and password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
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
- **Authentication Tests:** 88 integration tests
  - Signup validation, security, and error handling
  - Login authentication, JWT cookies, and session management
  - Email verification with token validation and edge cases
  - Token refresh and protected route middleware
  - Password reset request and token validation (including OAuth user scenarios and rate limiting)
  - Password reset security and edge cases
  - Email verification and password reset interaction tests (token separation)
  - OAuth password reset protection (isPasswordSet flag validation)
  - Rate limiting enforcement and email-based throttling
- **OAuth Tests:** 14 integration tests
  - Google and 42 OAuth flows
  - Account creation and linking
  - Error handling and edge cases
- **User Profile Tests:** 25 integration tests
  - Authenticated and public profile access
  - Privacy controls for email, password, and OAuth fields
  - Username validation and error handling
  - Edge cases and special characters

## 📚 API Documentation

The API is documented using Swagger/OpenAPI 3.1.0. Access the interactive documentation:

```
http://localhost:3001/api-docs
```

### Authentication Endpoints

**POST** `/v1/auth/signup`
- Register a new user
- Sends verification email with token
- User must verify email before logging in

**POST** `/v1/auth/verify-email`
- Verify email address with token from email
- Activates user account (sets isActive to true)
- Sends welcome email after successful verification
- Returns 409 if token is invalid or email already verified

**POST** `/v1/auth/login`
- Authenticate user with username or email
- Returns 409 if email not verified
- Sets JWT cookies (HttpOnly, SameSite=Strict) on success

**POST** `/v1/auth/refresh-token`
- Refresh access token using refresh token cookie
- Returns new access token in httpOnly cookie

**POST** `/v1/auth/request-password-reset`
- Request password reset email
- Sends reset link with secure token to user's email
- Always returns success for security (doesn't reveal if email exists)

**POST** `/v1/auth/reset-password`
- Reset password using token from email
- Token is single-use and expires after 24 hours
- Old password is invalidated after successful reset

### OAuth Endpoints

**GET** `/v1/oauth/google`
- Redirects to Google OAuth consent screen
- Scopes: profile, email

**GET** `/v1/oauth/google/callback`
- Handles Google OAuth callback
- Sets JWT cookies and redirects to client with status

**GET** `/v1/oauth/42`
- Redirects to 42 School OAuth authorization page

**GET** `/v1/oauth/42/callback`
- Handles 42 OAuth callback
- Sets JWT cookies and redirects to client with status

### User Profile Endpoints

**GET** `/v1/profile/me`
- Get authenticated user's profile (requires JWT token)
- Returns user information including email
- Returns 401 if not authenticated

**GET** `/v1/profile/:username`
- Get public user profile by username
- No authentication required
- Email field excluded unless viewing own profile
- Password and OAuth fields never exposed
- Returns 404 if user not found
- Returns 400 for invalid username format

## 👥 Authors

  * **Mehdi** - *Auth, Architecture & DevOps*
  * **Hamza** - *Streaming Engine & Transcoding*
  * **Abdelatif** - *API, Scraper & Data Aggregation*
  * **Rachid** - *Frontend Interface & Player Experience*

## ⚖️ Disclaimer

This application is for educational purposes only. It demonstrates the ability to handle large data streams and complex backend logic. The developers do not endorse piracy.
