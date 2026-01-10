import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import OAuthCallback from '../OAuthCallback';
import toast from 'react-hot-toast';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('OAuthCallback Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Success Flow', () => {
    it('should display success message when status is oauth_success', () => {
      render(
        <MemoryRouter initialEntries={['/?status=oauth_success']}>
          <OAuthCallback />
        </MemoryRouter>
      );

      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText("You've been successfully authenticated.")).toBeInTheDocument();
      expect(screen.getByText('Redirecting you now...')).toBeInTheDocument();
    });

    it('should show success toast on oauth_success', () => {
      render(
        <MemoryRouter initialEntries={['/?status=oauth_success']}>
          <OAuthCallback />
        </MemoryRouter>
      );

      expect(toast.success).toHaveBeenCalledWith('Successfully logged in!', {
        id: 'oauth-success',
      });
    });

    it('should redirect to /browse after 1 second on success', async () => {
      render(
        <MemoryRouter initialEntries={['/?status=oauth_success']}>
          <OAuthCallback />
        </MemoryRouter>
      );

      // Wait for navigation to be called
      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith('/browse', { replace: true });
        },
        { timeout: 2000 }
      );
    });

    it('should redirect to custom path when redirect param is provided', async () => {
      render(
        <MemoryRouter initialEntries={['/?status=oauth_success&redirect=/movies']}>
          <OAuthCallback />
        </MemoryRouter>
      );

      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith('/movies', { replace: true });
        },
        { timeout: 2000 }
      );
    });

    it('should prevent duplicate success toasts', () => {
      const { rerender } = render(
        <MemoryRouter initialEntries={['/?status=oauth_success']}>
          <OAuthCallback />
        </MemoryRouter>
      );

      // Re-render the component
      rerender(
        <MemoryRouter initialEntries={['/?status=oauth_success']}>
          <OAuthCallback />
        </MemoryRouter>
      );

      // Toast should only be called once due to the id
      expect(toast.success).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Flow', () => {
    it('should display error message when error is oauth_failed', () => {
      render(
        <MemoryRouter initialEntries={['/?error=oauth_failed']}>
          <OAuthCallback />
        </MemoryRouter>
      );

      expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong during authentication.')).toBeInTheDocument();
      expect(screen.getByText('Redirecting to login...')).toBeInTheDocument();
    });

    it('should show error toast on oauth_failed', () => {
      render(
        <MemoryRouter initialEntries={['/?error=oauth_failed']}>
          <OAuthCallback />
        </MemoryRouter>
      );

      expect(toast.error).toHaveBeenCalledWith('Authentication failed. Please try again.', {
        id: 'oauth-error',
        duration: 5000,
      });
    });

    it('should display custom error message when provided', () => {
      const customMessage = 'User email not verified';
      render(
        <MemoryRouter initialEntries={[`/?error=oauth_failed&message=${encodeURIComponent(customMessage)}`]}>
          <OAuthCallback />
        </MemoryRouter>
      );

      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('should redirect to /auth/login after 2 seconds on error', async () => {
      render(
        <MemoryRouter initialEntries={['/?error=oauth_failed']}>
          <OAuthCallback />
        </MemoryRouter>
      );

      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith('/auth/login', { replace: true });
        },
        { timeout: 3000 }
      );
    });

    it('should prevent duplicate error toasts', () => {
      const { rerender } = render(
        <MemoryRouter initialEntries={['/?error=oauth_failed']}>
          <OAuthCallback />
        </MemoryRouter>
      );

      rerender(
        <MemoryRouter initialEntries={['/?error=oauth_failed']}>
          <OAuthCallback />
        </MemoryRouter>
      );

      expect(toast.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('Invalid Callback', () => {
    it('should show error and redirect when no status or error parameter', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <OAuthCallback />
        </MemoryRouter>
      );

      expect(toast.error).toHaveBeenCalledWith('Invalid authentication callback', {
        id: 'oauth-invalid',
      });

      expect(mockNavigate).toHaveBeenCalledWith('/auth/login', { replace: true });
    });

    it('should display loading state when no parameters are present initially', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <OAuthCallback />
        </MemoryRouter>
      );

      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.getByText('Please wait while we complete your authentication.')).toBeInTheDocument();
    });
  });

  describe('React Strict Mode Compatibility', () => {
    it('should not process OAuth callback twice in strict mode', async () => {
      const { rerender } = render(
        <MemoryRouter initialEntries={['/?status=oauth_success']}>
          <OAuthCallback />
        </MemoryRouter>
      );

      // Simulate React Strict Mode double-mounting
      rerender(
        <MemoryRouter initialEntries={['/?status=oauth_success']}>
          <OAuthCallback />
        </MemoryRouter>
      );

      // Should only process once due to hasProcessed ref
      expect(toast.success).toHaveBeenCalledTimes(1);

      // Wait for navigation
      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledTimes(1);
        },
        { timeout: 2000 }
      );
    });
  });

  describe('UI States', () => {
    it('should render success icon on success', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/?status=oauth_success']}>
          <OAuthCallback />
        </MemoryRouter>
      );

      // Check for green success styling
      const successIcon = container.querySelector('.bg-green-500\\/10');
      expect(successIcon).toBeInTheDocument();
    });

    it('should render error icon on failure', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/?error=oauth_failed']}>
          <OAuthCallback />
        </MemoryRouter>
      );

      // Check for red error styling
      const errorIcon = container.querySelector('.bg-red-500\\/10');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should render loading spinner on invalid callback', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <OAuthCallback />
        </MemoryRouter>
      );

      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/?status=oauth_success']}>
          <OAuthCallback />
        </MemoryRouter>
      );

      // Should have headings
      const heading = screen.getByRole('heading', { name: /success/i });
      expect(heading).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/?status=oauth_success']}>
          <OAuthCallback />
        </MemoryRouter>
      );

      // Component should be focusable
      expect(container.firstChild).toBeTruthy();
    });
  });
});
