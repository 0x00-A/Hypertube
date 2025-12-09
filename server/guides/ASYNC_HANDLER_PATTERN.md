# AsyncHandler Pattern Guide

## Overview

The `asyncHandler` utility is a higher-order function that wraps asynchronous Express route handlers to automatically catch errors and forward them to the global error handling middleware. This eliminates the need for repetitive try-catch blocks in every controller and middleware function.

## Why Use AsyncHandler?

### ❌ Without AsyncHandler (Anti-Pattern)

```typescript
async signUp(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.validated!.body as ISignupDTO;
    const newUser = await this._service.signUp(body);
    return res.status(201).json({
      status: 'success',
      data: newUser,
    });
  } catch (err) {
    next(err);
  }
}
```

**Problems:**

- Repetitive try-catch boilerplate in every handler
- Easy to forget error handling
- Verbose and harder to read
- Violates DRY (Don't Repeat Yourself) principle

### ✅ With AsyncHandler (Best Practice)

```typescript
signUp = asyncHandler(async (req: Request, res: Response) => {
  const body = req.validated!.body as ISignupDTO;
  const newUser = await this._service.signUp(body);
  return res.status(201).json({
    status: 'success',
    data: newUser,
  });
});
```

**Benefits:**

- Clean, focused business logic
- Automatic error catching and forwarding
- Less code to maintain
- Impossible to forget error handling

---

## Implementation

### 1. Import AsyncHandler

```typescript
import { asyncHandler } from '../utils/asyncHandler';
```

### 2. Controller Methods (Class-Based)

When using class-based controllers, use **arrow function properties** with asyncHandler:

```typescript
export class AuthController {
  private _service: AuthService;

  constructor(service: AuthService) {
    this._service = service;
  }

  // ✅ Correct: Arrow function property
  signUp = asyncHandler(async (req: Request, res: Response) => {
    const body = req.validated!.body as ISignupDTO;
    const newUser = await this._service.signUp(body);
    return res.status(201).json({ data: newUser });
  });

  // ✅ Correct: Arrow function property
  logIn = asyncHandler(async (req: Request, res: Response) => {
    const result = await this._service.logIn(req.body);
    if (!result) {
      throw new UnauthorizedError('Invalid credentials');
    }
    return res.status(200).json({ data: result });
  });
}
```

**Why Arrow Functions?**

- Preserves `this` context in class methods
- Works seamlessly with dependency injection
- No need to bind methods in constructor

### 3. Functional Controllers

For standalone function exports:

```typescript
export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await service.get(req.params.id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  res.json(user);
});
```

### 4. Middleware Functions

**⚠️ IMPORTANT:** Middleware that needs to call `next()` must include it in the signature:

```typescript
// ✅ Correct: Includes next parameter and calls it
export const auth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    throw new UnauthorizedError('No access token provided');
  }

  const result = await jwtService.verifyToken(accessToken, true, false);
  req.user = result.user;

  next(); // ✅ Must call next() to continue request flow
});
```

```typescript
// ❌ Wrong: Missing next() call - will timeout
export const auth = asyncHandler(async (req: Request, res: Response) => {
  const accessToken = req.cookies.accessToken;
  if (!accessToken) {
    throw new UnauthorizedError('No access token provided');
  }
  const result = await jwtService.verifyToken(accessToken, true, false);
  req.user = result.user;
  // ❌ Forgot next() - request hangs
});
```

---

## Error Handling Flow

### How It Works

```typescript
// asyncHandler implementation
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

**Flow:**

1. Wrap your async function with `asyncHandler`
2. Execute the function and get a Promise
3. If Promise resolves → continue normally
4. If Promise rejects → automatically call `next(error)`
5. Global error handler catches the error

### Error Types

All errors thrown inside asyncHandler-wrapped functions are automatically caught:

```typescript
// Operational Errors (AppError subclasses)
throw new NotFoundError('User not found'); // 404
throw new UnauthorizedError('Invalid token'); // 401
throw new BadRequestError('Invalid input'); // 400
throw new ConflictError('Username already exists'); // 409
throw new ForbiddenError('Access denied'); // 403

// Validation Errors (Zod)
// Automatically caught and formatted by validate middleware

// Database Errors (Mongoose)
// Automatically caught and formatted by global error handler

// Unexpected Errors
throw new Error('Something went wrong'); // 500 Internal Server Error
```

---

## Common Patterns

### 1. Resource Not Found

```typescript
getMovie = asyncHandler(async (req: Request, res: Response) => {
  const movie = await this._movieService.get(req.params.id);

  if (!movie) {
    throw new NotFoundError('Movie not found');
  }

  res.json({ data: movie });
});
```

### 2. Conditional Logic with Errors

```typescript
logIn = asyncHandler(async (req: Request, res: Response) => {
  const result = await this._service.logIn(req.body);

  if (!result) {
    throw new UnauthorizedError('Invalid identifier or password');
  }

  res.cookie('accessToken', result.access_token, { httpOnly: true });
  res.status(200).json({ data: result.user });
});
```

### 3. Multiple Async Operations

```typescript
createOrder = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.get(req.user.id);
  const product = await productService.get(req.body.productId);

  if (!product.inStock) {
    throw new BadRequestError('Product out of stock');
  }

  const order = await orderService.create({
    userId: user.id,
    productId: product.id,
  });

  res.status(201).json({ data: order });
});
```

### 4. Setting Cookies/Headers

```typescript
refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new UnauthorizedError('No refresh token provided');
  }

  const result = await this._service.refreshToken(refreshToken);

  res.cookie('accessToken', result.access_token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000, // 1 hour
  });

  res.status(200).json({
    status: 'success',
    message: 'Token refreshed successfully',
  });
});
```

---

## Middleware vs Route Handlers

### Route Handlers (Terminal Handlers)

Route handlers send responses and **don't call next()**:

```typescript
// ✅ Route handler - sends response
getUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await service.get(req.params.id);
  res.json(user); // ✅ Sends response, no next()
});
```

### Middleware (Pass-Through Handlers)

Middleware modifies request/response and **must call next()**:

```typescript
// ✅ Middleware - calls next()
export const auth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies.accessToken;
  if (!token) throw new UnauthorizedError('No token');

  req.user = await jwtService.verify(token);
  next(); // ✅ Must call next() to continue
});
```

---

## Testing

AsyncHandler works seamlessly with your existing tests:

```typescript
describe('Auth Controller', () => {
  it('should return 401 for invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'wrong', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      status: 'fail',
      message: 'Invalid identifier or password',
    });
  });
});
```

**No changes required** - asyncHandler is transparent to tests.

---

## Migration Checklist

When refactoring existing controllers:

- [ ] Import `asyncHandler` from `../utils/asyncHandler`
- [ ] For class methods: Convert `async methodName()` to `methodName = asyncHandler(async () => {})`
- [ ] For functions: Wrap with `asyncHandler(async () => {})`
- [ ] Remove try-catch blocks
- [ ] Move logic from try block to main function body
- [ ] Keep error throws (they'll be caught automatically)
- [ ] For middleware: Keep `next: NextFunction` parameter and call `next()`
- [ ] Remove unused `NextFunction` imports (if not middleware)
- [ ] Run tests to verify behavior unchanged

---

## Quick Reference

| Type                    | Pattern                                                                         | Next() Required? |
| ----------------------- | ------------------------------------------------------------------------------- | ---------------- |
| Class Controller Method | `method = asyncHandler(async (req, res) => {})`                                 | No               |
| Functional Controller   | `export const func = asyncHandler(async (req, res) => {})`                      | No               |
| Middleware              | `export const middleware = asyncHandler(async (req, res, next) => { next(); })` | Yes              |

---

## Common Mistakes

### ❌ Mistake 1: Forgetting next() in Middleware

```typescript
// ❌ Wrong - request will hang
export const auth = asyncHandler(async (req: Request, res: Response) => {
  req.user = await verify(req.cookies.token);
  // Missing next()!
});
```

```typescript
// ✅ Correct
export const auth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  req.user = await verify(req.cookies.token);
  next(); // ✅ Continue request flow
});
```

### ❌ Mistake 2: Nesting AsyncHandler

```typescript
// ❌ Wrong - unnecessary nesting
asyncHandler(async (req, res) => {
  return asyncHandler(async (req, res) => {
    // ...
  });
});
```

```typescript
// ✅ Correct - single wrapper
asyncHandler(async (req, res) => {
  // ...
});
```

### ❌ Mistake 3: Mixing Try-Catch with AsyncHandler

```typescript
// ❌ Wrong - redundant try-catch
method = asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = await service.get(req.params.id);
    res.json(user);
  } catch (err) {
    throw err; // ❌ Unnecessary
  }
});
```

```typescript
// ✅ Correct - let asyncHandler catch
method = asyncHandler(async (req: Request, res: Response) => {
  const user = await service.get(req.params.id);
  res.json(user); // Errors caught automatically
});
```

---

## Best Practices

1. **Always use asyncHandler** for async route handlers and middleware
2. **Throw AppError subclasses** for operational errors (not generic Error)
3. **Keep handler logic clean** - business logic belongs in services
4. **Don't catch errors inside asyncHandler** - let it catch them
5. **Call next() in middleware** - required for request flow
6. **Prefix unused params** with `_` (e.g., `_res`) to satisfy linter
7. **Test error scenarios** - ensure proper status codes and messages

---

## See Also

- [Global Error Handling Guide](./GLOBAL_ERROR_HANDLING.md) - Error handling architecture
- [Custom Error Classes](../src/core/errors/customErrors.ts) - Available error types
- [Express Error Handling Docs](https://expressjs.com/en/guide/error-handling.html) - Official Express guide
