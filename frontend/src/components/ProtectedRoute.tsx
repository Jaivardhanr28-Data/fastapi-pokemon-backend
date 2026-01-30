// frontend/src/components/ProtectedRoute.tsx
// Import the Navigate component from react-router-dom.
// Navigate allows the component to redirect the user to another route
// (used below to send unauthenticated users to /login or non-admin users to /admin-only).
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
    children: React.ReactNode; // This is a required property of type React.ReactNode. It represents the children components that will be rendered inside the ProtectedRoute component.
    adminOnly?: boolean; // This is an optional property of type boolean. It indicates whether the route should only be accessible to users with admin privileges.
}

// This function component renders its children if the user is logged in and meets any additional admin-only requirements
function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
    // Retrieve the user's authentication token and user data from local storage
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    // If the user is not logged in (i.e., no token or user data is present in local storage), redirect to the login page
    if (!token || !userStr) {
        return <Navigate to="/login" replace />;
    }

    // If the route requires admin access, check if the user is an admin
    if (adminOnly) {
        try {
            // Parse the user data from JSON string
            const user = JSON.parse(userStr);
            // If the user is not an admin, redirect to the admin-only page (NOT the dashboard!)
            if (!user.is_admin) {
                return <Navigate to="/admin-only" replace />;
            }
        } catch {
            // If there was an error parsing the user data, redirect to the login page
            return <Navigate to="/login" replace />;
        }
    }

    // If all checks have passed, render the children of this component
    return <>{children}</>;
}

export default ProtectedRoute;