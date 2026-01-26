import type { ILibraryFiltersState } from '../redux/slices/libraryFiltersSlice';

// Helper function to check if any filters are active
export const hasActiveLibraryFilters = (filters: ILibraryFiltersState): boolean => {
    return (
        filters.genre !== 'All' ||
        filters.minRating > 0 ||
        filters.year > 0 ||
        filters.sortBy !== 'lastUpdated' ||
        filters.sortOrder !== 'desc' ||
        filters.search !== ''
    );
};
