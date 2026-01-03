/**
 * ProtectedRoute - Route Guard Component
 * 
 * Protects private routes by checking authentication status.
 * Redirects unauthenticated users to login and saves their
 * intended destination for redirect after login.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuthState } from '../../hooks/useAuth';
import { REDIRECT_KEY } from '../../constants/auth';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, isInitialized } = useAuthState();
    const location = useLocation();

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

    // If not authenticated, save current path and redirect to login
    if (!isAuthenticated) {
        // Save the current location for redirect after login
        sessionStorage.setItem(REDIRECT_KEY, location.pathname + location.search);

        return <Navigate to="/auth/login" replace />;
    }

    // User is authenticated, render the protected content
    return <>{children}</>;
}

