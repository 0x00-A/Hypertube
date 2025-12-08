import { type ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAppDispatch } from '../../redux/hooks';
import { clearUser } from '../../redux/slices/authSlice';
import { useInitializeAuth } from '../../hooks/useAuth';

// ============================================================================
// Auth Provider Component
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider - Initializes authentication state on app load
 * Place this component high in the component tree, after Redux and Query providers
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { isLoading, isInitialized } = useInitializeAuth();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Listen for unauthorized events from HTTP client
  useEffect(() => {
    const handleUnauthorized = () => {
      // This event is dispatched from http.ts on 401 errors
      dispatch(clearUser());
      queryClient.clear();
      navigate('/auth/login');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [dispatch, queryClient, navigate]);

  // Show loading screen while initializing auth
  if (!isInitialized && isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
