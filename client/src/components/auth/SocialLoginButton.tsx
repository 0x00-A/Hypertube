import type { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

type SocialProvider = 'google' | 'intra42';

interface SocialLoginButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  provider: SocialProvider;
}

const providerConfig = {
  google: {
    name: 'Google',
    icon: (
      <img 
        src="/images/logos/Google_Favicon_2025.svg" 
        alt="Google" 
        className="h-6 w-6"
      />
    ),
    bgColor: 'bg-gray-800 hover:bg-gray-700',
    textColor: 'text-white',
  },
  intra42: {
    name: '42',
    icon: (
      <img 
        src="/images/logos/42_Logo.svg" 
        alt="42" 
        className="h-6 w-6 invert"
      />
    ),
    bgColor: 'bg-gray-800 hover:bg-gray-700',
    textColor: 'text-white',
  },
};

export default function SocialLoginButton({
  provider,
  className,
  ...props
}: SocialLoginButtonProps) {
  const config = providerConfig[provider];

  return (
    <button
      type="button"
      className={clsx(
        'flex items-center justify-center gap-3 rounded-lg px-4 py-3 font-medium transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black',
        config.bgColor,
        config.textColor,
        'focus:ring-gray-400',
        className
      )}
      {...props}
    >
      {config.icon}
      <span className="sr-only">Continue with {config.name}</span>
    </button>
  );
}
