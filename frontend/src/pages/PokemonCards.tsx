/**
 * PokemonCards.tsx
 *
 * Displays the full Pokemon card marketplace/catalog where users can browse
 * and add cards to their shopping cart.
 *
 * Features:
 * - Displays all available Pokemon cards in a responsive grid
 * - Shows card details: name, type, HP, attack, price, rarity
 * - Tracks owned vs available cards
 * - Prevents users from exceeding 3-card limit (owned + in cart)
 * - Role-based UI (admin can view but not purchase)
 * - Real-time cart count
 * - Color-coded rarity system (Legendary, Rare, Common)
 *
 * Business Rules:
 * - Users can own maximum 3 cards total
 * - Cards already owned show "OWNED" and cannot be re-purchased
 * - Cart + owned cards cannot exceed 3
 * - Admin users can only view cards, not purchase
 */

// React hooks for state management and side effects
import { useEffect, useState } from "react";
// React Router hook for programmatic navigation
import { useNavigate } from "react-router-dom";
// Pokemon cards page specific styles
import "./PokemonCards.css";

/**
 * TypeScript interface defining the structure of a Pokemon card object
 * Ensures type safety when working with card data from the API
 */
interface PokemonCard {
    id: string;              // Unique identifier for the card
    name: string;            // Pokemon name (e.g., "Pikachu")
    pokemon_type: string;    // Pokemon type (e.g., "Electric", "Fire")
    hp: number;              // Hit points/health value
    attack: string;          // Attack move name
    price: number;           // Card price in dollars
    rarity: string;          // Rarity tier (Legendary, Rare, Common)
    image_url: string;       // URL to card image
    is_owned: boolean;       // Whether current user owns this card
}

