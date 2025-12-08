# Auth Integration Tests Documentation

## Overview

This document describes the integration tests for the authentication endpoints (`/v1/auth/signup` and `/v1/auth/login`). These tests ensure that the authentication system works correctly, securely stores passwords, validates input data, and properly manages JWT tokens via cookies.

## Test Suite Structure

### Setup and Teardown

- **`beforeAll`**: Establishes database connection before running tests
- **`afterAll`**: Closes database connection after all tests complete
- **`beforeEach`**: Clears the User collection before each test to ensure clean state

## Signup Tests (`POST /v1/auth/signup`)

### 1. Successful User Registration
**Test**: `should successfully register a new user with valid data`

**Purpose**: Verifies that a user can register with valid credentials

**Validates**:
- Returns HTTP 201 (Created) status
- Response includes success status and message
- User data is returned (username, email, firstName, lastName)
- UserId is generated and included in response

### 2. Password Hashing
**Test**: `should hash the password before storing`

**Purpose**: Ensures passwords are never stored in plain text

**Validates**:
- Password in database is different from submitted password
- Hashed password length is greater than 20 characters
- Password hashing is applied automatically

### 3. Missing Required Fields
**Test**: `should return 400 when required fields are missing`

**Purpose**: Validates that all required fields must be provided

**Validates**:
- Returns HTTP 400 (Bad Request)
- Response includes validation errors array
- Error count matches number of missing fields

### 4. Invalid Email Format
**Test**: `should return 400 when email format is invalid`

**Purpose**: Ensures email validation is enforced

**Validates**:
- Returns HTTP 400 for invalid email format
- Error message indicates email validation failure

### 5. Username Length Validation
**Test**: `should return 400 when username is too short`

**Purpose**: Enforces minimum username length requirement (3 characters)

**Validates**:
- Returns HTTP 400 for usernames shorter than 3 characters
- Error message mentions "3 characters" requirement

### 6. Password Length Validation
**Test**: `should return 400 when password is too short`

**Purpose**: Enforces minimum password length requirement (6 characters)

**Validates**:
- Returns HTTP 400 for passwords shorter than 6 characters
- Error message mentions "6 characters" requirement

### 7. Duplicate Username Prevention
**Test**: `should return 500 when trying to register with duplicate username`

**Purpose**: Prevents multiple users from having the same username

**Validates**:
- First registration succeeds (HTTP 201)
- Second registration with same username fails (HTTP 500)
- System maintains username uniqueness

### 8. Duplicate Email Prevention
**Test**: `should return 500 when trying to register with duplicate email`

**Purpose**: Prevents multiple accounts with the same email address

**Validates**:
- First registration succeeds (HTTP 201)
- Second registration with same email fails (HTTP 500)
- System maintains email uniqueness

### 9. Input Sanitization
**Test**: `should trim whitespace from email and username`

**Purpose**: Ensures whitespace is removed from user input

**Validates**:
- Leading/trailing spaces are trimmed from username
- Leading/trailing spaces are trimmed from email
- Trimmed values are stored in database

### 10. Security - No Sensitive Data Exposure
**Test**: `should not expose sensitive data in response`

**Purpose**: Ensures passwords are never returned in API responses

**Validates**:
- Response body does not contain password field
- Password is not present anywhere in JSON response

### 11. Default Values
**Test**: `should set default values for optional fields`

**Purpose**: Verifies optional fields receive default values when not provided

**Validates**:
- User is successfully created in database
- Default values are applied appropriately

## Login Tests (`POST /v1/auth/login`)

### 1. Successful Login with Username
**Test**: `should successfully login with username and set cookies`

**Purpose**: Verifies users can authenticate using their username

**Validates**:
- Returns HTTP 200 (OK)
- Response includes success status and "Login successful" message
- Two cookies are set: `accessToken` and `refreshToken`
- Cookies have `HttpOnly` flag for security
- Cookies have `SameSite=Strict` attribute

### 2. Successful Login with Email
**Test**: `should successfully login with email and set cookies`

**Purpose**: Verifies users can authenticate using their email address

**Validates**:
- Returns HTTP 200 (OK)
- Response includes success status and message
- Both authentication cookies are set correctly

### 3. Token in Response Body
**Test**: `should return access and refresh tokens in response body`

**Purpose**: Ensures token is available in response for client-side storage if needed

**Validates**:
- Response data includes `token` property
- Token value is a non-empty string

### 4. User Information in Response
**Test**: `should return user information in response`

**Purpose**: Provides user details after successful authentication

