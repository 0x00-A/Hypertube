## Description


## ✅ Hypertube Checklist

### Client (Frontend)

- [ ] **No Console Errors:** I have verified there are 0 errors/warnings in the browser console.
- [ ] **Strict Mode:** No `any` types used (or justified in comments).
- [ ] **Responsiveness:** Verified layout on Mobile view (Chrome DevTools).
- [ ] **Browser Test:** Tested on both Chrome and Firefox.

### Server (Backend)

- [ ] **No Console Errors:** I have verified there are 0 errors/warnings when running the server.
- [ ] **Error Handling:** Used `asyncHandler` wrapper for all async route handlers.
- [ ] **Custom Errors:** Thrown `AppError` subclasses (NotFoundError, UnauthorizedError, etc.) instead of generic Error.
- [ ] **Dependency Injection:** Services/repositories injected via constructor, not instantiated in handlers.
- [ ] **Logging:** Used Pino logger (`utils/logger`) instead of `console.log/error/warn`.
- [ ] **In-Memory DB for Tests:** All backend tests use an in-memory MongoDB (e.g., `mongodb-memory-server`). No real database is used for tests.
- [ ] **Tests Pass:** All integration tests pass (`npm test`).
- [ ] **Swagger Updated:** Updated API documentation if routes/schemas changed.

### General

- [ ] **Documentation:** Updated `CHANGELOG.md` with my changes.
- [ ] **Env Variables:** Added any new `.env` variables to `.env.example`.
- [ ] **README Updated:** Updated relevant README.md if needed.
