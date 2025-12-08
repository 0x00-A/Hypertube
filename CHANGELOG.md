# Changelog

## [Unreleased]

### Added
- (@0x00a) Initial project setup with Docker Compose.
- (@driver) User authentication system with signup and login endpoints
  - POST /v1/auth/signup - User registration with validation
  - POST /v1/auth/login - User authentication with JWT tokens
  - Password hashing using Argon2
  - JWT token generation with access and refresh tokens
  - Secure cookie-based token storage (HttpOnly, SameSite=Strict)
- Comprehensive integration tests for authentication (22 tests)
  - 11 signup tests covering validation, security, and error handling
  - 12 login tests covering authentication, cookies, and security
- OpenAPI/Swagger documentation for authentication endpoints
- MongoDB integration with Mongoose ODM
- Repository-Service-Controller architecture pattern
- Input validation using Zod schemas
- TypeScript configuration for both src and tests directories
- Makefile commands for Docker-based testing and linting
  - `make test-server` - Run tests in Docker
  - `make lint-server` - Run linting in Docker

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
