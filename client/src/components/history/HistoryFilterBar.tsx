import { Search, RotateCcw } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  setHistorySortBy,
  setHistorySortOrder,
  setHistoryGenre,
  setHistoryMinRating,
  setHistoryYear,
  setHistorySearch,
  resetHistoryFilters,
} from "../../redux/slices/historyFiltersSlice";
import {
  SORT_OPTIONS,
  SORT_ORDER_OPTIONS,
  GENRES,
  YEARS,
  MIN_RATING_OPTIONS,
} from "../../types/movieFilter.types";
import { Select } from "../ui/Select";
import { clsx } from "clsx";
import { useState, useEffect } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import { hasActiveHistoryFilters } from "../../utils/filterHelpers";

const HISTORY_SORT_OPTIONS = [
  { value: "lastUpdated", label: "Recently Watched" },
  ...SORT_OPTIONS.filter((opt) => opt.value !== "lastUpdated"),
];

export const HistoryFilterBar = () => {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.historyFilters);
  const [localSearch, setLocalSearch] = useState(filters.search);
  const debouncedSearch = useDebounce(localSearch, 500);

  useEffect(() => {
    dispatch(setHistorySearch(debouncedSearch));
  }, [debouncedSearch, dispatch]);

  const handleReset = () => {
    dispatch(resetHistoryFilters());
    setLocalSearch("");
  };

  const hasActiveFiltersValue = hasActiveHistoryFilters(filters);

  return (
    <div className="w-full space-y-4 mb-8">
      {/* Search Bar */}
      <div className="relative group">
        <input
          type="text"
          placeholder="Search your watch history..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-bg-tertiary border border-border rounded-2xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-lg group-hover:border-primary/30"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
      </div>

      {/* Filters Row */}
      <div className="bg-bg-tertiary rounded-2xl p-4 sm:p-5 shadow-lg border border-border/50">
        <div className="flex flex-wrap items-center gap-3">
          {/* Sort By */}
          <div className="flex-1 min-w-[140px]">
            <Select
              label="Sort"
              value={filters.sortBy}
              onChange={(value) => dispatch(setHistorySortBy(value))}
              options={HISTORY_SORT_OPTIONS.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
            />
          </div>

          {/* Sort Order */}
          <div className="flex-1 min-w-[140px]">
            <Select
              label="Order"
              value={filters.sortOrder}
              onChange={(value) =>
                dispatch(setHistorySortOrder(value as "asc" | "desc"))
              }
              options={SORT_ORDER_OPTIONS.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
            />
          </div>

          {/* Genre */}
          <div className="flex-1 min-w-[140px]">
            <Select
              label="Genre"
              value={filters.genre}
              onChange={(value) => dispatch(setHistoryGenre(value))}
              options={GENRES.map((genre) => ({ value: genre, label: genre }))}
            />
          </div>

          {/* Min Rating */}
          <div className="flex-1 min-w-[140px]">
            <Select
              label="Rating"
              value={filters.minRating}
              onChange={(value) => dispatch(setHistoryMinRating(Number(value)))}
              options={MIN_RATING_OPTIONS.map((opt) => ({
                value: String(opt.value),
                label: opt.label,
              }))}
            />
          </div>

          {/* Year */}
          <div className="flex-1 min-w-[140px]">
            <Select
              label="Year"
              value={filters.year}
              onChange={(value) => dispatch(setHistoryYear(Number(value)))}
              options={YEARS.map((year) => ({
                value: year === "All" ? "0" : String(year),
                label: String(year),
              }))}
            />
          </div>

          {/* Reset Button */}
          {hasActiveFiltersValue && (
            <button
              onClick={handleReset}
              className={clsx(
                "flex items-center gap-2 h-10 px-6 rounded-xl font-bold",
                "bg-primary text-black hover:bg-primary/90",
                "transition-all duration-200 text-sm whitespace-nowrap shadow-lg shadow-primary/20 active:scale-95",
              )}
              aria-label="Reset all filters"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
