# Express + TypeScript

This project was initialized using `express-generator` and refactored into a clean N-tier architecture with TypeScript, MongoDB (Mongoose), OpenAPI docs via swagger-jsdoc, containerization, CI, and quality tooling.

## Structure

```text
src/
  app.ts            # Express app composition
  server.ts         # Startup + graceful shutdown
  config/           # env.ts (validation), database.ts (mongoose lifecycle)
  interfaces/       # Domain interfaces (Movie, User, Comment, Pagination)
  models/           # Mongoose schemas
  repositories/     # Data access classes
  services/         # Business/service layer stubs
  controllers/      # Transport layer (HTTP) handlers
  routes/v1/        # Versioned route modules
  middleware/       # errorHandler, notFound, requestLogger
  validators/       # Placeholder validation schemas
  utils/            # Shared helpers (pagination)
  docs/             # swagger.ts (OpenAPI 3.1 spec)
```

## Scripts

- `npm run dev` – Start development (ts-node-dev)
- `npm run build` – Compile TypeScript to `dist/`
- `npm start` – Run compiled server
- `npm run lint` – ESLint checks
- `npm run format` – Prettier formatting
- `npm test` – Jest + Supertest placeholder tests

## Environment Variables (.env.example)

```dotenv
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ntier
ENABLE_REQUEST_LOGGING=true
```
Validated via `envalid` in `src/config/env.ts` (fail-fast if missing).

## OpenAPI / Swagger

Endpoints:

- UI: `/api-docs`
- JSON: `/api-docs.json`
Defined in `src/docs/swagger.ts` with placeholder schemas (Movie, User, Comment). Route annotations will be aggregated (TODO: add glob in options.apis).

## Placeholder Domain APIs

- Movies: `GET /v1/movies`, `GET /v1/movies/:id`
- Users: `GET /v1/users`, `GET /v1/users/:id`, `PATCH /v1/users/:id`
- Comments: `GET /v1/comments`, `POST /v1/comments`, `DELETE /v1/comments/:id`
Each uses service → repository → model stack with minimal placeholder logic.

## Pagination & Filters

`interfaces/pagination.interface.ts`, `utils/pagination.ts` provide stubs (`TODO` notes) for future enhancement.

## Logging & Security

- Pino for application and request logging (`pino-pretty` in dev)
- Helmet for security headers
- CORS default open (configure later)
- express-rate-limit applied globally (tune later for write/auth routes)
- Disabled `x-powered-by` header

## Docker & Compose

Multi-stage Dockerfile (`builder` then lean runtime). Compose file provisions MongoDB 7.0 with healthcheck and starts app after Mongo is healthy.

### Dev Hot Reload (docker-compose.dev.yml)

For iterative development with hot reload inside containers:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Details:

- Uses `Dockerfile.dev` including dev dependencies.
- Bind mounts project source (`.:/app`) so changes trigger `ts-node-dev` restarts.
- Anonymous volume for `/app/node_modules` to avoid host OS mismatch.
- Mongo service with healthcheck; app waits until healthy.

Stop and remove:

```bash
docker compose -f docker-compose.dev.yml down
```

### Build & Run

```bash
# Build image
docker build -t ntier-backend .
# Run container
docker run -p 3000:3000 --env-file .env ntier-backend
# Or via compose
docker compose up --build
```

## Future TODOs

All implemented core scaffolding tasks complete. Remaining enhancements (optional):

- Production logging transport & structured error classes
- Role/permission guards atop auth middleware
- Improved filtering (query object mapping) beyond pagination
- Validation coverage for all create/update paths

## Development

```bash
cp .env.example .env # adjust values
npm install
npm run dev
# Visit: http://localhost:3000/api-docs
```
