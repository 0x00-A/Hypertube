import { AppError } from './AppError';
import { ValidationError } from './AppError';

// 404 Not Found
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

// 400 Bad Request (Validation errors, missing fields)
export class BadRequestError extends AppError {
  constructor(message: string | ValidationError[] = 'Bad request') {
    const isArray = Array.isArray(message);
    super(isArray ? 'Validation Error' : (message as string), 400);
    if (isArray) {
      this.validationErrors = message;
    }
  }
}

// 401 Unauthorized (Not logged in)
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401);
  }
}

// 403 Forbidden
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403);
  }
}

// 409 Conflict
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}
