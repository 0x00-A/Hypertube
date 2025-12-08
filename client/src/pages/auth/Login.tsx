import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import MovieSlideshow from '../../components/auth/MovieSlideshow';
import AuthInput from '../../components/auth/AuthInput';
import SocialLoginButton from '../../components/auth/SocialLoginButton';
import { useLogin } from '../../hooks/useAuth';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [rememberMe, setRememberMe] = useState(false);
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
      },
    });
  };

  const handleSocialLogin = (provider: string) => {
    // TODO: Implement OAuth flow
    toast.success(`${provider} login coming soon`);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-black">
      {/* Left Side - Movie Slideshow */}
      <div className="hidden lg:block lg:w-[60%]">
        <MovieSlideshow />
      </div>

      {/* Right Side - Login Form */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-[40%]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md rounded-xl border border-gray-800 p-8"
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white">login</h1>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Input */}
            <AuthInput
              {...register('email')}
              type="email"
              placeholder="Email"
              icon={Mail}
              error={errors.email?.message}
            />

            {/* Password Input */}
            <AuthInput
              {...register('password')}
              type="password"
              placeholder="Password"
              icon={Lock}
              error={errors.password?.message}
            />

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-700 bg-transparent text-yellow-500 focus:ring-yellow-500 focus:ring-offset-black"
                />
                Remember Me
              </label>
              <Link
                to="/auth/forgot-password"
                className="text-sm text-gray-400 transition-colors hover:text-yellow-500"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full rounded-lg bg-gray-300 py-3 font-semibold text-black transition-colors duration-200 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loginMutation.isPending ? 'Logging in...' : 'Login'}
            </button>

            {/* Error Message */}
            {loginMutation.isError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/50 px-4 py-3 text-sm text-red-500">
                {loginMutation.error.message || 'Login failed. Please try again.'}
              </div>
            )}

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-black px-4 text-gray-400">Continue With</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <SocialLoginButton
                provider="google"
                onClick={() => handleSocialLogin('google')}
              />
              <SocialLoginButton
                provider="intra42"
                onClick={() => handleSocialLogin('intra42')}
              />
            </div>

            {/* Sign Up Link */}
            <div className="text-center text-sm text-gray-400">
              Don't have an account?{' '}
              <Link
                to="/auth/register"
                className="font-semibold text-yellow-500 transition-colors hover:text-yellow-400"
              >
                Create Account!
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

