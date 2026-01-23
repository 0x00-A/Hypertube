// ============================================================================
// User Types
// ============================================================================

export interface User {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  createdAt: string;
  isActive?: boolean;
  language?: string;
}

// ============================================================================
// Authentication Request Types
// ============================================================================

export interface LoginCredentials {
  identifier: string;
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
  email?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  language?: string;
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
  status: string;
  message: string;
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
