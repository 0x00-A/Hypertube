import { httpClient } from './http';
import { navigateTo } from '../utils/navigation';
import type { LoginCredentials, RegisterData, AuthResponse, User } from '../types/auth.types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return httpClient.post<AuthResponse>('/auth/login', credentials);
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    return httpClient.post<AuthResponse>('/auth/register', data);
  },

  async logout(): Promise<void> {
    try {
      await httpClient.post('/auth/logout');
      navigateTo('/auth/login');
    } catch (error) {
      // Still redirect to login even if logout fails (session might be expired)
      navigateTo('/auth/login');
      throw error;
    }
  },

  async getCurrentUser(): Promise<User> {
    return httpClient.get<User>('/auth/me');
  },
};
