# Changelog

## [Unreleased]

### Added
- (@0x00a) Initial project setup with Docker Compose.
- (@driver) User authentication system with signup and login endpoints
  - POST /api/v1/auth/signup - User registration with validation
  - POST /api/v1/auth/login - User authentication with JWT tokens
  - POST /api/v1/auth/refresh-token - Refresh access tokens using refresh token
  - Password hashing using Argon2
  - JWT token generation with access and refresh tokens
  - Secure cookie-based token storage (HttpOnly, SameSite=Strict)
- JWT authentication middleware for protected routes
  - Token verification with proper error handling (expired, invalid, not valid yet)
  - Discriminated union type for type-safe result pattern
  - User data attached to request object after successful authentication
- Comprehensive integration tests for authentication (35 tests)
  - 11 signup tests covering validation, security, and error handling
  - 11 login tests covering authentication, cookies, and security
  - 5 refresh-token tests for token renewal
  - 7 auth middleware tests for route protection
  - 1 example test for protected route behavior
- OAuth 2.0 authentication system with Passport.js
  - Google OAuth integration with profile and email scopes
  - 42 School OAuth integration
  - Automatic account linking when email matches existing user
  - Secure random password generation for OAuth users (Argon2 hashing)
  - OAuth callback handlers with JWT token generation
  - Redirect-based authentication flow with error handling
  - GET /api/v1/oauth/google - Initiate Google OAuth
  - GET /api/v1/oauth/google/callback - Handle Google OAuth callback
  - GET /api/v1/oauth/42 - Initiate 42 OAuth
  - GET /api/v1/oauth/42/callback - Handle 42 OAuth callback
- Comprehensive OAuth integration tests (14 tests)
  - OAuth route redirect tests for Google and 42
  - User creation with OAuth providers
  - Existing user account linking
  - Username generation from OAuth profile data
  - Fallback values for missing profile fields
  - Error handling for missing email or profile data
- OpenAPI/Swagger documentation for authentication and OAuth endpoints
- User profile endpoints with privacy controls
  - GET /api/v1/profile/me - Get authenticated user's own profile (includes email)
  - GET /api/v1/profile/:username - Get public user profile by username
  - Username validation (minimum 3 characters, case-insensitive)
  - Email privacy: only exposed when viewing own profile
  - Password and OAuth fields never exposed in any endpoint
  - No authentication required for public profile viewing
- Comprehensive user profile integration tests (25 tests)
  - Authenticated profile access with JWT cookies
  - Public profile viewing without authentication
  - Privacy enforcement (email, password, oauth fields)
  - Username validation and error handling
  - Edge cases (special characters, whitespace, case sensitivity)
- MongoDB integration with Mongoose ODM
- Repository-Service-Controller architecture pattern
- Input validation using Zod schemas
- TypeScript configuration for both src and tests directories
- Makefile commands for Docker-based testing and linting
  - `make test-server` - Run tests in Docker
  - `make lint-server` - Run linting in Docker
- Secure password handling with Mongoose `select: false`
  - Password field excluded from queries by default
  - Explicit selection only when needed for authentication

### Changed
- Updated tsconfig.json to include tests directory and Jest types
- Fixed package.json syntax errors (trailing comma)

### Security
- Passwords hashed with Argon2 before storage
- JWT tokens stored in httpOnly cookies to prevent XSS
- SameSite=Strict cookie attribute to prevent CSRF
- Input sanitization (whitespace trimming)
- Generic error messages to prevent user enumeration
- Password never exposed in API responses

## [0.1.0] - 2025-09-15
