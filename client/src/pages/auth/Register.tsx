import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';
import MovieSlideshow from '../../components/auth/MovieSlideshow';
import AuthInput from '../../components/auth/AuthInput';
import SocialLoginButton from '../../components/auth/SocialLoginButton';
import { useRegister } from '../../hooks/useAuth';

// Validation schema
const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be less than 20 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormData) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  const handleSocialRegister = (provider: string) => {
    // TODO: Implement OAuth flow
    toast.success(`${provider} registration coming soon`);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-black">
      {/* Left Side - Movie Slideshow */}
      <div className="hidden lg:block lg:w-[60%]">
        <MovieSlideshow />
      </div>

      {/* Right Side - Register Form */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-[40%]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md rounded-xl border border-gray-800 p-8"
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white">create account</h1>
            <p className="mt-2 text-sm text-gray-400">
              Join Hypertube and start streaming today
            </p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Username Input */}
            <AuthInput
              {...register('username')}
              type="text"
              placeholder="Username"
              icon={User}
              error={errors.username?.message}
            />

            {/* Email Input */}
            <AuthInput
              {...register('email')}
              type="email"
              placeholder="Email"
              icon={Mail}
              error={errors.email?.message}
            />

            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <AuthInput
                {...register('firstName')}
                type="text"
                placeholder="First Name (Optional)"
                error={errors.firstName?.message}
              />
              <AuthInput
                {...register('lastName')}
                type="text"
                placeholder="Last Name (Optional)"
                error={errors.lastName?.message}
              />
            </div>

            {/* Password Input */}
            <AuthInput
              {...register('password')}
              type="password"
              placeholder="Password"
              icon={Lock}
              error={errors.password?.message}
            />

            {/* Confirm Password Input */}
            <AuthInput
              {...register('confirmPassword')}
              type="password"
              placeholder="Confirm Password"
              icon={Lock}
              error={errors.confirmPassword?.message}
            />

            {/* Terms and Conditions */}
            <div className="text-xs text-gray-400">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-yellow-500 hover:text-yellow-400">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-yellow-500 hover:text-yellow-400">
                Privacy Policy
              </Link>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full rounded-lg bg-gray-300 py-3 font-semibold text-black transition-colors duration-200 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
            </button>

            {/* Error Message */}
            {registerMutation.isError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/50 px-4 py-3 text-sm text-red-500">
                {registerMutation.error.message || 'Registration failed. Please try again.'}
              </div>
            )}

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-black px-4 text-gray-400">Or continue with</span>
              </div>
            </div>

            {/* Social Register Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <SocialLoginButton
                provider="google"
                onClick={() => handleSocialRegister('google')}
              />
              <SocialLoginButton
                provider="intra42"
                onClick={() => handleSocialRegister('intra42')}
              />
            </div>

            {/* Login Link */}
            <div className="text-center text-sm text-gray-400">
              Already have an account?{' '}
              <Link
                to="/auth/login"
                className="font-semibold text-yellow-500 transition-colors hover:text-yellow-400"
              >
                Log In!
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

