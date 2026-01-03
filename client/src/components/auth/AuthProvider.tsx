import { type ReactNode, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAppDispatch } from '../../redux/hooks';
import { clearUser } from '../../redux/slices/authSlice';
import { useInitializeAuth } from '../../hooks/useAuth';

const REDIRECT_KEY = 'auth_redirect_path';

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
  const [searchParams, setSearchParams] = useSearchParams();

  // Track if OAuth callback was already handled to prevent double execution
  const oauthHandledRef = useRef(false);

  // Handle OAuth callback (Google/Intra42)
  // Backend redirects to CLIENT_URL?status=oauth_success after successful OAuth
  useEffect(() => {
    const status = searchParams.get('status');
    const error = searchParams.get('error');

    // Prevent double execution - setSearchParams triggers re-render
    if (oauthHandledRef.current) {
      return;
    }

    if (status === 'oauth_success') {
      // Mark as handled BEFORE doing anything
      oauthHandledRef.current = true;

      // Get redirect path BEFORE clearing anything
      const redirectPath = sessionStorage.getItem(REDIRECT_KEY);
      sessionStorage.removeItem(REDIRECT_KEY);

      toast.success('Successfully logged in!');

      // Clean up query params
      setSearchParams({});

      // Navigate to saved path or browse
      navigate(redirectPath || '/browse', { replace: true });
    } else if (error === 'oauth_failed') {
      oauthHandledRef.current = true;
      toast.error('OAuth authentication failed. Please try again.');
      // Clean up query params
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, navigate]);

  // Listen for unauthorized events from HTTP client
  useEffect(() => {
    const handleUnauthorized = () => {
      // This event is dispatched from http.ts on 401 errors
      dispatch(clearUser());
      queryClient.clear();
      // navigate('/auth/login');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [dispatch, queryClient, navigate]);

  // Show loading screen while initializing auth
  if (!isInitialized && isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary mx-auto" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
