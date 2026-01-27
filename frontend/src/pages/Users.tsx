import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Users.css";

interface User {
    id: string;
    name: string;
    email: string;
}

function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Edit form state (UI only)
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editPassword, setEditPassword] = useState("");

    const navigate = useNavigate();

    // --------------------------------------------------
    // Fetch all users (NO AUTH, matches backend)
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
    // Handlers
    // --------------------------------------------------
    const handleEditClick = (user: User) => {
        setSelectedUser(user);
        setEditName(user.name);
        setEditEmail(user.email);
        setEditPassword("");
        setShowEditModal(true);
    };

    const handleSaveEdit = () => {
        alert("✨ This is a future feature. Admin edit will be enabled later.");
        setShowEditModal(false);
    };

    const handleConfirmDelete = () => {
        alert("✨ This is a future feature. Admin delete will be enabled later.");
        setShowDeleteModal(false);
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

            {/* TABLE */}
            <div className="users-table-wrapper">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Password</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>*******</td>
                                <td className="actions-cell">
                                    <button
                                        className="edit-btn"
                                        onClick={() => handleEditClick(user)}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="delete-btn"
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setShowDeleteModal(true);
                                        }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* EDIT MODAL */}
            {showEditModal && selectedUser && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowEditModal(false)}
                >
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Edit User</h3>

                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                value={editPassword}
                                onChange={(e) => setEditPassword(e.target.value)}
                                placeholder="New password (optional)"
                            />
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn-cancel"
                                onClick={() => setShowEditModal(false)}
                            >
                                Cancel
                            </button>
                            <button className="btn-save" onClick={handleSaveEdit}>
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {showDeleteModal && selectedUser && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowDeleteModal(false)}
                >
                    <div
                        className="modal modal-delete"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>Delete User</h3>

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
                            >
                                Cancel
                            </button>
                            <button className="btn-danger" onClick={handleConfirmDelete}>
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Users;
