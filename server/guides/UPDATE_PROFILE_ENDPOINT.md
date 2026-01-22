# Update Profile Endpoint - Implementation & Testing Guide

## Overview

This guide documents the `/api/v1/users/update-profile` endpoint implementation, including validation rules, error handling, and comprehensive test coverage.

## Endpoint Details

**Method:** POST
**Path:** `/api/v1/users/update-profile`
**Authentication:** Required (JWT via cookie)
**Middleware Stack:**
1. `validate(UpdateProfileSchema)` - Input validation
2. `auth` - Authentication check
3. `controller.updateProfile` - Business logic

## Request Schema

### UpdateProfileSchema (Zod)

```typescript
{
  body: {
    email?: string,      // Optional, must be valid email
    username?: string,   // Optional, min 3 characters
    bio?: string,        // Optional, max 500 characters
    avatarUrl?: string   // Optional, must be valid URL
  }
}
```

### Validation Rules

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string | No | Must be valid email format |
| `username` | string | No | Min 3 characters |
| `bio` | string | No | Max 500 characters |
| `avatarUrl` | string | No | Must be valid URL (http/https) |

**Notes:**
- All fields are optional
- Empty body is valid (no-op update)
- Unknown fields are ignored
- Fields are updated independently

## Response Format

### Success Response (200)

```json
{
  "status": "success",
  "message": "Profile updated successfully"
}
```

### Validation Error Response (400)

```json
{
  "status": "fail",
  "message": "Validation failed",
  "validationErrors": [
    {
      "path": "body.email",
      "message": "Invalid email address"
    }
  ]
}
```

### Authentication Error Response (401)

```json
{
  "status": "fail",
  "message": "Unauthorized: No access token provided"
}
```

## Implementation Flow

### 1. Controller Layer
```typescript
updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const newData = req.validated?.body as IUserProfileUpdate;
  if (req.user == null || req.user.username == null) {
    throw new NotFoundError('User not found');
  }
  await this._service.updateProfile(req.user.username, newData);
  res.json({
    status: 'success',
    message: 'Profile updated successfully',
  });
});
```

### 2. Service Layer
```typescript
async updateProfile(username: string, newData: IUserProfileUpdate): Promise<void> {
  await this._repo.updateByUsername(username, newData);
}
```

### 3. Repository Layer
```typescript
async updateByUsername(username: string, updateData: IUserProfileUpdate): Promise<Partial<IUser> | null> {
  const doc = await UserModel.findOneAndUpdate(
    { username },
    { $set: updateData },
    { new: true, runValidators: true }
  ).exec();
  return this.toIUser(doc);
}
```

## Test Coverage

### Test Suite: POST /api/v1/users/update-profile
**Total Tests:** 33
**Coverage Areas:**
- Successful updates (single field, multiple fields, all fields)
- Authentication/authorization
- Input validation
- Edge cases
- Error handling
- Concurrent requests

### Test Categories

#### 1. Successful Updates (8 tests)
- ✅ Update all fields together
- ✅ Update username only
- ✅ Update email only
- ✅ Update bio only
- ✅ Update avatarUrl only
- ✅ Empty body (no-op)
- ✅ Username with valid special characters
- ✅ Preserve unchanged fields

#### 2. Authentication & Authorization (3 tests)
- ✅ Return 401 when not authenticated
- ✅ Return 401 with invalid token
- ✅ Return 401 with expired token

#### 3. Input Validation (11 tests)
- ✅ Invalid email format
- ✅ Username shorter than 3 characters
- ✅ Bio exceeding 500 characters
- ✅ Bio with exactly 500 characters (valid)
- ✅ Invalid avatarUrl format
- ✅ Valid https URL
- ✅ Valid http URL
- ✅ Multiple validation errors at once
- ✅ Whitespace trimming
- ✅ Duplicate username conflict
- ✅ Duplicate email conflict

#### 4. Edge Cases (7 tests)
- ✅ Concurrent update requests
- ✅ Very long valid email
- ✅ Additional unknown fields
- ✅ Null values in optional fields
- ✅ Undefined values in optional fields
- ✅ No sensitive field exposure
- ✅ Consistent response structures

