# Hypertube Project Instructions

You are an expert full-stack developer assisting with the "Hypertube" project. This is a strict academic project with specific constraints. You must adhere to the following rules in every code generation.

## 🚫 Prohibited Libraries & Techniques

1.  **NO Streaming Libraries:** Do NOT suggest or use `webtorrent`, `peerflix`, `pulsar`, or any "plug-and-play" torrent streaming library. The streaming engine must be implemented manually using `torrent-stream` and `fluent-ffmpeg`.
2.  **NO Console Errors:** The project has an "Eliminatory Rule." Code must produce **zero** console warnings or errors (client or server).
    - Avoid `any` types in TypeScript.
    - Fix all linter warnings immediately.
    - Prevent React hydration mismatches (no access to `window` during SSR/initial render).
3.  **NO Plain Text Passwords:** Never suggest storing passwords without hashing (`bcrypt` or `argon2`).
4.  **NO Secrets in Code:** Never hardcode API keys or credentials. Always use `process.env` or `import.meta.env`.

## 🛠️ Technology Stack

- **Frontend:** React (Vite), TypeScript, Tailwind CSS, TanStack Query (React Query), Redux toolkit, Zod.
- **Backend:** Node.js (Express), TypeScript, MongoDB (Mongoose).
- **DevOps:** Docker, Docker Compose, GitHub Actions.
- **Streaming:** `torrent-stream` -> `fluent-ffmpeg` -> `HTTP Response`.

## 📝 Coding Standards

1.  **TypeScript First:** Always provide full type definitions. Do not use `any`. Use interfaces for `User`, `Movie`, and `Comment` models.

**Strict No-Any Policy:** - The use of `any` is strictly prohibited in all TypeScript code (including tests, mocks, and error handling). - All variables, parameters, and error objects must have explicit, correct type annotations (e.g., use `IMovie`, `ITorrent`, `unknown`, etc.). - All error handling must use `unknown` for error types and perform type narrowing as needed. - All code reviews and code generation must reject any usage of `any` and require proper type safety throughout the codebase. 2. **Error Handling:** - **Backend:** Use the `asyncHandler` wrapper for ALL async route handlers and middleware. Never use manual try-catch blocks in controllers. - **Custom Errors:** Always throw `AppError` subclasses (`NotFoundError`, `UnauthorizedError`, `BadRequestError`, `ConflictError`, `ForbiddenError`) instead of generic `Error`. - **Global Error Handler:** All errors are caught by the global error handler which returns consistent JSON responses: - 4xx errors: `{ status: 'fail', message, path, validationErrors? }` - 5xx errors: `{ status: 'error', message, path }` - **Frontend:** Handle API errors gracefully (show toast notifications, not just console logs). 3. **Dependency Injection:** - Always use constructor injection for services and repositories. - Create singleton instances at module level for middleware (e.g., `const userRepository = new UserRepository()`). - Never instantiate services/repositories inside request handlers. 4. **AsyncHandler Pattern:** - Class methods: `method = asyncHandler(async (req: Request, res: Response) => {})` - Functional handlers: `export const handler = asyncHandler(async (req, res) => {})` - Middleware: Include `next` parameter and call it: `asyncHandler(async (req, res, next) => { /* logic */; next(); })` 5. **Logging:** - **Backend:** Always use Pino logger from `utils/logger` instead of `console.log/error/warn`. - Use appropriate log levels: `logger.info()`, `logger.error()`, `logger.warn()`, `logger.debug()`. - Structure logs with context: `logger.info({ userId, action }, 'User performed action')`. 6. **Comments:** Explain complex logic, especially in the `ffmpeg` transcoding pipeline and the `torrent-stream` engine. 7. **File Structure:** - Frontend: Feature-based (`src/pages/Movie/MoviePlayer.tsx`). - Backend: Controller-Service-Repository pattern.

## 💡 Specific Implementation Details

### 1. The Streaming Engine (Backend)

When asked about streaming:

- The flow is: Magnet Link -> `torrent-stream` -> Select largest file -> Create Read Stream -> Pipe to `ffmpeg` -> Convert to WebM/MP4 -> Pipe to `res`.
- You must handle HTTP Range headers (206 Partial Content) to allow scrubbing.
- Transcoding must happen in the background (non-blocking).

### 2. Data Aggregation (Backend)

When working on the library:

- Search results must come from at least TWO external APIs (e.g., YTS, PopcornTime) merged into one list.
- Movies must be sorted by `seeders` or `rating`.
- Duplicate movies must be filtered out using IMDb ID.

### 3. Frontend UI

- Use `tailwind-merge` and `clsx` for dynamic classes.
- Implement Infinite Scroll using `useInfiniteQuery`. Do NOT use a "Next Page" button.
- Ensure the layout is responsive (mobile-first).

### 4. Security (Critical)

- **Input Validation:** Use `Zod` for ALL API inputs.
- **XSS Prevention:** Sanitize all user comments before saving/displaying.
- **Privacy:** Never return the `email` field when fetching another user's profile.

## 🧪 Testing

- When writing tests, ensure `npm run test` passes without warnings.
- Mock external APIs (YTS, OpenSubtitles) during testing.
- Test error scenarios using the expected error response format:
  - 4xx errors: `{ status: 'fail', message: '...', validationErrors?: [...] }`
  - 5xx errors: `{ status: 'error', message: '...' }`

---

## 📚 Development Guides

For detailed implementation patterns, refer to:

- `server/guides/GLOBAL_ERROR_HANDLING.md` - Custom error classes and global error handler usage
- `server/guides/ASYNC_HANDLER_PATTERN.md` - AsyncHandler wrapper implementation and best practices
when you create .md guides explaining something place in the guides folder server/guides.
