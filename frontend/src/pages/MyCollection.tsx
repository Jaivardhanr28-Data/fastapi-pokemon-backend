import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MyCollection.css";

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

function MyCollection() {
    const [ownedCards, setOwnedCards] = useState<OwnedCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [cardToRemove, setCardToRemove] = useState<OwnedCard | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchOwnedCards();
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
            setOwnedCards(data);
        } catch (err) {
            console.error("Failed to fetch owned cards:", err);
        } finally {
            setLoading(false);
        }
    };

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case "Legendary": return "#FFD700";
            case "Rare": return "#C0C0C0";
            case "Common": return "#CD7F32";
            default: return "#fff";
        }
    };

    const handleRemoveClick = (card: OwnedCard) => {
        setCardToRemove(card);
        setShowRemoveModal(true);
    };

    const handleConfirmRemove = async () => {
        if (!cardToRemove) return;

        setIsRemoving(true);

        const token = localStorage.getItem("token");

        try {
            const res = await fetch(`http://localhost:8000/api/cards/owned/${cardToRemove.id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to remove card");
            }

            setOwnedCards((prev) => prev.filter((card) => card.id !== cardToRemove.id));

            alert(`✅ ${cardToRemove.name} has been removed from your collection!`);

            setShowRemoveModal(false);
            setCardToRemove(null);
        } catch (err: any) {
            alert(`❌ ${err.message}`);
        } finally {
            setIsRemoving(false);
        }
    };

    const totalValue = ownedCards.reduce((sum, card) => sum + card.price, 0);

    if (loading) {
        return <div className="loading">Loading your collection...</div>;
    }

    return (
        <div className="my-collection-page">
            <div className="collection-header">
                <div>
                    <h2>My Pokemon Collection</h2>

                    <p className="collection-stats">
                        {ownedCards.length} / 3 Cards | Total Value: ${totalValue.toFixed(2)}
                    </p>
                </div>

                <button className="browse-more-btn" onClick={() => navigate("/pokemon-cards")}>
                    Browse More Cards
                </button>
            </div>

            {ownedCards.length === 0 ? (
                <div className="empty-collection">
                    <div className="empty-icon">📦</div>
                    <h3>No cards in your collection yet</h3>
                    <p>Start building your Pokemon card collection today!</p>

                    <button className="start-btn" onClick={() => navigate("/pokemon-cards")}>
                        Start Collecting
                    </button>
                </div>
            ) : (
                <>
                    {ownedCards.length < 3 && (
                        <div className="progress-notice">
                            🎯 You can collect {3 - ownedCards.length} more card{3 - ownedCards.length !== 1 ? 's' : ''}!
                        </div>
                    )}

                    {ownedCards.length === 3 && (
                        <div className="max-notice">
                            ✨ Congratulations! Your collection is complete with 3 cards!
                        </div>
                    )}

                    <div className="owned-cards-grid">
                        {ownedCards.map((card) => (
                            <div key={card.id} className="owned-card">
                                <div className="owned-badge">✓ OWNED</div>

                                <div className="card-image">
                                    <img src={card.image_url} alt={card.name} />
                                </div>

                                <div className="card-body">
                                    <h3 className="card-name">{card.name}</h3>

                                    <div className="card-type">{card.pokemon_type}</div>

                                    <div className="card-stats">
                                        <div className="stat">
                                            <span className="stat-label">HP:</span>
                                            <span className="stat-value">{card.hp}</span>
                                        </div>

                                        <div className="stat">
                                            <span className="stat-label">Attack:</span>
                                            <span className="stat-value">{card.attack}</span>
                                        </div>
                                    </div>

                                    <div className="card-footer">
                                        <div className="card-value">Value: ${card.price}</div>

                                        <div
                                            className="card-rarity"
                                            style={{ color: getRarityColor(card.rarity) }}
                                        >
                                            {card.rarity}
                                        </div>
                                    </div>

                                    <div className="purchased-date">
                                        Purchased: {new Date(card.purchased_at).toLocaleDateString()}
                                    </div>

                                    <button
                                        className="remove-card-btn"
                                        onClick={() => handleRemoveClick(card)}
                                    >
                                        🗑️ Remove from Collection
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {showRemoveModal && cardToRemove && (
                <div
                    className="modal-overlay"
                    onClick={() => !isRemoving && setShowRemoveModal(false)}
                >
                    <div className="modal modal-remove" onClick={(e) => e.stopPropagation()}>
                        <h3>Remove Card from Collection</h3>

                        <div className="remove-card-preview">
                            <img src={cardToRemove.image_url} alt={cardToRemove.name} />

                            <div className="remove-card-info">
                                <strong>{cardToRemove.name}</strong>

                                <span className="remove-card-type">{cardToRemove.pokemon_type}</span>

                                <span className="remove-card-value">Value: ${cardToRemove.price}</span>
                            </div>
                        </div>

                        <p className="remove-warning">
                            Are you sure you want to remove <strong>{cardToRemove.name}</strong> from your collection?
                        </p>

                        <p className="remove-subtext">
                            You can purchase this card again later from the marketplace.
                        </p>

                        <div className="modal-actions">
                            <button
                                className="btn-cancel"
                                onClick={() => setShowRemoveModal(false)}
                                disabled={isRemoving}
                            >
                                Keep Card
                            </button>

                            <button
                                className="btn-danger"
                                onClick={handleConfirmRemove}
                                disabled={isRemoving}
                            >
                                {isRemoving ? "Removing..." : "Remove Card"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyCollection;
