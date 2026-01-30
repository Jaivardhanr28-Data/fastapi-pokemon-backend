/**
 * Users.tsx
 *
 * User Management Page Component
 *
 * This component provides a comprehensive user management interface for viewing,
 * editing, and managing users in the Pokemon Card application. It includes admin
 * capabilities for CRUD operations on users and viewing user collections.
 *
 * Key Features:
 * - Display all users in a table format
 * - Admin-only edit functionality (update name, email, password)
 * - Admin-only delete functionality with confirmation
 * - Admin-only view user's card collection
 * - Role-based UI (admin vs regular user)
 * - Modal-based edit/delete/view operations
 * - Real-time state updates after operations
 * - Error handling with user-friendly messages
 *
 * API Integration:
 * - GET /users - Fetch all users (public)
 * - PUT /admin/users/:id - Update user (admin only)
 * - DELETE /admin/users/:id - Delete user (admin only)
 * - GET /admin/users/:id/cards - View user's cards (admin only)
 *
 * Authentication & Authorization:
 * - Reads user info from localStorage to determine admin status
 * - Protected endpoints require Bearer token
 * - 403 errors handled for non-admin access attempts
 * - 401 errors handled for expired sessions
 *
 * State Management:
 * - Multiple modal states (edit, delete, view cards)
 * - Form state for edit operations
 * - Loading states for async operations
 * - Error state for user feedback
 */

// Import React hooks for state management and side effects
import { useEffect, useState } from "react";
// Import navigation hook for routing (used for register button)
import { useNavigate } from "react-router-dom";
// Import component-specific styles
import "./Users.css";

/**
 * User Interface
 *
 * Defines the structure of a user object.
 * Matches the backend User model structure.
 * Used for type-safe user data handling.
 */
interface User {
    // Unique identifier for the user (UUID from backend)
    id: string;
    // User's display name
    name: string;
    // User's email address (used for login)
    email: string;
    // Optional: Whether user has admin privileges
    // Used to determine access to admin features
    is_admin?: boolean;
    // Optional: Count of Pokemon cards owned by user
    // Displayed in table, calculated by backend
    cards_owned?: number;
}

/**
 * OwnedCard Interface
 *
 * Defines the structure of a card in a user's collection.
 * Used when displaying a user's cards in the view modal.
 * Matches the backend owned card response format.
 */
interface OwnedCard {
    // Unique identifier for the card instance
    id: string;
    // Name of the Pokemon card
    name: string;
    // Type of Pokemon (Fire, Water, Electric, etc.)
    pokemon_type: string;
    // Hit points value
    hp: number;
    // Attack name/description
    attack: string;
    // Card price in USD
    price: number;
    // Rarity level (Common, Rare, Legendary)
    rarity: string;
    // URL to card image
    image_url: string;
    // Timestamp when user purchased this card
    purchased_at: string;
}

/**
 * Users Functional Component
 *
 * Main component that renders the user management page.
 * Manages all user-related state and operations.
 */
