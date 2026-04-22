import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
    deanOnly?: boolean;
}

const ProtectedRoute = ({ children, allowedRoles, deanOnly }: ProtectedRouteProps) => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check Roles
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to={`/dashboard/${user.role}`} replace />;
    }

    // Check Dean Only status
    // In our system, a Dean is an Admin with department_id set to null/undefined
    if (deanOnly && user.role === 'admin' && (user as any).department_id) {
        console.warn('[ProtectedRoute] Access denied: Dean only route');
        return <Navigate to="/dashboard/admin" replace />;
    }

    return <>{children}</>;
};

    return <>{children}</>;
};

export default ProtectedRoute;
