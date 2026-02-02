import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
    const [user, setUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [ownedCardsCount, setOwnedCardsCount] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const userStr = localStorage.getItem("user");

        if (userStr) {
            const userData = JSON.parse(userStr);
            setUser(userData);
            setIsAdmin(userData.is_admin || false);
        }

        if (userStr && !JSON.parse(userStr).is_admin) {
            fetchOwnedCards();
        }
    }, []);

    const fetchOwnedCards = async () => {
        const token = localStorage.getItem("token");

        try {
            const res = await fetch("http://localhost:8000/api/cards/owned", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await res.json();
            setOwnedCardsCount(data.length);
        } catch (err) {
            console.error("Failed to fetch owned cards:", err);
        }
    };

    if (!user) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="dashboard-page">
            <div className="welcome-section">
                <h1>Welcome, {user.name}! 👋</h1>

                <p className="subtitle">
                    {isAdmin
                        ? "You have admin access to manage users and cards"
                        : "Start collecting your favorite Pokemon cards"}
                </p>
            </div>

            {isAdmin && (
                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <div className="card-icon">👥</div>
                        <h3>Manage Users</h3>
                        <p>View and manage all users</p>
                        <button
                            className="card-action-btn"
                            onClick={() => navigate("/users")}
                        >
                            Go to Users
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">🎮</div>
                        <h3>Pokemon Cards</h3>
                        <p>View available Pokemon cards</p>
                        <button
                            className="card-action-btn"
                            onClick={() => navigate("/pokemon-cards")}
                        >
                            View Cards
                        </button>
                    </div>

                    <div className="dashboard-card admin-info">
                        <div className="card-icon">🔐</div>
                        <h3>Admin Status</h3>
                        <p>You have full administrative access</p>
                    </div>
                </div>
            )}

            {!isAdmin && (
                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <div className="card-icon">🎮</div>
                        <h3>Browse Cards</h3>
                        <p>Explore our Pokemon card collection</p>
                        <button
                            className="card-action-btn"
                            onClick={() => navigate("/pokemon-cards")}
                        >
                            Browse Cards
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">📦</div>
                        <h3>My Collection</h3>
                        <p>You own {ownedCardsCount} / 3 cards</p>
                        <button
                            className="card-action-btn"
                            onClick={() => navigate("/my-collection")}
                        >
                            View Collection
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">🛒</div>
                        <h3>Shopping Cart</h3>
                        <p>View your cart and checkout</p>
                        <button
                            className="card-action-btn"
                            onClick={() => navigate("/cart")}
                        >
                            Go to Cart
                        </button>
                    </div>
                </div>
            )}

            <div className="instructions-section">
                <h3>Getting Started</h3>
                <div className="instructions-grid">
                    {isAdmin ? (
                        <>
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

export default Dashboard;
