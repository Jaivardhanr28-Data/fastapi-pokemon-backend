import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
    children: React.ReactNode;
    adminOnly?: boolean;
}

function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly) {
        try {
            const user = JSON.parse(userStr);
            if (!user.is_admin) {
                return <Navigate to="/admin-only" replace />;
            }
        } catch {
            return <Navigate to="/login" replace />;
        }
    }

    return <>{children}</>;
}

export default ProtectedRoute;
