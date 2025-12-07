// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
}

// ============================================================================
// Authentication Request Types
// ============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateProfileData {
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ============================================================================
// Authentication Response Types
// ============================================================================

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

export interface MessageResponse {
  message: string;
}

// ============================================================================
// Redux Auth State
// ============================================================================

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

export interface AuthError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}
