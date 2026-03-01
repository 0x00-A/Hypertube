import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import MovieSlideshow from '../../components/auth/MovieSlideshow';
import AuthInput from '../../components/auth/AuthInput';
import { useResetPassword } from '../../hooks/useAuth';

// Validation schema
const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const resetPasswordMutation = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Redirect to forgot password if no token
  useEffect(() => {
    if (!token) {
      navigate('/auth/forgot-password');
    }
  }, [token, navigate]);

  const onSubmit = (data: ResetPasswordFormData) => {
    if (!token) return;

    resetPasswordMutation.mutate({
      token,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword,
    });
  };

  if (!token) {
    return null;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-black">
      {/* Left Side - Movie Slideshow */}
      <div className="hidden lg:block lg:w-[60%]">
        <MovieSlideshow />
      </div>

      {/* Right Side - Reset Password Form */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-[40%]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md rounded-xl border border-border p-8"
        >
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/auth/login"
              className="mb-4 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-yellow-500"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
            <h1 className="text-4xl font-bold text-white">Reset Password</h1>
            <p className="mt-2 text-gray-400">
              Enter your new password below.
            </p>
          </div>

          {/* Reset Password Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* New Password Input */}
            <AuthInput
              {...register('newPassword')}
              type="password"
              placeholder="New Password"
              icon={Lock}
              error={errors.newPassword?.message}
            />

            {/* Confirm Password Input */}
            <AuthInput
              {...register('confirmPassword')}
              type="password"
              placeholder="Confirm New Password"
              icon={Lock}
              error={errors.confirmPassword?.message}
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="w-full rounded-lg bg-primary py-3 font-semibold text-black transition-colors duration-200 hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resetPasswordMutation.isPending ? 'Resetting Password...' : 'Reset Password'}
            </button>

            {/* Error Message */}
            {resetPasswordMutation.isError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/50 px-4 py-3 text-sm text-red-500">
                {resetPasswordMutation.error.message || 'Failed to reset password. Please try again or request a new reset link.'}
              </div>
            )}

            {/* Help Text */}
            <div className="text-center text-sm text-gray-400">
              Remember your password?{' '}
              <Link
                to="/auth/login"
                className="font-semibold text-yellow-500 transition-colors hover:text-yellow-400"
              >
                Sign In
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
