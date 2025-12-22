import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { clsx } from 'clsx';

// ============================================================================
// Types
// ============================================================================

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

// ============================================================================
// Custom Select Component
// ============================================================================

export const Select = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className,
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get the currently selected option
  const selectedOption = options.find((opt) => opt.value === String(value));
  const displayValue = selectedOption?.label || placeholder;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={selectRef} className={clsx('relative', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={clsx(
          'w-full h-10 px-3 pr-8 rounded-lg',
          'bg-bg-card text-white text-sm font-medium text-left',
          'border border-transparent hover:border-primary/30',
          'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50',
          'transition-all duration-200 cursor-pointer shadow-sm',
          'flex items-center justify-between gap-2'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label || 'Select option'}
      >
        <span className="truncate">
          {label && <span className="text-text-secondary">{label}: </span>}
          {displayValue}
        </span>
        <ChevronDown
          className={clsx(
            'w-4 h-4 text-text-secondary transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={clsx(
            'absolute top-full left-0 right-0 mt-1 z-50',
            'bg-bg-card rounded-lg border border-border shadow-lg',
            'animate-in fade-in slide-in-from-top-2 duration-200',
            'max-h-[300px] overflow-y-auto custom-scrollbar'
          )}
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = option.value === String(value);
            
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={clsx(
                  'w-full px-3 py-2.5 text-left text-sm',
                  'flex items-center justify-between gap-2',
                  'transition-colors duration-150',
                  isSelected
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-white hover:bg-bg-tertiary'
                )}
                role="option"
                aria-selected={isSelected}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="w-4 h-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
