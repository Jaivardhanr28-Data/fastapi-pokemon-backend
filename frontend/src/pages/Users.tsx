import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Users.css";

interface User {
    id: string;
    name: string;
    email: string;
    is_admin?: boolean;
}

function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // Edit form state
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editPassword, setEditPassword] = useState("");

    // Loading and error states
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    // --------------------------------------------------
    // Check if current user is admin
    // --------------------------------------------------
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

    // --------------------------------------------------
    // Fetch all users (NO AUTH required for reading)
    // --------------------------------------------------
    useEffect(() => {
        fetch("http://localhost:8000/users")
            .then((res) => res.json())
            .then((data) => setUsers(data))
            .catch(() => {
                alert("Failed to load users");
            });
    }, []);

    // --------------------------------------------------
    // Get auth token from localStorage
    // --------------------------------------------------
    const getAuthToken = (): string | null => {
        return localStorage.getItem("token");
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
                    🔐 <strong>Admin Mode:</strong> You can edit and delete users
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
                            {isAdmin && <th>Actions</th>}
                        </tr>
                    </thead>

                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>*******</td>
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
        </div>
    );
}

export default Users;