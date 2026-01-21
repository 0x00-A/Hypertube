import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/auth.service';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { setUser, clearUser, updateUser, initializeAuth } from '../redux/slices/authSlice';
import { queryKeys } from '../config/queryClient';
import type {
  LoginCredentials,
  RegisterData,
  ForgotPasswordData,
  ResetPasswordData,
  UpdateProfileData,
  ChangePasswordData,
  AuthError,
  User,
} from '../types/auth.types';
import { useEffect } from 'react';

// ============================================================================
// Auth State Hook
// ============================================================================

export const useAuthState = () => {
  return useAppSelector((state) => state.auth);
};

// ============================================================================
// Current User Query Hook
// ============================================================================

export const useCurrentUser = (enabled = true) => {
  return useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: authService.getCurrentUser,
    enabled,
    retry: false,
    staleTime: Infinity, // User data doesn't change often
  });
};

// ============================================================================
// Initialize Auth Hook
// ============================================================================

export const useInitializeAuth = () => {
  const dispatch = useAppDispatch();
  const { isInitialized } = useAuthState();

  const { isLoading, data, error } = useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: authService.getCurrentUser,
    enabled: !isInitialized,
    retry: false,
    staleTime: Infinity,
  });
  console.log("profile: ", data)

  useEffect(() => {
    if (!isInitialized) {
      if (data) {
        dispatch(initializeAuth(data));
      } else if (error) {
        dispatch(initializeAuth(null));
      }
    }
  }, [data, error, isInitialized, dispatch]);

  return { isLoading, isInitialized };
};

// ============================================================================
// Login Mutation Hook
// ============================================================================

import { REDIRECT_KEY } from '../constants/auth';

export const useLogin = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: async () => {
      toast.success('Login successful!');

      // Fetch user data from /profile/me after successful login
      try {
        const userData = await authService.getCurrentUser();

        // Update Redux state
        dispatch(setUser(userData));

        // Cache user data in React Query
        queryClient.setQueryData(queryKeys.auth.currentUser(), userData);

        // Check for saved redirect path
        const redirectPath = sessionStorage.getItem(REDIRECT_KEY);
        sessionStorage.removeItem(REDIRECT_KEY);

        // Navigate to saved path or home
        navigate(redirectPath || '/');
      } catch {
        toast.error('Failed to fetch user data. Please try again.');
      }
    },
    onError: (error: AuthError) => {
      toast.error(error.message || 'Login failed. Please try again.');
    },
  });
};

// ============================================================================
// Register Mutation Hook
// ============================================================================

export const useRegister = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: () => {
      toast.success('Registration successful! Please check your email to verify your account.');

      // Navigate to login page
      navigate('/auth/login');
    },
    onError: (error: AuthError) => {
      toast.error(error.message || 'Registration failed. Please try again.');
    },
  });
};

// ============================================================================
// Logout Mutation Hook
// ============================================================================

export const useLogout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      // Clear Redux state
      dispatch(clearUser());

      // Clear all React Query cache
      queryClient.clear();

      // Navigate to browse page (public page)
      navigate('/browse');
    },
    onError: () => {
      // Even if logout fails on server, clear local state
      dispatch(clearUser());
      queryClient.clear();
      navigate('/browse');
    },
  });
};

// ============================================================================
// Forgot Password Mutation Hook
// ============================================================================

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (data: ForgotPasswordData) => authService.forgotPassword(data),
    onSuccess: () => {
      toast.success('Password reset email sent! Check your inbox.');
    },
    onError: (error: AuthError) => {
      toast.error(error.message || 'Failed to send reset email. Please try again.');
    },
  });
};

// ============================================================================
// Reset Password Mutation Hook
// ============================================================================

export const useResetPassword = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: ResetPasswordData) => authService.resetPassword(data),
    onSuccess: () => {
      toast.success('Password reset successful! You can now log in.');
      // Navigate to login page after successful reset
      navigate('/auth/login');
    },
    onError: (error: AuthError) => {
      toast.error(error.message || 'Password reset failed. Please try again.');
    },
  });
};

// ============================================================================
// Update Profile Mutation Hook
// ============================================================================

export const useUpdateProfile = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileData) => authService.updateProfile(data),
    onMutate: async (data) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.auth.currentUser() });

      // Snapshot previous value
      const previousUser = queryClient.getQueryData<User>(queryKeys.auth.currentUser());

      // Optimistically update Redux and cache
      if (previousUser) {
        dispatch(updateUser(data));
      }

      return { previousUser };
    },
    onSuccess: (updatedUser) => {
      // Update Redux state with server response
      dispatch(setUser(updatedUser));

      // Update cache
      queryClient.setQueryData(queryKeys.auth.currentUser(), updatedUser);

      toast.success('Profile updated successfully!');
    },
    onError: (error: AuthError, _variables, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(queryKeys.auth.currentUser(), context.previousUser);
        dispatch(setUser(context.previousUser));
      }

      toast.error(error.message || 'Failed to update profile. Please try again.');
    },
  });
};

// ============================================================================
// Change Password Mutation Hook
// ============================================================================

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordData) => authService.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully!');
    },
    onError: (error: AuthError) => {
      toast.error(error.message || 'Failed to change password. Please try again.');
    },
  });
};

// ============================================================================
// Verify Email Mutation Hook
// ============================================================================

export const useVerifyEmail = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (token: string) => authService.verifyEmail(token),
    onSuccess: () => {
      toast.success('Email verified successfully!');
      navigate('/');
    },
    onError: (error: AuthError) => {
      toast.error(error.message || 'Email verification failed. Please try again.');
    },
  });
};

// ============================================================================
// Resend Verification Email Mutation Hook
// ============================================================================

export const useResendVerificationEmail = () => {
  return useMutation({
    mutationFn: authService.resendVerificationEmail,
    onSuccess: () => {
      toast.success('Verification email sent! Check your inbox.');
    },
    onError: (error: AuthError) => {
      toast.error(error.message || 'Failed to resend verification email.');
    },
  });
};
