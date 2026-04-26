import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { getAuthToken } from "@/lib/api";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
    deanOnly?: boolean;
}

const ProtectedRoute = ({ children, allowedRoles, deanOnly }: ProtectedRouteProps) => {
    const { user, isLoading } = useAuth();
    const location = useLocation();
    const token = getAuthToken();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!user && !token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!user && token) {
        // Token exists but Context user state hasn't propagated yet (race condition).
        // Delay rendering to allow React to flush the state.
        return <div className="min-h-screen flex items-center justify-center">Loading session...</div>;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to={`/dashboard/${user.role}`} replace />;
    }

    if (deanOnly && user.role === 'admin' && (user as any).department_id) {
        console.warn('[ProtectedRoute] Access denied: Dean only route');
        return <Navigate to="/dashboard/admin" replace />;
    }

    return <>{children}</>;
};



export default ProtectedRoute;
