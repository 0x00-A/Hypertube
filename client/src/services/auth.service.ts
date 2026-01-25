import { httpClient } from './http';
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
  ForgotPasswordData,
  ResetPasswordData,
  MessageResponse,
  UpdateProfileData,
  ChangePasswordData,
} from '../types/auth.types';

// ============================================================================
// Authentication Service
// ============================================================================

export const authService = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return httpClient.post<AuthResponse>('/auth/login', credentials);
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    return httpClient.post<AuthResponse>('/auth/signup', data);
  },

  /**
   * Logout the current user
   */
  logout: async (): Promise<void> => {
    await httpClient.post<void>('/auth/logout');
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await httpClient.get<{ status: string; data: { user: User } }>('/users/me');
    return response.data.user;
  },

  /**
   * Send password reset email
   */
  forgotPassword: async (data: ForgotPasswordData): Promise<MessageResponse> => {
    return httpClient.post<MessageResponse>('/auth/request-password-reset', data);
  },

  /**
   * Reset password with token
   */
  resetPassword: async (data: ResetPasswordData): Promise<MessageResponse> => {
    // Backend only needs token and newPassword (confirmPassword is frontend validation only)
    const { token, newPassword } = data;
    return httpClient.post<MessageResponse>('/auth/reset-password', { token, newPassword });
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: UpdateProfileData): Promise<void> => {
    await httpClient.post<{ status: string; message: string }>('/users/update-profile', data);
  },

  /**
   * Change user password
   */
  changePassword: async (data: ChangePasswordData): Promise<MessageResponse> => {
    // Backend only needs currentPassword and newPassword (confirmPassword is frontend validation only)
    const { currentPassword, newPassword } = data;
    return httpClient.post<MessageResponse>('/users/change-password', { currentPassword, newPassword });
  },

  /**
   * Verify email with token
   */
  verifyEmail: async (token: string): Promise<MessageResponse> => {
    return httpClient.post<MessageResponse>('/auth/verify-email', { token });
  },

  /**
   * Resend verification email
   */
  resendVerificationEmail: async (): Promise<MessageResponse> => {
    return httpClient.post<MessageResponse>('/auth/resend-verification');
  },
};