**Validates**:
- Response includes user object
- User object contains: userId, username, email
- User data matches the authenticated user

### 5. Invalid Password Handling
**Test**: `should return 401 with invalid password`

**Purpose**: Ensures wrong passwords are rejected

**Validates**:
- Returns HTTP 401 (Unauthorized)
- Error message: "Invalid identifier or password"
- No cookies are set on failed login
- Does not reveal whether username/email exists

### 6. Non-existent Username
**Test**: `should return 401 with non-existent username`

**Purpose**: Prevents user enumeration by returning same error for non-existent users

**Validates**:
- Returns HTTP 401 (Unauthorized)
- Generic error message (no indication if user exists)
- No cookies are set

### 7. Non-existent Email
**Test**: `should return 401 with non-existent email`

**Purpose**: Prevents user enumeration when using email as identifier

**Validates**:
- Returns HTTP 401 (Unauthorized)
- Generic error message
- Consistent behavior with non-existent username test

### 8. Missing Identifier
**Test**: `should return 400 when identifier is missing`

**Purpose**: Validates that identifier field is required

**Validates**:
- Returns HTTP 400 (Bad Request)
- Response includes validation errors

### 9. Missing Password
**Test**: `should return 400 when password is missing`

**Purpose**: Validates that password field is required

**Validates**:
- Returns HTTP 400 (Bad Request)
- Response includes validation errors

### 10. Security - No Password Exposure
**Test**: `should not expose password in any response`

**Purpose**: Ensures password never appears in login responses

**Validates**:
- Password is not in response body (as field or value)
- User object does not contain password property
- Response is safe to log/display

### 11. Cookie Expiration Times
**Test**: `should set cookies with correct expiration times`

**Purpose**: Validates cookie expiration is properly configured

**Validates**:
- AccessToken cookie includes `Max-Age` attribute
- RefreshToken cookie includes `Max-Age` attribute
- Expiration times allow for session management

### 12. Multiple Login Sessions
**Test**: `should allow login multiple times with same credentials`

**Purpose**: Ensures users can log in from multiple devices/sessions

**Validates**:
- First login succeeds
- Second login succeeds (1 second later to ensure different timestamps)
- Each login generates unique tokens
- Access tokens are different between logins

## Security Features Tested

### Cookie Security
- ✅ **HttpOnly flag**: Prevents JavaScript access to tokens (XSS protection)
- ✅ **SameSite=Strict**: Prevents CSRF attacks
- ✅ **Max-Age**: Proper token expiration management
- ✅ **Secure flag**: Set in production for HTTPS-only transmission

### Password Security
- ✅ **Hashing**: Passwords are hashed with Argon2 before storage
- ✅ **No exposure**: Passwords never appear in API responses
- ✅ **Verification**: Proper password comparison using secure methods

### Input Validation
- ✅ **Required fields**: All mandatory fields must be provided
- ✅ **Format validation**: Email format, username length, password length
- ✅ **Sanitization**: Whitespace trimming on text inputs
- ✅ **Uniqueness**: Username and email must be unique

### Authentication Security
- ✅ **Generic errors**: Same error for invalid credentials and non-existent users
- ✅ **No enumeration**: Cannot determine if username/email exists
- ✅ **Token uniqueness**: Each login generates fresh tokens
- ✅ **Dual authentication**: Support for both username and email login

## Test Data

### Valid User Data Template
```javascript
{
  username: 'testuser',
  email: 'test@example.com',
  password: 'SecurePass123!',
  firstName: 'Test',
  lastName: 'User'
}
```

## Running the Tests

```bash
# Run all auth tests
npm test -- --testPathPattern=auth.test.ts

# Run with coverage
npm test -- --testPathPattern=auth.test.ts --coverage

# Run in watch mode during development
npm test -- --testPathPattern=auth.test.ts --watch
```

## Test Environment

- **Framework**: Jest 29.7.0
- **HTTP Testing**: Supertest 7.1.4
- **Database**: MongoDB (test database with cleanup)
- **Authentication**: JWT tokens with Argon2 password hashing

## Expected Test Results

- **Total Tests**: 22 (11 signup + 11 login)
- **Expected Result**: All tests passing
- **Expected Warnings**: Error logs for duplicate user tests are intentional (testing error handling)

## Maintenance Notes

- Tests use `beforeEach` to clean database, ensuring test isolation
- Each login test creates a fresh user via signup endpoint
- Tests include 1-second delay for multiple login test to ensure unique JWT timestamps
- TypeScript errors in IDE for Jest globals are normal; tests run successfully
