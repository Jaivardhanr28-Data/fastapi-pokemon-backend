/**
 * Dashboard.tsx
 *
 * Main dashboard page that serves as the home screen after user login.
 * Displays different content based on user role (admin vs regular user).
 *
 * Admin users see:
 * - Quick links to user management
 * - Access to Pokemon cards view
 * - Admin status indicator
 *
 * Regular users see:
 * - Browse cards option
 * - Collection progress (X/3 cards owned)
 * - Shopping cart access
 *
 * Features:
 * - Role-based UI rendering
 * - Real-time owned cards count for users
 * - Navigation shortcuts to key sections
 * - Getting started instructions
 */

// React hooks for state management and side effects
import { useEffect, useState } from "react";
// React Router hook for programmatic navigation
import { useNavigate } from "react-router-dom";
// Dashboard-specific styles
import "./Dashboard.css";

function Dashboard() {
    // State to store the current user's information (name, email, is_admin, etc.)
    const [user, setUser] = useState<any>(null);

    // State to track if current user has admin privileges
    const [isAdmin, setIsAdmin] = useState(false);

    // State to track number of cards owned by the user (for regular users only)
    const [ownedCardsCount, setOwnedCardsCount] = useState(0);

    // React Router navigation hook for programmatic page navigation
    const navigate = useNavigate();

    /**
     * Effect hook that runs once on component mount
     * Loads user data from localStorage and fetches owned cards count
     * Dependencies: [] ensures this runs only once when component mounts
     */
    useEffect(() => {
        // Retrieve the user object from browser's localStorage
        const userStr = localStorage.getItem("user");

        // If user data exists in localStorage
        if (userStr) {
            // Parse the JSON string to get user object
            const userData = JSON.parse(userStr);

            // Update user state with parsed data
            setUser(userData);

            // Set admin status (default to false if is_admin not present)
            setIsAdmin(userData.is_admin || false);
        }

        // For regular users (non-admin), fetch their owned cards count
        // Parse userStr again to check admin status without using state
        if (userStr && !JSON.parse(userStr).is_admin) {
            fetchOwnedCards();
        }
    }, []);

    /**
     * Async function to fetch the count of cards owned by the current user
     * Makes API call to get owned cards and updates the count
     * Only called for regular users (admins don't collect cards)
     */
    const fetchOwnedCards = async () => {
        // Get authentication token from localStorage
        const token = localStorage.getItem("token");

        try {
            // Make GET request to fetch owned cards endpoint
            const res = await fetch("http://localhost:8000/api/cards/owned", {
                headers: {
                    // Include bearer token for authentication
                    "Authorization": `Bearer ${token}`
                }
            });

            // Parse response JSON (array of owned card objects)
            const data = await res.json();

            // Update state with count of owned cards
            setOwnedCardsCount(data.length);
        } catch (err) {
            // Log error if API call fails
            console.error("Failed to fetch owned cards:", err);
        }
    };

    // If user data hasn't loaded yet, show loading state
    if (!user) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="dashboard-page">
            {/* Welcome section with personalized greeting */}
            <div className="welcome-section">
                {/* Display user's name from state */}
                <h1>Welcome, {user.name}! 👋</h1>

                {/* Conditional subtitle based on user role */}
                <p className="subtitle">
                    {isAdmin
                        ? "You have admin access to manage users and cards"
                        : "Start collecting your favorite Pokemon cards"}
                </p>
            </div>

            {/* Admin Dashboard - Only visible to admin users */}
            {isAdmin && (
                <div className="dashboard-grid">
                    {/* Card 1: User Management */}
                    <div className="dashboard-card">
                        <div className="card-icon">👥</div>
                        <h3>Manage Users</h3>
                        <p>View and manage all users</p>
                        {/* Navigate to users page when clicked */}
                        <button
                            className="card-action-btn"
                            onClick={() => navigate("/users")}
                        >
                            Go to Users
                        </button>
                    </div>

                    {/* Card 2: Pokemon Cards View */}
                    <div className="dashboard-card">
                        <div className="card-icon">🎮</div>
                        <h3>Pokemon Cards</h3>
                        <p>View available Pokemon cards</p>
                        {/* Navigate to pokemon cards page when clicked */}
                        <button
                            className="card-action-btn"
                            onClick={() => navigate("/pokemon-cards")}
                        >
                            View Cards
                        </button>
                    </div>

                    {/* Card 3: Admin Status Indicator */}
                    <div className="dashboard-card admin-info">
                        <div className="card-icon">🔐</div>
                        <h3>Admin Status</h3>
                        <p>You have full administrative access</p>
                    </div>
                </div>
            )}

            {/* User Dashboard - Only visible to regular users */}
            {!isAdmin && (
                <div className="dashboard-grid">
                    {/* Card 1: Browse Pokemon Cards */}
                    <div className="dashboard-card">
                        <div className="card-icon">🎮</div>
                        <h3>Browse Cards</h3>
                        <p>Explore our Pokemon card collection</p>
                        {/* Navigate to browse cards page */}
                        <button
                            className="card-action-btn"
                            onClick={() => navigate("/pokemon-cards")}
                        >
                            Browse Cards
                        </button>
                    </div>

                    {/* Card 2: My Collection - Shows owned cards count */}
                    <div className="dashboard-card">
                        <div className="card-icon">📦</div>
                        <h3>My Collection</h3>
                        {/* Display current owned count out of max 3 cards */}
                        <p>You own {ownedCardsCount} / 3 cards</p>
                        {/* Navigate to user's collection page */}
                        <button
                            className="card-action-btn"
                            onClick={() => navigate("/my-collection")}
                        >
                            View Collection
                        </button>
                    </div>

                    {/* Card 3: Shopping Cart */}
                    <div className="dashboard-card">
                        <div className="card-icon">🛒</div>
                        <h3>Shopping Cart</h3>
                        <p>View your cart and checkout</p>
                        {/* Navigate to shopping cart page */}
                        <button
                            className="card-action-btn"
                            onClick={() => navigate("/cart")}
                        >
                            Go to Cart
                        </button>
                    </div>
                </div>
            )}

            {/* Instructions Section - Shows getting started guide */}
            <div className="instructions-section">
                <h3>Getting Started</h3>
                <div className="instructions-grid">
                    {/* Conditional instructions based on user role */}
                    {isAdmin ? (
                        <>
                            {/* Admin Instructions */}
                            <div className="instruction-item">
                                <span className="step-number">1</span>
                                <p>Use the <strong>Users</strong> page to manage user accounts</p>
                            </div>
                            <div className="instruction-item">
                                <span className="step-number">2</span>
                                <p>View the <strong>Pokemon Cards</strong> page to see all available cards</p>
                            </div>
                            <div className="instruction-item">
                                <span className="step-number">3</span>
                                <p>Monitor user card ownership in the users table</p>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Regular User Instructions */}
                            <div className="instruction-item">
                                <span className="step-number">1</span>
                                <p>Browse the <strong>Pokemon Cards</strong> page</p>
                            </div>
                            <div className="instruction-item">
                                <span className="step-number">2</span>
                                <p>Add cards to your <strong>Cart</strong> (max 3 cards)</p>
                            </div>
                            <div className="instruction-item">
                                <span className="step-number">3</span>
                                <p>Complete purchase and view in <strong>My Collection</strong></p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// Export Dashboard component as default export
export default Dashboard;