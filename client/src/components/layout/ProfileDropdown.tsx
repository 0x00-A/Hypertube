import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { User, Settings } from 'lucide-react';
import { useLogout } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { Avatar } from '../ui';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  userInitials: string;
  username?: string;
  avatarUrl?: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export default function ProfileDropdown({ isOpen, onClose, userInitials, username, avatarUrl, triggerRef }: ProfileDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const logoutMutation = useLogout();

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // If clicking the trigger button, let the trigger handle the toggle
      if (triggerRef.current && triggerRef.current.contains(target)) {
        return;
      }

      // Don't close if clicking on a link inside the dropdown (let navigation happen)
      // actually, we will handle closing on link click manually to be safe

      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleLogout = async () => {
    try {
      // Close dropdown immediately to provide feedback
      onClose();
      await logoutMutation.mutateAsync();
      toast.success('Logged out successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to logout';
      toast.error(errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-[calc(100%+8px)] w-56 bg-black rounded-xl border border-border shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* User Info Section */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar
            src={avatarUrl}
            alt={username || 'User'}
            fallback={userInitials}
            size="lg"
            className="ring-2 ring-primary"
          />
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-white truncate">
              {username || 'User'}
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border/50" />

      {/* Menu Items */}
      <div className="py-2">
        <Link
          to="/profile"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:text-white hover:bg-bg-tertiary transition-colors"
        >
          <User className="w-5 h-5" />
          <span>View profile</span>
        </Link>
        <Link
          to="/settings"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:text-white hover:bg-bg-tertiary transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
      </div>

      {/* Logout Button */}
      <div className="px-4 pb-4 pt-2">
        <button
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="w-full rounded-full bg-primary hover:bg-primary-light py-2.5 text-sm font-semibold text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>
  );
}
