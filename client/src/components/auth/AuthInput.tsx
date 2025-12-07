import { useState, forwardRef, InputHTMLAttributes } from 'react';
import { Eye, EyeOff, type Icon } from 'lucide-react';
import { clsx } from 'clsx';

interface AuthInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  icon?: Icon;
  error?: string;
  type?: 'text' | 'email' | 'password';
}

const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, icon: Icon, error, type = 'text', className, placeholder, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputType = type === 'password' && showPassword ? 'text' : type;

    return (
      <div className="w-full">
        <div className="relative">
          {/* Input Field */}
          <input
            ref={ref}
            type={inputType}
            placeholder={placeholder || label}
            className={clsx(
              'w-full border-b bg-transparent px-0 py-3 text-white transition-colors duration-200',
              'placeholder:text-white focus:outline-none',
              type === 'password' && 'pr-10',
              Icon && 'pr-10',
              error
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-700 focus:border-white',
              className
            )}
            {...props}
          />

          {/* Right Icon */}
          {Icon && !type.includes('password') && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
              <Icon className="h-5 w-5 text-gray-400" />
            </div>
          )}

          {/* Password Visibility Toggle */}
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center text-gray-400 transition-colors hover:text-gray-300"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';

export default AuthInput;
