import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PokemonCards.css";

interface PokemonCard {
    id: string;
    name: string;
    pokemon_type: string;
    hp: number;
    attack: string;
    price: number;
    rarity: string;
    image_url: string;
    pokedex_number?: number;
    is_owned: boolean;
}

interface CardFormData {
    name: string;
    pokemon_type: string;
    hp: number;
    attack: string;
    price: number;
    rarity: string;
    pokedex_number: number;
}

const emptyFormData: CardFormData = {
    name: "",
    pokemon_type: "",
    hp: 100,
    attack: "",
    price: 9.99,
    rarity: "Common",
    pokedex_number: 1
};

function PokemonCards() {
    const [cards, setCards] = useState<PokemonCard[]>([]);
    const [cartCount, setCartCount] = useState(0);
    const [ownedCount, setOwnedCount] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Admin modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedCard, setSelectedCard] = useState<PokemonCard | null>(null);
    const [formData, setFormData] = useState<CardFormData>(emptyFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const userStr = localStorage.getItem("user");

        if (userStr) {
            const user = JSON.parse(userStr);
            setIsAdmin(user.is_admin || false);
        }

        fetchCards();
        fetchCartCount();
    }, []);

    const fetchCards = async () => {
        const token = localStorage.getItem("token");

        try {
            const res = await fetch("http://localhost:8000/api/cards", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await res.json();
            setCards(data);

            const owned = data.filter((card: PokemonCard) => card.is_owned).length;
            setOwnedCount(owned);
        } catch (err) {
            console.error("Failed to fetch cards:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCartCount = async () => {
        const token = localStorage.getItem("token");

        try {
            const res = await fetch("http://localhost:8000/api/cart", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await res.json();
            setCartCount(data.length);
        } catch (err) {
            console.error("Failed to fetch cart:", err);
        }
    };

    const addToCart = async (cardId: string, cardName: string) => {
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(`http://localhost:8000/api/cart/add/${cardId}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const error = await res.json();
                alert(`${error.detail}`);
                return;
            }

            alert(`${cardName} added to cart!`);
            setCartCount(prev => prev + 1);
        } catch (err) {
            alert("Failed to add card to cart");
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

    const getImageUrl = (pokedexNumber: number) => {
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokedexNumber}.png`;
    };

    // Admin handlers
    const handleAddClick = () => {
        setFormData(emptyFormData);
        setError("");
        setShowAddModal(true);
    };

    const handleEditClick = (card: PokemonCard) => {
        setSelectedCard(card);
        setFormData({
            name: card.name,
            pokemon_type: card.pokemon_type,
            hp: card.hp,
            attack: card.attack,
            price: card.price,
            rarity: card.rarity,
            pokedex_number: card.pokedex_number || 1
        });
        setError("");
        setShowEditModal(true);
    };

    const handleDeleteClick = (card: PokemonCard) => {
        setSelectedCard(card);
        setError("");
        setShowDeleteModal(true);
    };

    const handleAddSubmit = async () => {
        setIsSubmitting(true);
        setError("");
        const token = localStorage.getItem("token");

        try {
            const res = await fetch("http://localhost:8000/admin/cards", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to create card");
            }

            alert("Card created successfully!");
            setShowAddModal(false);
            fetchCards();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSubmit = async () => {
        if (!selectedCard) return;

        setIsSubmitting(true);
        setError("");
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(`http://localhost:8000/admin/cards/${selectedCard.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to update card");
            }

            alert("Card updated successfully!");
            setShowEditModal(false);
            fetchCards();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSubmit = async () => {
        if (!selectedCard) return;

        setIsSubmitting(true);
        setError("");
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(`http://localhost:8000/admin/cards/${selectedCard.id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to delete card");
            }

            alert("Card deleted successfully!");
            setShowDeleteModal(false);
            fetchCards();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading Pokemon Cards...</div>;
    }

    return (
        <div className="pokemon-cards-page">
            <div className="cards-header">
                <div>
                    <h2>{isAdmin ? "Manage Pokemon Cards" : "Pokemon Cards Collection"}</h2>

                    {!isAdmin && (
                        <p className="collection-status">
                            Your Collection: <strong>{ownedCount}/3</strong> cards

                            {ownedCount >= 3 && <span className="max-reached"> (Maximum reached!)</span>}
                        </p>
                    )}
                </div>

                <div className="header-actions">
                    {isAdmin && (
                        <button className="add-card-btn" onClick={handleAddClick}>
                            + Add Card
                        </button>
                    )}

                    {!isAdmin && (
                        <button
                            className="cart-btn"
                            onClick={() => navigate("/cart")}
                        >
                            Cart ({cartCount})
                        </button>
                    )}
                </div>
            </div>

            {isAdmin && (
                <div className="admin-notice">
                    <strong>Admin Mode:</strong> You can add, edit, and delete Pokemon cards.
                </div>
            )}

            {cards.length === 0 ? (
                <div className="no-cards-message">
                    <div className="no-cards-icon">🎴</div>
                    <h3>No Pokemon Cards Available</h3>
                    {isAdmin ? (
                        <p>Click the "+ Add Card" button above to add your first Pokemon card to the marketplace.</p>
                    ) : (
                        <p>Please wait for future admin updates. New Pokemon cards will be added soon!</p>
                    )}
                </div>
            ) : (
            <div className="cards-grid">
                {cards.map((card) => (
                    <div key={card.id} className="pokemon-card">
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
                                <div className="card-price">${card.price}</div>

                                <div
                                    className="card-rarity"
                                    style={{ color: getRarityColor(card.rarity) }}
                                >
                                    {card.rarity}
                                </div>
                            </div>

                            {isAdmin ? (
                                <div className="admin-card-actions">
                                    <button
                                        className="edit-card-btn"
                                        onClick={() => handleEditClick(card)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="delete-card-btn"
                                        onClick={() => handleDeleteClick(card)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className={`add-to-cart-btn ${card.is_owned ? "owned" : ""}`}
                                    onClick={() => addToCart(card.id, card.name)}
                                    disabled={card.is_owned || ownedCount + cartCount >= 3}
                                >
                                    {card.is_owned ? "OWNED" :
                                        ownedCount + cartCount >= 3 ? "MAX REACHED" :
                                            "Add to Cart"}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            )}

            {/* Add Card Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => !isSubmitting && setShowAddModal(false)}>
                    <div className="modal card-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Add New Pokemon Card</h3>

                        {error && <div className="modal-error">{error}</div>}

                        <div className="modal-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Pikachu"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Pokedex #</label>
                                    <input
                                        type="number"
                                        value={formData.pokedex_number}
                                        onChange={(e) => setFormData({ ...formData, pokedex_number: parseInt(e.target.value) || 1 })}
                                        min="1"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Type</label>
                                    <input
                                        type="text"
                                        value={formData.pokemon_type}
                                        onChange={(e) => setFormData({ ...formData, pokemon_type: e.target.value })}
                                        placeholder="e.g., Electric"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>HP</label>
                                    <input
                                        type="number"
                                        value={formData.hp}
                                        onChange={(e) => setFormData({ ...formData, hp: parseInt(e.target.value) || 0 })}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Attack</label>
                                    <input
                                        type="text"
                                        value={formData.attack}
                                        onChange={(e) => setFormData({ ...formData, attack: e.target.value })}
                                        placeholder="e.g., Thunderbolt"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Price ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Rarity</label>
                                <select
                                    value={formData.rarity}
                                    onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                                    disabled={isSubmitting}
                                >
                                    <option value="Common">Common</option>
                                    <option value="Rare">Rare</option>
                                    <option value="Legendary">Legendary</option>
                                </select>
                            </div>

                            <div className="image-preview">
                                <label>Image Preview</label>
                                <img
                                    src={getImageUrl(formData.pokedex_number)}
                                    alt="Preview"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=Invalid+Pokedex";
                                    }}
                                />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn-cancel"
                                onClick={() => setShowAddModal(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-save"
                                onClick={handleAddSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Creating..." : "Create Card"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Card Modal */}
            {showEditModal && selectedCard && (
                <div className="modal-overlay" onClick={() => !isSubmitting && setShowEditModal(false)}>
                    <div className="modal card-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Edit Pokemon Card</h3>

                        {error && <div className="modal-error">{error}</div>}

                        <div className="modal-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Pokedex #</label>
                                    <input
                                        type="number"
                                        value={formData.pokedex_number}
                                        onChange={(e) => setFormData({ ...formData, pokedex_number: parseInt(e.target.value) || 1 })}
                                        min="1"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Type</label>
                                    <input
                                        type="text"
                                        value={formData.pokemon_type}
                                        onChange={(e) => setFormData({ ...formData, pokemon_type: e.target.value })}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>HP</label>
                                    <input
                                        type="number"
                                        value={formData.hp}
                                        onChange={(e) => setFormData({ ...formData, hp: parseInt(e.target.value) || 0 })}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Attack</label>
                                    <input
                                        type="text"
                                        value={formData.attack}
                                        onChange={(e) => setFormData({ ...formData, attack: e.target.value })}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Price ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Rarity</label>
                                <select
                                    value={formData.rarity}
                                    onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                                    disabled={isSubmitting}
                                >
                                    <option value="Common">Common</option>
                                    <option value="Rare">Rare</option>
                                    <option value="Legendary">Legendary</option>
                                </select>
                            </div>

                            <div className="image-preview">
                                <label>Image Preview</label>
                                <img
                                    src={getImageUrl(formData.pokedex_number)}
                                    alt="Preview"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=Invalid+Pokedex";
                                    }}
                                />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn-cancel"
                                onClick={() => setShowEditModal(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-save"
                                onClick={handleEditSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Card Modal */}
            {showDeleteModal && selectedCard && (
                <div className="modal-overlay" onClick={() => !isSubmitting && setShowDeleteModal(false)}>
                    <div className="modal modal-delete" onClick={(e) => e.stopPropagation()}>
                        <h3>Delete Pokemon Card</h3>

                        {error && <div className="modal-error">{error}</div>}

                        <div className="delete-card-preview">
                            <img src={selectedCard.image_url} alt={selectedCard.name} />
                            <p><strong>{selectedCard.name}</strong></p>
                        </div>

                        <p className="delete-warning">
                            Are you sure you want to delete this card?
                        </p>
                        <p className="delete-subtext">
                            This will also remove it from all user collections and carts.
                        </p>

                        <div className="modal-actions">
                            <button
                                className="btn-cancel"
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-danger"
                                onClick={handleDeleteSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Deleting..." : "Delete Card"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PokemonCards;
