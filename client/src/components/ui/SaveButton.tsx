import { Save, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { SaveButtonProps } from '../../types/settings.types';

export const SaveButton = ({ 
  onClick, 
  disabled, 
  isLoading, 
  label = 'Save Changes',
  loadingLabel = 'Saving...',
  icon = <Save className="w-5 h-5" />
}: SaveButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={clsx(
      'flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200',
      !disabled && !isLoading
        ? 'bg-primary text-black hover:bg-primary-light'
        : 'bg-bg-tertiary text-text-disabled cursor-not-allowed border border-border'
    )}
  >
    {isLoading ? (
      <>
        <Loader2 className="w-5 h-5 animate-spin" />
        {loadingLabel}
      </>
    ) : (
      <>
        {icon}
        {label}
      </>
    )}
  </button>
);
