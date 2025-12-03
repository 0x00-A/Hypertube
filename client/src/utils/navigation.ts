// Navigation utility to handle redirects
// This is used by axios interceptors since hooks can't be used outside components
// Note: This implements a singleton pattern. The navigate function is set once in App.tsx
// and shared across the application. This may not work in testing or multi-router scenarios.

let navigateFunction: ((path: string) => void) | null = null;

export function setNavigate(navigate: (path: string) => void) {
  navigateFunction = navigate;
}

export function navigateTo(path: string) {
  if (navigateFunction) {
    navigateFunction(path);
  } else {
    // Fallback to window.location if navigate not set (shouldn't happen in normal flow)
    window.location.href = path;
  }
}
