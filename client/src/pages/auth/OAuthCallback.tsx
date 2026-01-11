import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

/**
 * OAuthCallback Component
 *
 * Handles OAuth authentication callbacks from social providers (Google, 42).
 * This component:
 * - Validates OAuth callback status
 * - Shows loading/success/error states
 * - Redirects users to appropriate pages
 * - Prevents duplicate toast notifications
 */
export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent duplicate processing if React strict mode re-runs effect
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const status = searchParams.get('status');
    const error = searchParams.get('error');

    // Handle OAuth success
    if (status === 'oauth_success') {
      toast.success('Successfully logged in!', {
        id: 'oauth-success', // Prevents duplicate toasts
      });

      // Redirect after brief delay to show success state
      setTimeout(() => {
        navigate('/browse', { replace: true });
      }, 1000);
      return;
    }

    // Handle OAuth failure
    if (error === 'oauth_failed') {
      const errorMessage = searchParams.get('message') || 'Authentication failed. Please try again.';

      toast.error(errorMessage, {
        id: 'oauth-error', // Prevents duplicate toasts
        duration: 5000,
      });

      // Redirect to login after showing error
      setTimeout(() => {
        navigate('/auth/login', { replace: true });
      }, 2000);
      return;
    }

    // Handle invalid callback (no status or error parameter)
    toast.error('Invalid authentication callback', {
      id: 'oauth-invalid',
    });
    navigate('/auth/login', { replace: true });
  }, [searchParams, navigate]);

  // Determine UI state based on query parameters
  const status = searchParams.get('status');
  const error = searchParams.get('error');

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md rounded-xl border border-border bg-black p-8 text-center"
      >
        {/* Success State */}
        {status === 'oauth_success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10"
            >
              <CheckCircle className="h-10 w-10 text-green-500" />
            </motion.div>
            <h2 className="mb-2 text-2xl font-bold text-white">Success!</h2>
            <p className="text-gray-400">You've been successfully authenticated.</p>
            <p className="mt-2 text-sm text-gray-500">Redirecting you now...</p>
          </>
        )}

        {/* Error State */}
        {error === 'oauth_failed' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10"
            >
              <XCircle className="h-10 w-10 text-red-500" />
            </motion.div>
            <h2 className="mb-2 text-2xl font-bold text-white">Authentication Failed</h2>
            <p className="text-gray-400">
              {searchParams.get('message') || 'Something went wrong during authentication.'}
            </p>
            <p className="mt-2 text-sm text-gray-500">Redirecting to login...</p>
          </>
        )}

        {/* Loading State (fallback) */}
        {!status && !error && (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center"
            >
              <Loader2 className="h-10 w-10 text-primary" />
            </motion.div>
            <h2 className="mb-2 text-2xl font-bold text-white">Processing...</h2>
            <p className="text-gray-400">Please wait while we complete your authentication.</p>
          </>
        )}
      </motion.div>
    </div>
  );
}