function PokemonCards() {
    // State to store array of all Pokemon cards from the API
    const [cards, setCards] = useState<PokemonCard[]>([]);

    // State to track number of cards currently in user's cart
    const [cartCount, setCartCount] = useState(0);

    // State to track number of cards owned by the user
    const [ownedCount, setOwnedCount] = useState(0);

    // State to track if current user is an admin
    const [isAdmin, setIsAdmin] = useState(false);

    // State to track if cards are still being fetched from API
    const [loading, setLoading] = useState(true);

    // React Router navigation hook for programmatic page navigation
    const navigate = useNavigate();

    /**
     * Effect hook that runs once on component mount
     * Checks user role and fetches initial data (cards and cart)
     * Dependencies: [] ensures this runs only once when component mounts
     */
    useEffect(() => {
        // Retrieve user data from localStorage to check admin status
        const userStr = localStorage.getItem("user");

        if (userStr) {
            // Parse user JSON and extract admin flag
            const user = JSON.parse(userStr);
            setIsAdmin(user.is_admin || false);
        }

        // Fetch all available Pokemon cards from API
        fetchCards();

        // Fetch current cart count for this user
        fetchCartCount();
    }, []);

    /**
     * Async function to fetch all Pokemon cards from the API
     * Also calculates and updates the count of owned cards
     * Sets loading state to false when complete
     */
    const fetchCards = async () => {
        // Get authentication token from localStorage
        const token = localStorage.getItem("token");

        try {
            // Make GET request to cards endpoint with auth header
            const res = await fetch("http://localhost:8000/api/cards", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            // Parse JSON response containing array of card objects
            const data = await res.json();

            // Update cards state with fetched data
            setCards(data);

            // Filter cards to count how many are owned by current user
            const owned = data.filter((card: PokemonCard) => card.is_owned).length;

            // Update owned count state
            setOwnedCount(owned);
        } catch (err) {
            // Log error if API call fails
            console.error("Failed to fetch cards:", err);
        } finally {
            // Always set loading to false, whether request succeeded or failed
            setLoading(false);
        }
    };

    /**
     * Async function to fetch the current cart count for the user
     * Used to display cart badge and enforce 3-card limit
     */
    const fetchCartCount = async () => {
        // Get authentication token from localStorage
        const token = localStorage.getItem("token");

        try {
            // Make GET request to cart endpoint
            const res = await fetch("http://localhost:8000/api/cart", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            // Parse response (array of cart items)
            const data = await res.json();

            // Update cart count with array length
            setCartCount(data.length);
        } catch (err) {
            // Log error if fetching cart fails
            console.error("Failed to fetch cart:", err);
        }
    };

    /**
     * Async function to add a card to the user's shopping cart
     * @param cardId - Unique identifier of the card to add
     * @param cardName - Name of the card (for success message)
     *
     * Handles success/error states and updates cart count on success
     */
    const addToCart = async (cardId: string, cardName: string) => {
        // Get authentication token from localStorage
        const token = localStorage.getItem("token");

        try {
            // Make POST request to add card to cart
            const res = await fetch(`http://localhost:8000/api/cart/add/${cardId}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            // Check if request failed (non-2xx status code)
            if (!res.ok) {
                // Parse error response to get error details
                const error = await res.json();

                // Show error message to user
                alert(`❌ ${error.detail}`);
                return;
            }

            // Show success message with card name
            alert(`✅ ${cardName} added to cart!`);

            // Increment cart count by 1 (using functional update for accuracy)
            setCartCount(prev => prev + 1);
        } catch (err) {
            // Show generic error message if request completely fails
            alert("Failed to add card to cart");
        }
    };

    /**
     * Helper function to get color code based on card rarity
     * @param rarity - Rarity tier string (Legendary, Rare, Common)
     * @returns Hex color code for the rarity level
     *
     * Used to visually distinguish card rarity in the UI
     */
    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case "Legendary": return "#FFD700";  // Gold color for legendary
            case "Rare": return "#C0C0C0";       // Silver color for rare
            case "Common": return "#CD7F32";     // Bronze color for common
            default: return "#fff";              // White fallback
        }
    };

    // If data is still loading, show loading state
    if (loading) {
        return <div className="loading">Loading Pokemon Cards...</div>;
    }

    return (
        <div className="pokemon-cards-page">
            {/* Header Section - Title, collection status, and cart button */}
            <div className="cards-header">
                <div>
                    <h2>Pokemon Cards Collection</h2>

                    {/* Display user's collection progress */}
                    <p className="collection-status">
                        Your Collection: <strong>{ownedCount}/3</strong> cards

                        {/* Show warning when max limit reached */}
                        {ownedCount >= 3 && <span className="max-reached"> (Maximum reached!)</span>}
                    </p>
                </div>

                {/* Cart button - Only visible to regular users (not admins) */}
                {!isAdmin && (
                    <button
                        className="cart-btn"
                        onClick={() => navigate("/cart")}
                    >
                        {/* Show cart icon and current count */}
                        🛒 Cart ({cartCount})
                    </button>
                )}
            </div>

            {/* Admin Notice - Only visible to admin users */}
            {isAdmin && (
                <div className="admin-notice">
                    🔐 <strong>Admin View:</strong> You can view cards but cannot purchase them.
                </div>
            )}

            {/* Cards Grid - Displays all Pokemon cards */}
            <div className="cards-grid">
                {/* Map over cards array to render each card */}
                {cards.map((card) => (
                    <div key={card.id} className="pokemon-card">
                        {/* Card Image Section */}
                        <div className="card-image">
                            <img src={card.image_url} alt={card.name} />
                        </div>

                        {/* Card Details Section */}
                        <div className="card-body">
                            {/* Card Name */}
                            <h3 className="card-name">{card.name}</h3>

                            {/* Pokemon Type */}
                            <div className="card-type">{card.pokemon_type}</div>

                            {/* Card Stats - HP and Attack */}
                            <div className="card-stats">
                                {/* HP Stat */}
                                <div className="stat">
                                    <span className="stat-label">HP:</span>
                                    <span className="stat-value">{card.hp}</span>
                                </div>

                                {/* Attack Stat */}
                                <div className="stat">
                                    <span className="stat-label">Attack:</span>
                                    <span className="stat-value">{card.attack}</span>
                                </div>
                            </div>

                            {/* Card Footer - Price and Rarity */}
                            <div className="card-footer">
                                {/* Card Price */}
                                <div className="card-price">${card.price}</div>

                                {/* Card Rarity - Color coded based on rarity */}
                                <div
                                    className="card-rarity"
                                    style={{ color: getRarityColor(card.rarity) }}
                                >
                                    {card.rarity}
                                </div>
                            </div>

                            {/* Add to Cart Button - Only visible to regular users */}
                            {!isAdmin && (
                                <button
                                    // Dynamic class based on ownership status
                                    className={`add-to-cart-btn ${card.is_owned ? "owned" : ""}`}
                                    // Handler to add card to cart
                                    onClick={() => addToCart(card.id, card.name)}
                                    // Disable if already owned OR if cart+owned >= 3
                                    disabled={card.is_owned || ownedCount + cartCount >= 3}
                                >
                                    {/* Conditional button text based on state */}
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

// Export PokemonCards component as default export
export default PokemonCards;