function Users() {
    // ============================================================
    // STATE MANAGEMENT - USER DATA
    // ============================================================

    /**
     * Array of all users in the system
     * Initially empty, populated by useEffect on mount
     * Updated after edit/delete operations
     */
    const [users, setUsers] = useState<User[]>([]);

    /**
     * Currently selected user for modal operations
     * null when no modal is open
     * Set when opening edit/delete/view cards modals
     * Used to display user details in modals
     */
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // ============================================================
    // STATE MANAGEMENT - MODAL VISIBILITY
    // ============================================================

    /**
     * Controls visibility of edit user modal
     * true: Modal is displayed
     * false: Modal is hidden
     */
    const [showEditModal, setShowEditModal] = useState(false);

    /**
     * Controls visibility of delete confirmation modal
     * true: Modal is displayed
     * false: Modal is hidden
     */
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    /**
     * Controls visibility of view user cards modal
     * true: Modal is displayed
     * false: Modal is hidden
     */
    const [showCardsModal, setShowCardsModal] = useState(false);

    // ============================================================
    // STATE MANAGEMENT - CARD VIEWING
    // ============================================================

    /**
     * Array of cards owned by the selected user
     * Populated when admin clicks "View Cards"
     * Cleared when modal closes
     */
    const [userCards, setUserCards] = useState<OwnedCard[]>([]);

    /**
     * Loading state for fetching user's cards
     * true: Shows loading spinner in cards modal
     * false: Shows card list or empty state
     */
    const [cardsLoading, setCardsLoading] = useState(false);

    // ============================================================
    // STATE MANAGEMENT - AUTHENTICATION & AUTHORIZATION
    // ============================================================

    /**
     * Whether current logged-in user is an admin
     * Determines which UI elements are visible
     * Controls access to edit/delete/view operations
     * Read from localStorage user object on mount
     */
    const [isAdmin, setIsAdmin] = useState(false);

    // ============================================================
    // STATE MANAGEMENT - EDIT FORM FIELDS
    // ============================================================

    /**
     * Edit form state: User's name
     * Controlled input - value stored in state
     * Pre-filled with selected user's current name
     */
    const [editName, setEditName] = useState("");

    /**
     * Edit form state: User's email
     * Controlled input - value stored in state
     * Pre-filled with selected user's current email
     */
    const [editEmail, setEditEmail] = useState("");

    /**
     * Edit form state: New password (optional)
     * Controlled input - value stored in state
     * Starts empty - only sent if user enters new password
     */
    const [editPassword, setEditPassword] = useState("");

    // ============================================================
    // STATE MANAGEMENT - UI FEEDBACK
    // ============================================================

    /**
     * Loading state for edit/delete operations
     * true: Disables form inputs and shows "Saving..." / "Deleting..."
     * false: Enables form interactions
     * Prevents duplicate submissions
     */
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Error message for failed operations
     * Empty string when no error
     * Contains user-friendly error message when operation fails
     * Displayed in modals above forms
     */
    const [error, setError] = useState("");

    // ============================================================
    // NAVIGATION
    // ============================================================

    /**
     * Navigation function from react-router-dom
     * Used to programmatically navigate to other pages
     * Example: navigate("/users/register")
     */
    const navigate = useNavigate();

    // ============================================================
    // LIFECYCLE EFFECTS
    // ============================================================

    /**
     * Effect: Check if Current User is Admin
     *
     * Runs once on component mount (empty dependency array)
     * Reads user data from localStorage to determine admin status
     * Sets isAdmin state which controls UI visibility
     *
     * Flow:
     * 1. Get "user" string from localStorage
     * 2. Parse JSON to object
     * 3. Check is_admin property
     * 4. Update isAdmin state
     * 5. Handle errors gracefully (default to false)
     */
    useEffect(() => {
        // Retrieve user object string from localStorage
        // Stored during login as JSON string
        const userStr = localStorage.getItem("user");

        // Only proceed if user data exists
        if (userStr) {
            try {
                // Parse JSON string to JavaScript object
                const user = JSON.parse(userStr);

                // Set admin status from user object
                // Use logical OR to default to false if is_admin is undefined
                setIsAdmin(user.is_admin || false);
            } catch {
                // If JSON parsing fails, default to non-admin
                // Prevents crashes from corrupted localStorage data
                setIsAdmin(false);
            }
        }
    }, []); // Empty array = run only once on mount

    /**
     * Effect: Fetch All Users on Mount
     *
     * Runs once on component mount (empty dependency array)
     * Fetches list of all users from public API endpoint
     * No authentication required - public endpoint
     *
     * API Endpoint: GET http://localhost:8000/users
     * Authentication: Not required (public endpoint)
     * Response: Array of User objects
     *
     * Flow:
     * 1. Send GET request to /users
     * 2. Parse JSON response
     * 3. Update users state with fetched data
     * 4. Show alert on error
     */
    useEffect(() => {
        // Fetch all users from backend
        // No auth header needed - this is a public endpoint
        fetch("http://localhost:8000/users")
            // Parse response body as JSON
            .then((res) => res.json())
            // Update state with user array
            .then((data) => setUsers(data))
            // Handle any errors (network, parsing, etc.)
            .catch(() => {
                // Show user-friendly error message
                alert("Failed to load users");
            });
    }, []); // Empty array = run only once on mount

    // ============================================================
    // UTILITY FUNCTIONS
    // ============================================================

    /**
     * Get Authentication Token from LocalStorage
     *
     * Helper function to retrieve JWT token for API calls.
     * Centralized to avoid repeating localStorage.getItem("token")
     * throughout the code.
     *
     * @returns JWT token string or null if not found
     */
    const getAuthToken = (): string | null => {
        // Retrieve and return token from localStorage
        // Returns null if token doesn't exist (user not logged in)
        return localStorage.getItem("token");
    };

    /**
     * Get Rarity Color Helper
     *
     * Maps card rarity levels to display colors.
     * Used for color-coding rarity badges in card display.
     *
     * @param rarity - Rarity level string (Legendary, Rare, Common)
     * @returns Hex color code for the rarity
     */
    const getRarityColor = (rarity: string) => {
        // Switch statement to map rarity to color
        switch (rarity) {
            // Gold color for legendary cards
            case "Legendary": return "#FFD700";
            // Silver color for rare cards
            case "Rare": return "#C0C0C0";
            // Bronze color for common cards
            case "Common": return "#CD7F32";
            // White as fallback for unknown rarities
            default: return "#fff";
        }
    };

    // ============================================================
    // API FUNCTIONS - VIEW USER CARDS
    // ============================================================

    /**
     * View User's Card Collection (Admin Only)
     *
     * Fetches and displays all cards owned by a specific user.
     * Only accessible to admin users - backend enforces this.
     * Opens modal with loading state, then displays cards.
     *
     * @param user - User object whose cards to view
     *
     * API Endpoint: GET /admin/users/:id/cards
     * Authentication: Required (admin only)
     * Response: Array of OwnedCard objects
     *
     * Flow:
     * 1. Set selected user and open modal
     * 2. Initialize loading state
     * 3. Check for auth token
     * 4. Fetch user's cards from API
     * 5. Handle success/error cases
     * 6. Update UI accordingly
     *
     * Error Handling:
     * - 403: Admin access required
     * - 401: Session expired
     * - Network/other: Generic error message
     */
    const handleViewCardsClick = async (user: User) => {
        // Set the user whose cards we're viewing
        setSelectedUser(user);

        // Open the cards modal immediately
        setShowCardsModal(true);

        // Start loading state to show spinner
        setCardsLoading(true);

        // Clear any previous cards data
        setUserCards([]);

        // Clear any previous error messages
        setError("");

        // Get JWT token for authentication
        const token = getAuthToken();

        // Check if user is logged in
        if (!token) {
            // Show error if no token found
            setError("You must be logged in to view user cards");
            // Stop loading state
            setCardsLoading(false);
            // Exit function early
            return;
        }

        try {
            // Send GET request to admin endpoint
            // URL includes user ID to specify which user's cards to fetch
            const res = await fetch(`http://localhost:8000/admin/users/${user.id}/cards`, {
                headers: {
                    // Include Bearer token for admin authentication
                    "Authorization": `Bearer ${token}`,
                },
            });

            // Check if response indicates failure
            if (!res.ok) {
                // Parse error response for details
                const data = await res.json();
                // Throw error with backend message or fallback
                throw new Error(data.detail || "Failed to fetch user cards");
            }

            // Parse successful response to get cards array
            const cards = await res.json();

            // Update state with fetched cards
            // This will render the cards in the modal
            setUserCards(cards);
        } catch (err: any) {
            // Type assertion to access error message
            // Handle different types of errors with specific messages

            // Check for 403 Forbidden (non-admin user)
            if (err.message.includes("403") || err.message.includes("Admin")) {
                setError("❌ Admin access required");
            }
            // Check for 401 Unauthorized (expired token)
            else if (err.message.includes("401") || err.message.includes("token")) {
                setError("❌ Session expired. Please login again.");
            }
            // Generic error for other failures
            else {
                setError(`❌ ${err.message}`);
            }
        } finally {
            // Finally block always runs, even if try or catch executes
            // Stop loading state to hide spinner
            // Shows either cards or error message
            setCardsLoading(false);
        }
    };

    // --------------------------------------------------
    // EDIT USER (ADMIN ONLY - REAL BACKEND CALL)
    // --------------------------------------------------
    const handleSaveEdit = async () => {
        if (!selectedUser) return;

        setError("");
        setIsLoading(true);

        const token = getAuthToken();
        if (!token) {
            alert("You must be logged in to edit users");
            setIsLoading(false);
            return;
        }

        try {
            // Build request body (only include fields that have values)
            const updateData: any = {};
            if (editName.trim() !== selectedUser.name) {
                updateData.name = editName.trim();
            }
            if (editEmail.trim() !== selectedUser.email) {
                updateData.email = editEmail.trim();
            }
            if (editPassword.trim()) {
                updateData.password = editPassword.trim();
            }

            // Call admin API
            const res = await fetch(`http://localhost:8000/admin/users/${selectedUser.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(updateData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to update user");
            }

            // Success! Update local state
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.id === selectedUser.id
                        ? { ...user, name: editName, email: editEmail }
                        : user
                )
            );

            alert("✅ User updated successfully!");
            setShowEditModal(false);
            setSelectedUser(null);
        } catch (err: any) {
            if (err.message.includes("403") || err.message.includes("Admin")) {
                setError("❌ Admin access required");
            } else if (err.message.includes("401") || err.message.includes("token")) {
                setError("❌ Session expired. Please login again.");
            } else {
                setError(`❌ ${err.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // --------------------------------------------------
    // DELETE USER (ADMIN ONLY - REAL BACKEND CALL)
    // --------------------------------------------------
    const handleConfirmDelete = async () => {
        if (!selectedUser) return;

        setError("");
        setIsLoading(true);

        const token = getAuthToken();
        if (!token) {
            alert("You must be logged in to delete users");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch(`http://localhost:8000/admin/users/${selectedUser.id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to delete user");
            }

            // Success! Remove from local state
            setUsers((prevUsers) => prevUsers.filter((user) => user.id !== selectedUser.id));

            alert("✅ User deleted successfully!");
            setShowDeleteModal(false);
            setSelectedUser(null);
        } catch (err: any) {
            if (err.message.includes("403") || err.message.includes("Admin")) {
                setError("❌ Admin access required");
            } else if (err.message.includes("401") || err.message.includes("token")) {
                setError("❌ Session expired. Please login again.");
            } else {
                setError(`❌ ${err.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // --------------------------------------------------
    // Open Edit Modal
    // --------------------------------------------------
    const handleEditClick = (user: User) => {
        setSelectedUser(user);
        setEditName(user.name);
        setEditEmail(user.email);
        setEditPassword("");
        setError("");
        setShowEditModal(true);
    };

    // --------------------------------------------------
    // Open Delete Modal
    // --------------------------------------------------
    const handleDeleteClick = (user: User) => {
        setSelectedUser(user);
        setError("");
        setShowDeleteModal(true);
    };

    // --------------------------------------------------
    // Render
    // --------------------------------------------------
    return (
        <div className="users-page">
            {/* HEADER */}
            <div className="users-header">
                <h2>Pokemon Card Users</h2>

                <button
                    className="add-user-btn"
                    onClick={() => navigate("/users/register")}
                    title="Register new user"
                >
                    +
                </button>
            </div>

            {/* ADMIN NOTICE */}
            {isAdmin && (
                <div style={{
                    padding: "12px",
                    backgroundColor: "rgba(37, 99, 235, 0.1)",
                    border: "1px solid rgba(37, 99, 235, 0.3)",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    color: "#93c5fd"
                }}>
                    🔐 <strong>Admin Mode:</strong> You can edit, delete users, and view their collections
                </div>
            )}

            {/* TABLE */}
            <div className="users-table-wrapper">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Password</th>
                            <th>Cards Owned</th>
                            {isAdmin && <th>Actions</th>}
                        </tr>
                    </thead>

                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>*******</td>
                                <td>
                                    <span className="cards-badge">
                                        {user.cards_owned || 0} / 3
                                    </span>
                                </td>
                                {isAdmin && (
                                    <td className="actions-cell">
                                        <button
                                            className="edit-btn"
                                            onClick={() => handleEditClick(user)}
                                        >
                                            Edit
                                        </button>

                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDeleteClick(user)}
                                        >
                                            Delete
                                        </button>

                                        <button
                                            className="view-cards-btn"
                                            onClick={() => handleViewCardsClick(user)}
                                        >
                                            View Cards
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* EDIT MODAL */}
            {showEditModal && selectedUser && (
                <div
                    className="modal-overlay"
                    onClick={() => !isLoading && setShowEditModal(false)}
                >
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Edit User</h3>

                        {error && (
                            <div style={{
                                padding: "10px",
                                backgroundColor: "rgba(220, 38, 38, 0.1)",
                                border: "1px solid rgba(220, 38, 38, 0.3)",
                                borderRadius: "6px",
                                color: "#fca5a5",
                                marginBottom: "16px"
                            }}>
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                value={editPassword}
                                onChange={(e) => setEditPassword(e.target.value)}
                                placeholder="New password (leave empty to keep current)"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn-cancel"
                                onClick={() => setShowEditModal(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-save"
                                onClick={handleSaveEdit}
                                disabled={isLoading}
                            >
                                {isLoading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {showDeleteModal && selectedUser && (
                <div
                    className="modal-overlay"
                    onClick={() => !isLoading && setShowDeleteModal(false)}
                >
                    <div
                        className="modal modal-delete"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>Delete User</h3>

                        {error && (
                            <div style={{
                                padding: "10px",
                                backgroundColor: "rgba(220, 38, 38, 0.1)",
                                border: "1px solid rgba(220, 38, 38, 0.3)",
                                borderRadius: "6px",
                                color: "#fca5a5",
                                marginBottom: "16px"
                            }}>
                                {error}
                            </div>
                        )}

                        <p className="delete-warning">
                            Are you sure you want to delete{" "}
                            <strong>{selectedUser.name}</strong>?
                        </p>

                        <p className="delete-subtext">
                            This action cannot be undone.
                        </p>

                        <div className="modal-actions">
                            <button
                                className="btn-cancel"
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-danger"
                                onClick={handleConfirmDelete}
                                disabled={isLoading}
                            >
                                {isLoading ? "Deleting..." : "Confirm Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW CARDS MODAL */}
            {showCardsModal && selectedUser && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowCardsModal(false)}
                >
                    <div
                        className="modal modal-view-cards"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>📦 {selectedUser.name}'s Collection</h3>

                        {error && (
                            <div style={{
                                padding: "10px",
                                backgroundColor: "rgba(220, 38, 38, 0.1)",
                                border: "1px solid rgba(220, 38, 38, 0.3)",
                                borderRadius: "6px",
                                color: "#fca5a5",
                                marginBottom: "16px"
                            }}>
                                {error}
                            </div>
                        )}

                        {cardsLoading ? (
                            <div className="cards-loading">
                                <div className="spinner"></div>
                                <p>Loading collection...</p>
                            </div>
                        ) : userCards.length === 0 ? (
                            <div className="no-cards-message">
                                <span className="no-cards-icon">📭</span>
                                <p>This user hasn't collected any cards yet.</p>
                            </div>
                        ) : (
                            <>
                                <div className="collection-summary">
                                    <span className="summary-count">{userCards.length} / 3 Cards</span>
                                    <span className="summary-value">
                                        Total Value: ${userCards.reduce((sum, card) => sum + card.price, 0).toFixed(2)}
                                    </span>
                                </div>

                                <div className="user-cards-grid">
                                    {userCards.map((card) => (
                                        <div key={card.id} className="user-card-item">
                                            <img src={card.image_url} alt={card.name} />
                                            <div className="user-card-details">
                                                <strong>{card.name}</strong>
                                                <span className="user-card-type">{card.pokemon_type}</span>
                                                <div className="user-card-stats">
                                                    <span>HP: {card.hp}</span>
                                                    <span>ATK: {card.attack}</span>
                                                </div>
                                                <span
                                                    className="user-card-rarity"
                                                    style={{ color: getRarityColor(card.rarity) }}
                                                >
                                                    {card.rarity}
                                                </span>
                                                <span className="user-card-price">${card.price}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        <div className="modal-actions">
                            <button
                                className="btn-cancel"
                                onClick={() => setShowCardsModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Users;