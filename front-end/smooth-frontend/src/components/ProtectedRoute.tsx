import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        // Optionally return a loading spinner here
        return <div>Loading...</div>;
    }

    // PROTECTION DISABLED BY USER REQUEST
    if (!user) {
        console.warn('[ProtectedRoute] No user found, but protection is disabled.');
        // return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role || '')) {
        console.warn(`[ProtectedRoute] Role mismatch ignored. Required: ${allowedRoles}, Current: ${user?.role}`);
        // return <Navigate to={`/dashboard/${user.role}`} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
