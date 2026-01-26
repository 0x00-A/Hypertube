// ============================================================================
// Hook: Determine if UI controls should be shown
// ============================================================================

export const useEmptyStateVisibility = (params: {
  isLoading: boolean;
  hasData: boolean;
  hasActiveFilters: boolean;
}) => {
  const { isLoading, hasData, hasActiveFilters } = params;

  // Show controls if:
  // 1. Currently loading (skeleton state)
  // 2. Has data to display
  // 3. Has active filters (user is searching/filtering)
  const shouldShowControls = isLoading || hasData || hasActiveFilters;

  // Show empty state if:
  // - Not loading AND no data AND no active filters
  const shouldShowEmptyState = !isLoading && !hasData && !hasActiveFilters;

  return {
    shouldShowControls,
    shouldShowEmptyState
  };
};
