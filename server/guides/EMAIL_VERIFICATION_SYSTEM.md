# Email Verification System

## Overview

The email verification system ensures that users verify their email addresses before gaining full access to Hypertube. This document outlines the complete implementation, including the flow, testing strategy, and configuration.

## Architecture

### Flow Diagram

```
User Signup → Email Sent (verification link) → User Clicks Link → Email Verified → Welcome Email → User Can Login
     ↓                                                                    ↓
isActive: false                                                    isActive: true
```

### Components

1. **EmailService** (`src/services/email.service.ts`)
   - Manages email sending via Nodemailer
   - Handles verification token generation and validation
   - Uses SHA-256 hashing for secure token storage

2. **EmailBuilder** (`src/templates/email.builder.ts`)
   - Template rendering system with caching
   - Supports variable substitution ({{variableName}})
   - Loads HTML templates from `src/templates/emails/`

3. **VerificationEmail Model** (`src/models/verificationEmail.model.ts`)
   - Stores hashed verification tokens
   - Links tokens to user IDs
   - TTL index for automatic cleanup (24 hours)

4. **User Model Extension**
   - Added `isActive` field (boolean, default: false)
   - Users must be active to log in
   - OAuth users are automatically activated

## API Endpoints

### POST /api/v1/auth/signup
**Before email verification:**
- Creates user account with `isActive: false`
- Sends verification email with unique token
- Returns 201 with success message

### POST /api/v1/auth/verify-email
**Request Body:**
```json
{
  "token": "verification-token-from-email"
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Email verified successfully"
}
```

**Error Responses:**
- 400: Invalid or expired token
- 409: Email already verified

### POST /api/v1/auth/login
**Modified behavior:**
- Returns 409 if user is not verified
- Error message: "Please verify your email before logging in"

## Email Templates

### 1. Verification Email (`verification.html`)
- **Subject:** "Verify your email"
- **Variables:** `{{verificationLink}}`
- **Features:**
  - Hypertube branding (purple gradient)
  - Responsive design
  - 24-hour expiration notice
  - Security warning

### 2. Welcome Email (`welcome.html`)
- **Subject:** "Welcome to Hypertube"
- **Variables:** `{{username}}`, `{{appUrl}}`
- **Features:**
  - Feature list presentation
  - Call-to-action button
  - Support contact information

### 3. Password Reset Email (`passwordReset.html`)
- **Subject:** "Reset your password"
- **Variables:** `{{username}}`, `{{resetLink}}`
- **Status:** Template ready (endpoint not yet implemented)

## Configuration

### Environment Variables

```bash
# Email Service Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Test Environment

In tests, Nodemailer is **globally mocked** to prevent real SMTP connections:

```typescript
// tests/setup-inmemory-db.ts
jest.mock('nodemailer');
```

**Mock implementation** (`tests/__mocks__/nodemailer.ts`):
- `sendMail()`: Returns resolved promise with mock response
- `createTransport()`: Returns mock transporter
- Prevents Gmail rate limiting during tests

## Security

### Token Generation
- 32-byte random token (crypto.randomBytes)
- SHA-256 hashing before storage
- Plain token sent in email link only

### Token Validation
- Hashed comparison in database
- Single-use tokens (deleted after verification)
- 24-hour expiration (MongoDB TTL index)

### OAuth Integration
- Google OAuth users: `isActive: true` automatically
- 42 School OAuth users: `isActive: true` automatically
- Linked OAuth accounts activate existing users

## Testing Strategy

### Test Coverage (40 auth tests)

**Email Verification Tests (5 tests):**
1. ✅ Valid token verification
2. ✅ Invalid token rejection
3. ✅ Already verified user
4. ✅ Missing token validation
5. ✅ Empty token validation

**Login Tests:**
- ✅ Unverified users receive 409 error
- ✅ Verified users can log in successfully

**Helper Function:**
```typescript
async function createActiveUser(userData) {
  await request(app).post('/api/v1/auth/signup').send(userData);
  const user = await UserModel.findOne({ email: userData.email });
  await UserModel.findByIdAndUpdate(user?._id, { isActive: true });
}
```

### Running Tests

```bash
# All tests (195 total)
npm test

# Auth tests only (40 tests)
npm test -- tests/integration/auth.test.ts

# With coverage
npm test -- --coverage
```

## Implementation Checklist

- [x] EmailService implementation
- [x] EmailBuilder with template caching
- [x] HTML email templates (3 templates)
- [x] User model `isActive` field
- [x] Verification endpoint
- [x] Login blocking for unverified users
- [x] OAuth auto-activation
- [x] Test mocking (Nodemailer)
- [x] Test coverage (40 auth tests)
- [x] Swagger documentation
- [x] CHANGELOG updates
- [x] README updates
- [ ] Password reset endpoint (future)

## Troubleshooting

### Issue: Tests hanging or timing out
**Cause:** Real SMTP connections during tests
**Solution:** Ensure Nodemailer is mocked in `tests/setup-inmemory-db.ts`

### Issue: Gmail rate limit errors
**Cause:** Sending too many emails from Gmail account
**Solution:** Use mock in tests, consider dedicated SMTP service in production

### Issue: Login returns 409 for existing users
**Cause:** User not verified after signup
**Solution:** Check verification email was sent and token is valid

### Issue: Verification link doesn't work
**Cause:** CLIENT_URL environment variable incorrect
**Solution:** Verify CLIENT_URL matches frontend URL (e.g., `http://localhost:5173`)

## Future Enhancements

1. **Password Reset Flow**
   - Implement `/api/v1/auth/forgot-password` endpoint
   - Use existing `passwordReset.html` template
   - Similar token generation/validation logic

2. **Email Resend**
   - Add `/api/v1/auth/resend-verification` endpoint
   - Rate limiting to prevent abuse
   - Invalidate old tokens

3. **Production SMTP**
   - Consider SendGrid/AWS SES for production
   - Add email delivery tracking
   - Handle bounce/complaint notifications

4. **Template Improvements**
   - Add multi-language support
   - Dark mode email templates
   - Inline CSS for better compatibility

## Related Documentation

- [Global Error Handling](./GLOBAL_ERROR_HANDLING.md)
- [AsyncHandler Pattern](./ASYNC_HANDLER_PATTERN.md)
- [OAuth Linking Fix](./OAUTH_LINKING_FIX.md)
