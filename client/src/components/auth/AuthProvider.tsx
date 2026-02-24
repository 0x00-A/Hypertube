import { type ReactNode, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAppDispatch } from '../../redux/hooks';
import { clearUser, setUser } from '../../redux/slices/authSlice';
import { useInitializeAuth } from '../../hooks/useAuth';
import { REDIRECT_KEY } from '../../constants/auth';
import { authService } from '../../services/auth.service';
import { queryKeys } from '../../config/queryClient';

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

      // Clean up query params
      setSearchParams({});

      // Fetch user data after OAuth success and update state
      (async () => {
        try {
          const userData = await authService.getCurrentUser();
          // Update Redux state with user data (including avatarUrl)
          dispatch(setUser(userData));
          // Cache user data in React Query
          queryClient.setQueryData(queryKeys.auth.currentUser(), userData);
          toast.success('Successfully logged in!');
        } catch {
          toast.error('Failed to fetch user data. Please try again.');
        }
        // Navigate to saved path or browse
        navigate(redirectPath || '/browse', { replace: true });
      })();
    } else if (error === 'oauth_failed') {
      oauthHandledRef.current = true;
      toast.error('OAuth authentication failed. Please try again.');
      // Clean up query params
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, navigate, dispatch, queryClient]);

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
      <div className="flex h-screen items-center justify-center bg-bg-primary overflow-hidden">
        <div className="text-center">
          <svg 
            width="252" 
            height="60" 
            viewBox="0 0 252 60" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-auto mx-auto mb-6"
          >
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D4A017" />
                <stop offset="50%" stopColor="#F5C518" />
                <stop offset="100%" stopColor="#D4A017" />
                <animate attributeName="x1" values="0%;100%;0%" dur="3s" repeatCount="indefinite" />
                <animate attributeName="x2" values="100%;200%;100%" dur="3s" repeatCount="indefinite" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <g filter="url(#glow)">
              {/* L - slides in from left */}
              <path d="M10.516 8.33008C7.01066 8.92436 3.50533 9.579 0 10.3543V49.6651C8.09708 51.4155 16.1895 52.6923 24.2866 53.8112V44.8598C19.6949 44.4559 15.1077 44.0334 10.516 43.5366V8.33008Z" fill="url(#logoGradient)">
                <animateTransform attributeName="transform" type="translate" from="-100,0" to="0,0" dur="1s" fill="freeze" />
                <animate attributeName="opacity" from="0" to="1" dur="1s" fill="freeze" />
              </path>
              {/* E - slides in from top-left */}
              <path d="M55.7648 13.4139V2.7865C46.9528 3.49221 38.1407 4.43934 29.3286 5.54898V54.4704C38.1407 55.5754 46.9528 56.5225 55.7648 57.2329V46.6055C50.4581 46.3501 45.1514 46.0158 39.8446 45.6815V34.4041L53.9216 34.6363V24.4592L39.8446 24.7378V14.3378C45.1467 13.9989 50.4581 13.6693 55.7648 13.4139Z" fill="url(#logoGradient)">
                <animateTransform attributeName="transform" type="translate" from="-80,-50" to="0,0" dur="1s" begin="0.15s" fill="freeze" />
                <animate attributeName="opacity" from="0" to="1" dur="1s" begin="0.15s" fill="freeze" />
              </path>
              {/* E - slides in from bottom-left */}
              <path d="M89.0214 12.1696V0.748291C84.6154 0.892219 80.2094 1.14293 75.8033 1.389C71.3973 1.59793 66.9912 1.95078 62.5852 2.24792V57.7807C66.9912 58.0779 71.3973 58.4307 75.8033 58.6397C80.2094 58.8811 84.6154 59.1318 89.0214 59.2804V47.859C83.7147 47.7569 78.4079 47.5479 73.1012 47.3808V34.887L87.1782 35.0077V24.0228L73.1012 24.1713V12.6478C78.4079 12.4807 83.7147 12.2718 89.0214 12.1696Z" fill="url(#logoGradient)">
                <animateTransform attributeName="transform" type="translate" from="-60,50" to="0,0" dur="1s" begin="0.3s" fill="freeze" />
                <animate attributeName="opacity" from="0" to="1" dur="1s" begin="0.3s" fill="freeze" />
              </path>
              {/* T - slides in from top */}
              <path d="M93.511 0.571867V12.0629C97.3227 11.9607 101.135 11.9096 104.946 11.8539V59.7911C108.452 59.8654 111.957 59.9304 115.462 59.9629V11.7471L126.898 11.71V0.000799647C115.769 -0.0131288 104.64 0.154013 93.511 0.571867Z" fill="url(#logoGradient)">
                <animateTransform attributeName="transform" type="translate" from="0,-80" to="0,0" dur="1s" begin="0.45s" fill="freeze" />
                <animate attributeName="opacity" from="0" to="1" dur="1s" begin="0.45s" fill="freeze" />
              </path>
              {/* F - slides in from top-right */}
              <path d="M132.181 0.0194092V60C135.686 59.9675 139.192 59.9397 142.692 59.87V35.7088L155.85 35.6438V24.4546L142.692 24.3942V11.8075C148.552 11.8725 154.416 11.9654 160.275 12.114V0.655475C150.915 0.265478 141.546 0.0936943 132.181 0.0194092Z" fill="url(#logoGradient)">
                <animateTransform attributeName="transform" type="translate" from="60,-50" to="0,0" dur="1s" begin="0.6s" fill="freeze" />
                <animate attributeName="opacity" from="0" to="1" dur="1s" begin="0.6s" fill="freeze" />
              </path>
              {/* L - slides in from right */}
              <path d="M176.325 1.41222C172.82 1.2358 169.315 0.999013 165.814 0.873657V59.1504C173.911 58.7882 182.003 58.31 190.101 57.7111V47.2926C185.509 47.4783 180.922 47.7197 176.33 47.8544V1.41222H176.325Z" fill="url(#logoGradient)">
                <animateTransform attributeName="transform" type="translate" from="100,0" to="0,0" dur="1s" begin="0.75s" fill="freeze" />
                <animate attributeName="opacity" from="0" to="1" dur="1s" begin="0.75s" fill="freeze" />
              </path>
              {/* I - slides in from bottom-right */}
              <path d="M195.138 2.7168V57.3025C198.643 57.0053 202.149 56.7268 205.654 56.3553V3.66393C202.149 3.29251 198.643 3.01394 195.138 2.7168Z" fill="url(#logoGradient)">
                <animateTransform attributeName="transform" type="translate" from="80,50" to="0,0" dur="1s" begin="0.9s" fill="freeze" />
                <animate attributeName="opacity" from="0" to="1" dur="1s" begin="0.9s" fill="freeze" />
              </path>
              {/* X - slides in from bottom with scale */}
              <path d="M251.943 49.6651C247.189 44.2051 242.434 37.5473 237.68 30.1977C242.249 22.7088 246.822 15.8978 251.39 10.2336C247.416 9.36999 243.437 8.67357 239.463 7.99571C236.923 12.0257 234.379 16.2878 231.839 20.8238C228.952 15.986 226.059 10.8975 223.171 5.63252C219.095 5.08002 215.014 4.66217 210.938 4.1886C215.65 13.1725 220.362 21.6735 225.08 29.5988C220.469 37.7794 215.859 46.5404 211.249 55.7982C215.223 55.3339 219.202 54.9254 223.176 54.3868C225.757 49.0893 228.339 43.959 230.925 39.0469C233.854 43.6572 236.784 47.9658 239.714 51.9818C243.785 51.29 247.867 50.5658 251.943 49.6651Z" fill="url(#logoGradient)">
                <animateTransform attributeName="transform" type="translate" from="0,60" to="0,0" dur="1s" begin="1.05s" fill="freeze" />
                <animate attributeName="opacity" from="0" to="1" dur="1s" begin="1.05s" fill="freeze" />
              </path>
            </g>
            {/* Glow pulse after letters assemble */}
            <g filter="url(#glow)" opacity="0">
              <animate attributeName="opacity" values="0;0;0.3;0" dur="2s" begin="1.5s" repeatCount="indefinite" />
              <circle cx="126" cy="30" r="100" fill="#F5C518" opacity="0.1" />
            </g>
          </svg>
          <div className="h-1 w-48 mx-auto bg-border rounded-full overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent animate-[shimmer_2s_ease-in-out_infinite]" 
                 style={{ width: '50%' }} />
          </div>
          <p className="text-text-secondary text-sm mt-4 animate-pulse">Loading your experience...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
