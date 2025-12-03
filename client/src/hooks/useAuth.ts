import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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

export const useLogin = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (response) => {
      // Update Redux state
      dispatch(setUser(response.user));
      
      // Cache user data in React Query
      queryClient.setQueryData(queryKeys.auth.currentUser(), response.user);
      
      // Navigate to home page
      navigate('/');
    },
    onError: (error: AuthError) => {
      console.error('Login failed:', error);
    },
  });
};

// ============================================================================
// Register Mutation Hook
// ============================================================================

export const useRegister = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: (response) => {
      // Update Redux state
      dispatch(setUser(response.user));
      
      // Cache user data in React Query
      queryClient.setQueryData(queryKeys.auth.currentUser(), response.user);
      
      // Navigate to home page
      navigate('/');
    },
    onError: (error: AuthError) => {
      console.error('Registration failed:', error);
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
      
      // Navigate to login page
      navigate('/auth/login');
    },
    onError: (error: AuthError) => {
      // Even if logout fails on server, clear local state
      dispatch(clearUser());
      queryClient.clear();
      navigate('/auth/login');
      
      console.error('Logout failed:', error);
    },
  });
};

// ============================================================================
// Forgot Password Mutation Hook
// ============================================================================

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (data: ForgotPasswordData) => authService.forgotPassword(data),
    onError: (error: AuthError) => {
      console.error('Forgot password failed:', error);
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
      // Navigate to login page after successful reset
      navigate('/auth/login');
    },
    onError: (error: AuthError) => {
      console.error('Reset password failed:', error);
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
    },
    onError: (error: AuthError, _variables, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(queryKeys.auth.currentUser(), context.previousUser);
        dispatch(setUser(context.previousUser));
      }
      
      console.error('Update profile failed:', error);
    },
  });
};

// ============================================================================
// Change Password Mutation Hook
// ============================================================================

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordData) => authService.changePassword(data),
    onError: (error: AuthError) => {
      console.error('Change password failed:', error);
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
      navigate('/');
    },
    onError: (error: AuthError) => {
      console.error('Email verification failed:', error);
    },
  });
};

// ============================================================================
// Resend Verification Email Mutation Hook
// ============================================================================

export const useResendVerificationEmail = () => {
  return useMutation({
    mutationFn: authService.resendVerificationEmail,
    onError: (error: AuthError) => {
      console.error('Resend verification email failed:', error);
    },
  });
};
