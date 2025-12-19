import { RotateCcw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  setSortBy,
  setSortOrder,
  setGenre,
  setMinRating,
  setYear,
  resetFilters,
} from '../../redux/slices/movieFiltersSlice';
import {
  SORT_OPTIONS,
  SORT_ORDER_OPTIONS,
  GENRES,
  YEARS,
  MIN_RATING_OPTIONS,
} from '../../types/movieFilter.types';
import { Select } from '../ui/Select';
import { clsx } from 'clsx';

// ============================================================================
// FilterBar Component
// ============================================================================

export const FilterBar = () => {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.movieFilters);

  const handleReset = () => {
    dispatch(resetFilters());
  };

  const hasActiveFilters = 
    filters.genre !== 'All' ||
    filters.minRating > 0 ||
    filters.year > 0 ||
    filters.sortBy !== 'lastUpdated' ||
    filters.sortOrder !== 'desc';

  return (
    <div className="w-full bg-bg-tertiary rounded-xl mb-6">
      <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
        {/* Sort By */}
        <div className="flex-1 min-w-[140px]">
          <Select
            label="Sort"
            value={filters.sortBy}
            onChange={(value) => dispatch(setSortBy(value))}
            options={SORT_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
          />
        </div>

        {/* Sort Order */}
        <div className="flex-1 min-w-[140px]">
          <Select
            label="Order"
            value={filters.sortOrder}
            onChange={(value) => dispatch(setSortOrder(value as 'asc' | 'desc'))}
            options={SORT_ORDER_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
          />
        </div>

        {/* Genre */}
        <div className="flex-1 min-w-[140px]">
          <Select
            label="Genre"
            value={filters.genre}
            onChange={(value) => dispatch(setGenre(value))}
            options={GENRES.map((genre) => ({ value: genre, label: genre }))}
          />
        </div>

        {/* Min Rating */}
        <div className="flex-1 min-w-[140px]">
          <Select
            label="Rating"
            value={filters.minRating}
            onChange={(value) => dispatch(setMinRating(Number(value)))}
            options={MIN_RATING_OPTIONS.map((opt) => ({ 
              value: String(opt.value), 
              label: opt.label 
            }))}
          />
        </div>

        {/* Year */}
        <div className="flex-1 min-w-[140px]">
          <Select
            label="Year"
            value={filters.year}
            onChange={(value) => dispatch(setYear(Number(value)))}
            options={YEARS.map((year) => ({ 
              value: year === 'All' ? '0' : String(year), 
              label: String(year) 
            }))}
          />
        </div>

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className={clsx(
              'flex items-center gap-2 h-10 px-4 rounded-lg',
              'bg-bg-card hover:bg-primary/10 text-text-secondary hover:text-primary',
              'border border-transparent hover:border-primary/30',
              'transition-all duration-200 text-sm font-medium whitespace-nowrap shadow-sm'
            )}
            aria-label="Reset all filters"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
