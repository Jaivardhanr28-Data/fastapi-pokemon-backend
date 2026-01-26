import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Users.css";

type User = {
    id: string;
    name: string;
    email: string;
};

export default function Users() {
    const navigate = useNavigate();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Edit modal state
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editPassword, setEditPassword] = useState("");

    // Fetch users
    const loadUsers = async () => {
        try {
            setLoading(true);
            const res = await fetch("http://localhost:8000/users");
            if (!res.ok) throw new Error("Failed to fetch users");
            const data = await res.json();
            setUsers(data);
        } catch {
            setError("Could not load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    // Delete user
    const handleDelete = async (user: User) => {
        const confirm = window.confirm(
            `Are you sure you want to delete ${user.name}?`
        );
        if (!confirm) return;

        try {
            const res = await fetch(
                `http://localhost:8000/user?id=${user.id}`,
                { method: "DELETE" }
            );

            if (!res.ok) {
                const err = await res.json();
                alert(err.detail || "Delete failed");
                return;
            }

            await loadUsers();
        } catch {
            alert("Delete failed");
        }
    };

    // Open edit modal
    const openEdit = (user: User) => {
        setEditingUser(user);
        setEditName(user.name);
        setEditEmail(user.email);
        setEditPassword("");
    };

    // Save edit
    const saveEdit = async () => {
        if (!editingUser) return;

        try {
            const res = await fetch(
                `http://localhost:8000/profile?id=${editingUser.id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: editName,
                        email: editEmail,
                        password: editPassword || undefined,
                    }),
                }
            );

            if (!res.ok) {
                const err = await res.json();
                alert(err.detail || "Update failed");
                return;
            }

            setEditingUser(null);
            await loadUsers();
        } catch {
            alert("Update failed");
        }
    };

    if (loading) return <p className="users-msg">Loading users...</p>;
    if (error) return <p className="users-msg error">{error}</p>;

    return (
        <div className="users-page">
            <div className="users-header">
                <h2>Pokemon Card Users</h2>
                <button
                    className="add-user-btn"
                    onClick={() => navigate("/users/register")}
                >
                    +
                </button>
            </div>

            <table className="users-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Pass</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => (
                        <tr key={u.id}>
                            <td>{u.name}</td>
                            <td>{u.email}</td>
                            <td>{"*".repeat(8)}</td>
                            <td className="actions">
                                <button className="edit-btn" onClick={() => openEdit(u)}>
                                    Edit
                                </button>
                                <button
                                    className="delete-btn"
                                    onClick={() => handleDelete(u)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* EDIT MODAL */}
            {editingUser && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <h3>Edit User</h3>

                        <input
                            placeholder="Name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                        />

                        <input
                            placeholder="Email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                        />

                        <input
                            placeholder="New Password (optional)"
                            type="password"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                        />

                        <div className="modal-actions">
                            <button className="save-btn" onClick={saveEdit}>
                                Save
                            </button>
                            <button
                                className="cancel-btn"
                                onClick={() => setEditingUser(null)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
