import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { useVerifyEmail } from '../../hooks/useAuth';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [verificationState, setVerificationState] = useState<'loading' | 'success' | 'error'>('loading');
  
  const verifyEmailMutation = useVerifyEmail();

  useEffect(() => {
    if (!token) {
      setVerificationState('error');
      return;
    }

    // Trigger verification
    verifyEmailMutation.mutate(token, {
      onSuccess: () => {
        setVerificationState('success');
      },
      onError: () => {
        setVerificationState('error');
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-black px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md rounded-xl border border-border bg-bg-card p-8 text-center"
      >
        {/* Loading State */}
        {verificationState === 'loading' && (
          <div className="space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Verifying Email</h1>
              <p className="mt-3 text-text-secondary">
                Please wait while we verify your email address...
              </p>
            </div>
          </div>
        )}

        {/* Success State */}
        {verificationState === 'success' && (
          <div className="space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Email Verified!</h1>
              <p className="mt-3 text-text-secondary">
                Your email has been successfully verified. You can now access all features of Hypertube.
              </p>
            </div>
            <Link
              to="/auth/login"
              className="inline-block w-full rounded-lg bg-primary px-6 py-3 font-semibold text-black transition-colors hover:bg-primary-light"
            >
              Go to Login
            </Link>
          </div>
        )}

        {/* Error State */}
        {verificationState === 'error' && (
          <div className="space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-error/10">
              <XCircle className="h-10 w-10 text-error" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Verification Failed</h1>
              <p className="mt-3 text-text-secondary">
                {!token
                  ? 'No verification token found in the URL.'
                  : 'The verification link is invalid or has expired.'}
              </p>
            </div>
            <div className="space-y-3">
              <Link
                to="/auth/register"
                className="inline-block w-full rounded-lg bg-primary px-6 py-3 font-semibold text-black transition-colors hover:bg-primary-light"
              >
                Register Again
              </Link>
              <Link
                to="/auth/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-6 py-3 font-semibold text-white transition-colors hover:bg-bg-tertiary"
              >
                <Mail className="h-5 w-5" />
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
