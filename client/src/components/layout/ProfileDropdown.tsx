import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Settings, LogOut } from 'lucide-react';
import { useLogout } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  userInitials: string;
  username?: string;
}

export default function ProfileDropdown({ isOpen, onClose, userInitials, username }: ProfileDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const logoutMutation = useLogout();

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Small delay to prevent immediate closing when clicking profile button
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

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
      await logoutMutation.mutateAsync();
      onClose();
      navigate('/browse');
      toast.success('Logged out successfully');
    } catch {
      toast.error('Failed to logout');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-[calc(100%+8px)] w-56 bg-bg-tertiary rounded-lg border border-border shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* User Info Section */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-black">{userInitials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {username || 'User'}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-2">
        <Link
          to="/profile"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors"
        >
          <User className="w-4 h-4" />
          <span>View Profile</span>
        </Link>

        <Link
          to="/settings"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Link>

        <div className="my-1.5 border-t border-border" />

        <button
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-accent-red hover:text-accent-red/90 hover:bg-bg-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="w-4 h-4" />
          <span>{logoutMutation.isPending ? 'Logging out...' : 'Logout'}</span>
        </button>
      </div>
    </div>
  );
}
