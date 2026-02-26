import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { setGenre } from '../../redux/slices/movieFiltersSlice';
import { GENRES } from '../../types/movieFilter.types';

// ============================================================================
// FilterDropdown Component
// ============================================================================

interface FilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export default function FilterDropdown({ isOpen, onClose, triggerRef }: FilterDropdownProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedGenre = useAppSelector((state) => state.movieFilters.genre);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // If clicking the trigger button, let the trigger handle the toggle
      if (triggerRef.current && triggerRef.current.contains(target)) {
        return;
      }

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

  const handleGenreClick = (genre: string) => {
    dispatch(setGenre(genre));
    // Navigate to movies page with the selected genre
    navigate(`/library?genre=${encodeURIComponent(genre)}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-[calc(100%+8px)] w-[600px] max-w-[calc(100vw-2rem)] bg-black rounded-2xl border border-border shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden"
    >
      {/* Genre Grid with Dashed Border */}
      <div className="p-6">
        <div className="border-2 border-dashed border-border-light rounded-xl p-6 bg-sidebar-bg">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-10 gap-y-5">
            {GENRES.map((genre) => {
              const isSelected = selectedGenre === genre;
              return (
                <button
                  key={genre}
                  onClick={() => handleGenreClick(genre)}
                  className={clsx(
                    'flex items-center gap-2.5 text-sm font-medium transition-all duration-200',
                    'hover:scale-105 active:scale-95',
                    'whitespace-nowrap',
                    isSelected ? 'text-primary' : 'text-white hover:text-primary'
                  )}
                >
                  {/* Yellow Indicator Dot */}
                  <span className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />
                  <span className="text-left">{genre}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
