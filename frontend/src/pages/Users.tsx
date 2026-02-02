import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Users.css";

interface User {
    id: string;
    name: string;
    email: string;
    is_admin?: boolean;
    cards_owned?: number;
}

interface OwnedCard {
    id: string;
    name: string;
    pokemon_type: string;
    hp: number;
    attack: string;
    price: number;
    rarity: string;
    image_url: string;
    purchased_at: string;
}

function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showCardsModal, setShowCardsModal] = useState(false);
    const [userCards, setUserCards] = useState<OwnedCard[]>([]);
    const [cardsLoading, setCardsLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editPassword, setEditPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const userStr = localStorage.getItem("user");

        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setIsAdmin(user.is_admin || false);
            } catch {
                setIsAdmin(false);
            }
        }
    }, []);

    useEffect(() => {
        fetch("http://localhost:8000/users")
            .then((res) => res.json())
            .then((data) => setUsers(data))
            .catch(() => {
                alert("Failed to load users");
            });
    }, []);

    const getAuthToken = (): string | null => {
        return localStorage.getItem("token");
    };

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case "Legendary": return "#FFD700";
            case "Rare": return "#C0C0C0";
            case "Common": return "#CD7F32";
            default: return "#fff";
        }
    };

    const handleViewCardsClick = async (user: User) => {
        setSelectedUser(user);
        setShowCardsModal(true);
        setCardsLoading(true);
        setUserCards([]);
        setError("");

        const token = getAuthToken();

        if (!token) {
            setError("You must be logged in to view user cards");
            setCardsLoading(false);
            return;
        }

        try {
            const res = await fetch(`http://localhost:8000/admin/users/${user.id}/cards`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to fetch user cards");
            }

            const cards = await res.json();
            setUserCards(cards);
        } catch (err: any) {
            if (err.message.includes("403") || err.message.includes("Admin")) {
                setError("❌ Admin access required");
            }
            else if (err.message.includes("401") || err.message.includes("token")) {
                setError("❌ Session expired. Please login again.");
            }
            else {
                setError(`❌ ${err.message}`);
            }
        } finally {
            setCardsLoading(false);
        }
    };

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

    const handleEditClick = (user: User) => {
        setSelectedUser(user);
        setEditName(user.name);
        setEditEmail(user.email);
        setEditPassword("");
        setError("");
        setShowEditModal(true);
    };

    const handleDeleteClick = (user: User) => {
        setSelectedUser(user);
        setError("");
        setShowDeleteModal(true);
    };

    return (
        <div className="users-page">
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
