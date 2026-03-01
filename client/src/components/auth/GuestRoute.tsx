/**
 * GuestRoute - Route Guard Component
 *
 * Protects guest routes by checking authentication status.
 * Redirects authenticated users to the library/browse page.
 */

import { Navigate } from 'react-router-dom';
import { useAuthState } from '../../hooks/useAuth';

interface GuestRouteProps {
    children: React.ReactNode;
}

export default function GuestRoute({ children }: GuestRouteProps) {
    const { isAuthenticated, isInitialized } = useAuthState();

    // Wait for auth to initialize before making decisions
    if (!isInitialized) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-text-secondary">Loading...</p>
                </div>
            </div>
        );
    }

    // If authenticated, redirect to browse
    if (isAuthenticated) {
        return <Navigate to="/browse" replace />;
    }

    // User is guest, render the content
    return <>{children}</>;
}
