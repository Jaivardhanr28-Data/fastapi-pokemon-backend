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
    is_owned: boolean;
}

function PokemonCards() {
    const [cards, setCards] = useState<PokemonCard[]>([]);
    const [cartCount, setCartCount] = useState(0);
    const [ownedCount, setOwnedCount] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

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
                alert(`❌ ${error.detail}`);
                return;
            }

            alert(`✅ ${cardName} added to cart!`);
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

    if (loading) {
        return <div className="loading">Loading Pokemon Cards...</div>;
    }

    return (
        <div className="pokemon-cards-page">
            <div className="cards-header">
                <div>
                    <h2>Pokemon Cards Collection</h2>

                    <p className="collection-status">
                        Your Collection: <strong>{ownedCount}/3</strong> cards

                        {ownedCount >= 3 && <span className="max-reached"> (Maximum reached!)</span>}
                    </p>
                </div>

                {!isAdmin && (
                    <button
                        className="cart-btn"
                        onClick={() => navigate("/cart")}
                    >
                        🛒 Cart ({cartCount})
                    </button>
                )}
            </div>

            {isAdmin && (
                <div className="admin-notice">
                    🔐 <strong>Admin View:</strong> You can view cards but cannot purchase them.
                </div>
            )}

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

                            {!isAdmin && (
                                <button
                                    className={`add-to-cart-btn ${card.is_owned ? "owned" : ""}`}
                                    onClick={() => addToCart(card.id, card.name)}
                                    disabled={card.is_owned || ownedCount + cartCount >= 3}
                                >
                                    {card.is_owned ? "✓ OWNED" :
                                        ownedCount + cartCount >= 3 ? "MAX REACHED" :
                                            "Add to Cart"}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default PokemonCards;