#### 5. Response Format Validation (4 tests)
- ✅ Success response structure
- ✅ Error response structure
- ✅ No password exposure
- ✅ No oauth exposure

## Security Considerations

### 1. Authentication Required
- Users can only update their own profile
- Username extracted from JWT token, not request body

### 2. Sensitive Data Protection
- Password field never returned in response
- OAuth field never exposed
- Email validation prevents injection

### 3. Input Validation
- All inputs validated with Zod schemas
- URL validation prevents XSS via avatarUrl
- Bio length limit prevents abuse
- Username constraints prevent conflicts

### 4. Conflict Handling
- Database unique constraints prevent duplicate usernames/emails
- Mongoose validators run on update operations

## Error Scenarios

| Scenario | Status | Error Type | Message |
|----------|--------|------------|---------|
| No auth token | 401 | UnauthorizedError | "Unauthorized: No access token provided" |
| Invalid token | 401 | UnauthorizedError | Token validation error |
| Invalid email | 400 | ValidationError | "Invalid email address" |
| Short username | 400 | ValidationError | "Username must be at least 3 characters long" |
| Long bio | 400 | ValidationError | "Bio cannot exceed 500 characters" |
| Invalid URL | 400 | ValidationError | "Invalid URL format" |
| Duplicate username | 400/409 | Database Error | Constraint violation |
| Duplicate email | 400/409 | Database Error | Constraint violation |

## Best Practices Demonstrated

### 1. AsyncHandler Pattern
```typescript
updateProfile = asyncHandler(async (req: Request, res: Response) => {
  // No try-catch needed - asyncHandler handles errors
});
```

### 2. Dependency Injection
```typescript
export class UserController {
  constructor(private _service: UserService) {}
}
```

### 3. Type Safety
```typescript
const newData = req.validated?.body as IUserProfileUpdate;
```

### 4. Validation-First Approach
- Schema validation before business logic
- Fail fast on invalid input
- Consistent error responses

### 5. Repository Pattern
- Separation of concerns
- Testable components
- Database abstraction

## Usage Examples

### Update Username
```bash
curl -X POST https://api.hypertube.com/api/v1/users/update-profile \
  -H "Cookie: accessToken=<token>" \
  -H "Content-Type: application/json" \
  -d '{"username": "newusername"}'
```

### Update Multiple Fields
```bash
curl -X POST https://api.hypertube.com/api/v1/users/update-profile \
  -H "Cookie: accessToken=<token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com",
    "bio": "Software engineer passionate about movies",
    "avatarUrl": "https://cdn.example.com/avatar.jpg"
  }'
```

### Update Bio Only
```bash
curl -X POST https://api.hypertube.com/api/v1/users/update-profile \
  -H "Cookie: accessToken=<token>" \
  -H "Content-Type: application/json" \
  -d '{"bio": "Movie enthusiast and torrent streamer"}'
```

## Running Tests

```bash
# Run all user tests
npm test user.test.ts

# Run with coverage
npm test -- --coverage user.test.ts

# Run specific test suite
npm test -- --testNamePattern="POST /api/v1/users/update-profile"
```

## Future Enhancements

1. **Rate Limiting:** Prevent profile update spam
2. **Audit Logging:** Track profile changes for security
3. **Email Verification:** Require verification when email changes
4. **Avatar Upload:** Direct file upload instead of URL
5. **Username History:** Track username changes to prevent abuse
6. **Profile Completion:** Calculate and return profile completion percentage

## Related Files

- **Controller:** `server/src/controllers/user.controller.ts`
- **Service:** `server/src/services/user.service.ts`
- **Repository:** `server/src/repositories/user.repository.ts`
- **Routes:** `server/src/routes/v1/users.routes.ts`
- **Validator:** `server/src/validators/user.schema.ts`
- **Interface:** `server/src/interfaces/user.interface.ts`
- **Tests:** `server/tests/integration/user.test.ts`

## Conclusion

The update profile endpoint demonstrates proper implementation of the project's coding standards:
- ✅ Zero console errors
- ✅ No `any` types
- ✅ AsyncHandler pattern throughout
- ✅ Custom error classes
- ✅ Comprehensive test coverage
- ✅ Type-safe implementation
- ✅ Proper error handling
- ✅ Security-first approach
