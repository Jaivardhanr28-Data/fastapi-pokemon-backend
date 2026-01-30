/**
 * AdminOnly.tsx - Access Denied Page for Non-Admin Users
 *
 * This component is displayed when a non-admin user attempts to access
 * admin-restricted routes (like /users page). It serves as a friendly
 * access denied page that:
 * - Informs users that admin privileges are required
 * - Provides a fun teaser for a future "Pokemon Battle Arena" feature
 * - Offers navigation buttons to redirect users to accessible pages
 *
 * Note: This page is protected by ProtectedRoute but does NOT have adminOnly flag,
 * meaning any authenticated user can view this page. The actual admin routes
 * (like /users) redirect non-admins here via the ProtectedRoute component.
 */

// Import useNavigate hook for programmatic navigation to other pages
import { useNavigate } from "react-router-dom";

// Import component-specific styles for the access denied page
import "./AdminOnly.css";

function AdminOnly() {
    // Hook for programmatic navigation (used by action buttons)
    const navigate = useNavigate();

    // Render the access denied UI
    return (
        // Main page container with full-page styling
        <div className="admin-only-page">
            {/* Centered card container for blocked access message */}
            <div className="blocked-card">
                {/* Lock icon to visually indicate restricted access */}
                <div className="lock-icon">🔒</div>

                {/* Main heading indicating admin access requirement */}
                <h2>Admin Access Required</h2>

                {/* Message explaining the access restriction */}
                <p className="blocked-message">
                    This page is restricted to administrators only.
                </p>

                {/* Fun section teasing future battle arena feature */}
                <div className="battle-section">
                    {/* Battle icon for visual appeal */}
                    <div className="pokeball-icon">⚔️</div>

                    {/* Section heading */}
                    <h3>Want Admin Access?</h3>

                    {/* Description of hypothetical future feature */}
                    <p className="battle-text">
                        Prove your worth in the <strong>Pokemon Battle Arena</strong>!
                    </p>

                    {/* Badge indicating this is a future/planned feature */}
                    <div className="coming-soon-badge">
                        🎮 Coming Soon - Future Feature
                    </div>
                </div>

                {/* Action buttons section for user navigation */}
                <div className="action-buttons">
                    {/* Button to navigate back to dashboard */}
                    <button
                        className="back-btn" // CSS class for styling
                        onClick={() => navigate("/dashboard")} // Navigate to dashboard on click
                    >
                        ← Back to Dashboard
                    </button>

                    {/* Button to navigate to Pokemon Cards browsing page */}
                    <button
                        className="cards-btn" // CSS class for styling
                        onClick={() => navigate("/pokemon-cards")} // Navigate to Pokemon cards page on click
                    >
                        Browse Pokemon Cards
                    </button>
                </div>
            </div>
        </div>
    );
}

// Export AdminOnly component as default export for use in routing
export default AdminOnly;