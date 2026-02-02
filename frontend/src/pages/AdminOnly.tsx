import { useNavigate } from "react-router-dom";
import "./AdminOnly.css";

function AdminOnly() {
    const navigate = useNavigate();

    return (
        <div className="admin-only-page">
            <div className="blocked-card">
                <div className="lock-icon">🔒</div>

                <h2>Admin Access Required</h2>

                <p className="blocked-message">
                    This page is restricted to administrators only.
                </p>

                <div className="battle-section">
                    <div className="pokeball-icon">⚔️</div>

                    <h3>Want Admin Access?</h3>

                    <p className="battle-text">
                        Prove your worth in the <strong>Pokemon Battle Arena</strong>!
                    </p>

                    <div className="coming-soon-badge">
                        🎮 Coming Soon - Future Feature
                    </div>
                </div>

                <div className="action-buttons">
                    <button
                        className="back-btn"
                        onClick={() => navigate("/dashboard")}
                    >
                        ← Back to Dashboard
                    </button>

                    <button
                        className="cards-btn"
                        onClick={() => navigate("/pokemon-cards")}
                    >
                        Browse Pokemon Cards
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AdminOnly;
