# Global Error Handling Guide

This guide explains how to use the unified global error handling system in the Hypertube project. Following these patterns ensures consistent error responses and prevents console errors that would violate the project's eliminatory rule.

---

## Table of Contents

1. [Overview](#overview)
2. [Available Error Classes](#available-error-classes)
3. [Usage in Controllers](#usage-in-controllers)
4. [Usage in Services](#usage-in-services)
5. [Validation Errors](#validation-errors)
6. [Common Patterns](#common-patterns)
7. [What NOT to Do](#what-not-to-do)

---

## Overview

The global error handling system provides:

- **Consistent JSON error responses** across all endpoints
- **Automatic error categorization** (operational vs. programmer errors)
- **Type-safe error handling** with custom AppError classes
- **Centralized error logging** via Pino

**Key Principle:** Never manually send error responses with `res.status(4xx).json()`. Always throw AppError instances or forward errors via `next(err)`.

---

## Available Error Classes

All error classes are located in `src/core/errors/customErrors.ts`:

| Class               | Status Code | Use Case                                            |
| ------------------- | ----------- | --------------------------------------------------- |
| `BadRequestError`   | 400         | Invalid input, malformed data, validation failures  |
| `UnauthorizedError` | 401         | Authentication required, invalid credentials        |
| `ForbiddenError`    | 403         | User authenticated but lacks permission             |
| `NotFoundError`     | 404         | Resource not found (user, movie, etc.)              |
| `ConflictError`     | 409         | Duplicate resource (username, email already exists) |

### Import Example

```typescript
import { NotFoundError, UnauthorizedError, ConflictError } from '../core/errors/customErrors';
```

---

## Usage in Controllers

Controllers should **throw errors** or **forward them via `next(err)`**.

### ✅ Correct Pattern

```typescript
import { Request, Response, NextFunction } from 'express';
import { MovieService } from '../services/movie.service';
import { NotFoundError } from '../core/errors/customErrors';

export class MovieController {
  private _movieService: MovieService;

  constructor(movieService: MovieService) {
    this._movieService = movieService;
  }

  async getMovie(req: Request, res: Response, next: NextFunction) {
    try {
      const movie = await this._movieService.get(req.params.id);

      if (!movie) {
        throw new NotFoundError('Movie not found'); // ✅ Throw AppError
      }

      res.json({ data: movie });
    } catch (err) {
      next(err); // ✅ Forward to global error handler
    }
  }
}
```

### ❌ Incorrect Pattern

```typescript
async getMovie(req: Request, res: Response, next: NextFunction) {
  try {
    const movie = await this._movieService.get(req.params.id);

    if (!movie) {
      return res.status(404).json({ message: 'Not found' }); // ❌ Manual response
    }

    res.json({ data: movie });
  } catch (err) {
    next(err);
  }
}
```

---

## Usage in Services

Services should **throw AppError instances** for business logic errors.

### ✅ Correct Pattern

```typescript
import { ConflictError } from '../core/errors/customErrors';

export class AuthService {
  async signUp(userData: ISignupDTO) {
    const existingUser = await this._repo.findByUsername(userData.username);

    if (existingUser) {
      throw new ConflictError('Username already taken'); // ✅ Throw AppError
    }

    // Continue with signup logic...
  }
}
```

### ❌ Incorrect Pattern

```typescript
async signUp(userData: ISignupDTO) {
  const existingUser = await this._repo.findByUsername(userData.username);

  if (existingUser) {
    throw new Error('Username already taken'); // ❌ Generic Error (500 status)
  }
}
```

**Why?** Generic `Error` instances are treated as programmer errors (500 Internal Server Error). Use AppError classes to send appropriate 4xx status codes.

---

## Validation Errors

Zod validation is handled automatically by the `validate` middleware.

### How It Works

```typescript
// Route with validation
router.get(
  '/movies/:id',
  validate({ params: movieIdSchema }), // Zod schema
  movieController.getMovie.bind(movieController),
);
```

**If validation fails:**

1. Middleware catches Zod errors
2. Converts them to `BadRequestError` with `validationErrors` array
3. Global error handler returns:

```json
{
  "status": "fail",
  "message": "Validation failed",
  "validationErrors": [
    {
      "path": "params.id",
      "message": "Invalid ObjectId format"
    }
  ],
  "path": "/v1/movies/invalid-id"
}
```

**You don't need to handle validation errors manually in controllers.**

---

## Common Patterns

### 1. Resource Not Found

```typescript
const user = await this._userService.get(req.params.id);

if (!user) {
  throw new NotFoundError('User not found');
}

res.json(user);
```

### 2. Authentication Check

```typescript
const result = await this._authService.logIn(credentials);

if (!result) {
  throw new UnauthorizedError('Invalid identifier or password');
}

// Set cookies and return success response
```

### 3. Duplicate Resource

```typescript
const existingEmail = await this._repo.findByEmail(userData.email);

if (existingEmail) {
  throw new ConflictError('Email already exists');
}
```

### 4. Permission Check

```typescript
if (req.user.id !== resourceOwnerId) {
  throw new ForbiddenError('You do not have permission to access this resource');
}
```

### 5. Invalid Input

```typescript
if (!supportedFormats.includes(fileExtension)) {
  throw new BadRequestError('Unsupported file format');
}
```

---

## What NOT to Do

### ❌ Manual Status Responses

```typescript
// DON'T DO THIS
if (!user) {
  return res.status(404).json({ message: 'Not found' });
}
```

**Why?** Inconsistent response format, bypasses global logging, harder to maintain.

### ❌ Generic Error Throws

```typescript
// DON'T DO THIS
if (duplicate) {
  throw new Error('Duplicate found');
}
```

**Why?** Treated as 500 Internal Server Error instead of 409 Conflict.

### ❌ Silent Failures

```typescript
// DON'T DO THIS
const user = await this._userService.get(id);
if (!user) {
  return res.json(null); // Silent failure
}
```

**Why?** Client receives `null` with 200 OK status. Client expects error response for missing resources.

### ❌ Try-Catch Without next(err)

```typescript
// DON'T DO THIS
async getMovie(req: Request, res: Response, next: NextFunction) {
  try {
    const movie = await this._movieService.get(req.params.id);
    res.json(movie);
  } catch (err) {
    console.error(err); // ❌ Logged but not handled
  }
}
```

**Why?** Error is swallowed, client hangs waiting for response, violates "NO Console Errors" rule.

---

## Error Response Format

All errors return this consistent format:

```json
{
  "status": "fail", // "fail" for 4xx, "error" for 5xx
  "message": "User not found", // Human-readable message
  "path": "/v1/users/123", // Request path
  "validationErrors": [
    // Optional: Only for validation errors
    {
      "path": "body.email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## Error Handling Flow

```
Request
  ↓
Route Handler → Validation Middleware (Zod)
  ↓                    ↓ (validation fails)
Controller       BadRequestError
  ↓                    ↓
Service          next(err)
  ↓                    ↓
throw AppError   Global Error Handler
  ↓                    ↓
next(err)        Log + JSON Response
  ↓                    ↓
Global Error Handler → Client
```

---

## Examples from Codebase

### Auth Controller

```typescript
async logIn(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.validated!.body as ILoginDTO;
    const result = await this._service.logIn(body);

    if (!result) {
      throw new UnauthorizedError('Invalid identifier or password');
    }

    // Set cookies and return success
    res.cookie('accessToken', result.access_token, { /* ... */ });
    res.status(200).json({ /* ... */ });
  } catch (err) {
    next(err);
  }
}
```

### Movie Controller

```typescript
async getMovie(req: Request, res: Response, next: NextFunction) {
  try {
    const movie = await this._movieService.get(req.params.id);

    if (!movie) {
      throw new NotFoundError('Movie not found');
    }

    res.json({ data: movie });
  } catch (err) {
    next(err);
  }
}
```

### Auth Service

```typescript
async signUp(userData: ISignupDTO) {
  const exist_username = await this._repo.findByUsername(userData.username);
  const exist_email = await this._repo.findByEmail(userData.email);

  if (exist_username) {
    throw new ConflictError('Username already taken');
  }
  if (exist_email) {
    throw new ConflictError('Email already exists');
  }

  // Continue with signup logic...
}
```

---

## Quick Reference

| Scenario                 | Error Class         | Example Message                                   |
| ------------------------ | ------------------- | ------------------------------------------------- |
| Resource not found       | `NotFoundError`     | "User not found"                                  |
| Invalid credentials      | `UnauthorizedError` | "Invalid identifier or password"                  |
| Missing auth token       | `UnauthorizedError` | "Authentication token required"                   |
| Insufficient permissions | `ForbiddenError`    | "You do not have permission"                      |
| Duplicate username/email | `ConflictError`     | "Username already taken"                          |
| Invalid input format     | `BadRequestError`   | "Invalid email format"                            |
| Validation failure       | `BadRequestError`   | "Validation failed" (with validationErrors array) |

---

## Testing Error Responses

Use these curl commands to test error handling:

```bash
# 404 Not Found
curl http://localhost:5000/v1/movies/507f1f77bcf86cd799439011

# 400 Bad Request (invalid ID format)
curl http://localhost:5000/v1/movies/invalid-id

# 401 Unauthorized (invalid credentials)
curl -X POST http://localhost:5000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "wrong@email.com", "password": "wrongpass"}'

# 409 Conflict (duplicate username)
curl -X POST http://localhost:5000/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username": "existinguser", "email": "new@email.com", "password": "pass123"}'
```

---

## Summary

✅ **DO:**

- Throw AppError classes (`NotFoundError`, `UnauthorizedError`, etc.)
- Forward errors with `next(err)` in controllers
- Use try-catch blocks in all async controller methods
- Let Zod validation middleware handle input validation

❌ **DON'T:**

- Use `res.status(4xx).json()` for error responses
- Throw generic `Error` instances
- Swallow errors with empty catch blocks
- Log errors without forwarding them

Following these patterns ensures consistent error handling and prevents violations of the "NO Console Errors" eliminatory rule.
