import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import MovieSlideshow from '../../components/auth/MovieSlideshow';
import AuthInput from '../../components/auth/AuthInput';
import { useForgotPassword } from '../../hooks/useAuth';

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const forgotPasswordMutation = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPasswordMutation.mutate(data, {
      onSuccess: () => {
        setEmailSent(true);
        setSubmittedEmail(data.email);
      },
    });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-black">
      {/* Left Side - Movie Slideshow */}
      <div className="hidden lg:block lg:w-[60%]">
        <MovieSlideshow />
      </div>

      {/* Right Side - Forgot Password Form */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-[40%]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md rounded-xl border border-border p-8"
        >
          {!emailSent ? (
            <>
              {/* Header */}
              <div className="mb-8">
                <Link
                  to="/auth/login"
                  className="mb-4 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-yellow-500"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
                <h1 className="text-4xl font-bold text-white">Forgot Password?</h1>
                <p className="mt-2 text-gray-400">
                  No worries! Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              {/* Forgot Password Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email Input */}
                <AuthInput
                  {...register('email')}
                  type="email"
                  placeholder="Enter your email"
                  icon={Mail}
                  error={errors.email?.message}
                />

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={forgotPasswordMutation.isPending}
                  className="w-full rounded-lg bg-primary py-3 font-semibold text-black transition-colors duration-200 hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {forgotPasswordMutation.isPending ? 'Sending...' : 'Send Reset Link'}
                </button>

                {/* Error Message */}
                {forgotPasswordMutation.isError && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/50 px-4 py-3 text-sm text-red-500">
                    {forgotPasswordMutation.error.message || 'Failed to send reset email. Please try again.'}
                  </div>
                )}
              </form>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center">
                <div className="mb-6 flex justify-center">
                  <div className="rounded-full bg-green-500/20 p-4">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                  </div>
                </div>
                <h1 className="mb-3 text-3xl font-bold text-white">Check Your Email</h1>
                <p className="mb-6 text-gray-400">
                  We've sent a password reset link to <span className="font-semibold text-white">{submittedEmail}</span>
                </p>
                <p className="mb-8 text-sm text-gray-500">
                  Didn't receive the email? Check your spam folder or{' '}
                  <button
                    onClick={() => setEmailSent(false)}
                    className="font-semibold text-yellow-500 transition-colors hover:text-yellow-400"
                  >
                    try another email address
                  </button>
                </p>
                <Link
                  to="/auth/login"
                  className="inline-flex items-center gap-2 rounded-lg bg-bg-tertiary px-6 py-3 font-medium text-text-primary transition-colors hover:bg-bg-tertiary/80"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
