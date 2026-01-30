/**
 * MyCollection.tsx
 *
 * Displays the user's personal Pokemon card collection page.
 * Shows all cards owned by the current user with ability to remove cards.
 *
 * Features:
 * - Displays owned cards in a responsive grid layout
 * - Shows card details: name, type, HP, attack, price, rarity, purchase date
 * - Calculates and displays total collection value
 * - Progress indicator showing X/3 cards collected
 * - Remove card functionality with confirmation modal
 * - Empty state with call-to-action to browse cards
 * - Color-coded rarity system
 * - Purchase date tracking
 *
 * Business Rules:
 * - Users can own maximum 3 cards
 * - Cards can be removed from collection (allows re-purchasing)
 * - Removing requires confirmation via modal
 * - Only regular users can access (admins don't collect)
 */

// React hooks for state management and side effects
import { useEffect, useState } from "react";
// React Router hook for programmatic navigation
import { useNavigate } from "react-router-dom";
// MyCollection page specific styles
import "./MyCollection.css";

/**
 * TypeScript interface defining the structure of an owned Pokemon card
 * Extends basic card data with ownership metadata (purchase date)
 */
interface OwnedCard {
    id: string;              // Unique identifier for the card
    name: string;            // Pokemon name
    pokemon_type: string;    // Pokemon type (Electric, Fire, etc.)
    hp: number;              // Hit points value
    attack: string;          // Attack move name
    price: number;           // Card value in dollars
    rarity: string;          // Rarity tier (Legendary, Rare, Common)
    image_url: string;       // URL to card image
    purchased_at: string;    // ISO timestamp of purchase date
}

function MyCollection() {
    // State to store array of cards owned by the current user
    const [ownedCards, setOwnedCards] = useState<OwnedCard[]>([]);

    // State to track if cards are still being fetched from API
    const [loading, setLoading] = useState(true);

    // State to control visibility of the remove confirmation modal
    const [showRemoveModal, setShowRemoveModal] = useState(false);

    // State to store the card that user wants to remove (null if none selected)
    const [cardToRemove, setCardToRemove] = useState<OwnedCard | null>(null);

    // State to track if a remove operation is in progress (prevents duplicate requests)
    const [isRemoving, setIsRemoving] = useState(false);

    // React Router navigation hook for programmatic page navigation
    const navigate = useNavigate();

    /**
     * Effect hook that runs once on component mount
     * Fetches the user's owned cards from the API
     * Dependencies: [] ensures this runs only once when component mounts
     */
    useEffect(() => {
        fetchOwnedCards();
    }, []);

    /**
     * Async function to fetch all cards owned by the current user
     * Updates ownedCards state and sets loading to false when complete
     */
    const fetchOwnedCards = async () => {
        // Get authentication token from localStorage
        const token = localStorage.getItem("token");

        try {
            // Make GET request to owned cards endpoint with auth header
            const res = await fetch("http://localhost:8000/api/cards/owned", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            // Parse JSON response containing array of owned card objects
            const data = await res.json();

            // Update owned cards state with fetched data
            setOwnedCards(data);
        } catch (err) {
            // Log error if API call fails
            console.error("Failed to fetch owned cards:", err);
        } finally {
            // Always set loading to false, whether request succeeded or failed
            setLoading(false);
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

    /**
     * Event handler to initiate card removal process
     * Opens the confirmation modal and stores the card to be removed
     * @param card - The card object that user wants to remove
     */
    const handleRemoveClick = (card: OwnedCard) => {
        // Set the card to be removed in state
        setCardToRemove(card);

        // Show the confirmation modal
        setShowRemoveModal(true);
    };

    /**
     * Async function to confirm and execute card removal
     * Makes DELETE API call and updates local state on success
     * Shows confirmation/error messages to user
     */
    const handleConfirmRemove = async () => {
        // Guard clause - exit if no card is selected for removal
        if (!cardToRemove) return;

        // Set removing state to true (disables buttons, shows loading)
        setIsRemoving(true);

        // Get authentication token from localStorage
        const token = localStorage.getItem("token");

        try {
            // Make DELETE request to remove card from collection
            const res = await fetch(`http://localhost:8000/api/cards/owned/${cardToRemove.id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            // Check if request failed (non-2xx status code)
            if (!res.ok) {
                // Parse error response
                const data = await res.json();

                // Throw error with detail message
                throw new Error(data.detail || "Failed to remove card");
            }

            // Success - remove card from local state (optimistic update)
            // Filter out the removed card by comparing IDs
            setOwnedCards((prev) => prev.filter((card) => card.id !== cardToRemove.id));

            // Show success message to user
            alert(`✅ ${cardToRemove.name} has been removed from your collection!`);

            // Close the confirmation modal
            setShowRemoveModal(false);

            // Clear the card to remove from state
            setCardToRemove(null);
        } catch (err: any) {
            // Show error message to user
            alert(`❌ ${err.message}`);
        } finally {
            // Always reset removing state, whether request succeeded or failed
            setIsRemoving(false);
        }
    };

    // Calculate total value of all owned cards using reduce
    // Sums up the price property of each card in the collection
    const totalValue = ownedCards.reduce((sum, card) => sum + card.price, 0);

    // If data is still loading, show loading state
    if (loading) {
        return <div className="loading">Loading your collection...</div>;
    }

    return (
        <div className="my-collection-page">
            {/* Header Section - Title, stats, and browse button */}
            <div className="collection-header">
                <div>
                    <h2>My Pokemon Collection</h2>

                    {/* Display collection statistics */}
                    <p className="collection-stats">
                        {/* Show owned count out of max 3 */}
                        {ownedCards.length} / 3 Cards | Total Value: ${totalValue.toFixed(2)}
                    </p>
                </div>

                {/* Button to navigate back to browse cards */}
                <button className="browse-more-btn" onClick={() => navigate("/pokemon-cards")}>
                    Browse More Cards
                </button>
            </div>

            {/* Conditional rendering based on whether user owns any cards */}
            {ownedCards.length === 0 ? (
                /* Empty State - Shown when user has no cards */
                <div className="empty-collection">
                    <div className="empty-icon">📦</div>
                    <h3>No cards in your collection yet</h3>
                    <p>Start building your Pokemon card collection today!</p>

                    {/* Call-to-action button to browse cards */}
                    <button className="start-btn" onClick={() => navigate("/pokemon-cards")}>
                        Start Collecting
                    </button>
                </div>
            ) : (
                /* Cards Display - Shown when user owns at least one card */
                <>
                    {/* Progress Notice - Shown when collection is not yet complete */}
                    {ownedCards.length < 3 && (
                        <div className="progress-notice">
                            {/* Calculate and display remaining slots */}
                            🎯 You can collect {3 - ownedCards.length} more card{3 - ownedCards.length !== 1 ? 's' : ''}!
                        </div>
                    )}

                    {/* Completion Notice - Shown when collection is full (3 cards) */}
                    {ownedCards.length === 3 && (
                        <div className="max-notice">
                            ✨ Congratulations! Your collection is complete with 3 cards!
                        </div>
                    )}

                    {/* Grid of Owned Cards */}
                    <div className="owned-cards-grid">
                        {/* Map over owned cards array to render each card */}
                        {ownedCards.map((card) => (
                            <div key={card.id} className="owned-card">
                                {/* Owned Badge - Visual indicator that card is owned */}
                                <div className="owned-badge">✓ OWNED</div>

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

                                    {/* Card Footer - Value and Rarity */}
                                    <div className="card-footer">
                                        {/* Card Value */}
                                        <div className="card-value">Value: ${card.price}</div>

                                        {/* Card Rarity - Color coded based on rarity */}
                                        <div
                                            className="card-rarity"
                                            style={{ color: getRarityColor(card.rarity) }}
                                        >
                                            {card.rarity}
                                        </div>
                                    </div>

                                    {/* Purchase Date - Formatted as locale date string */}
                                    <div className="purchased-date">
                                        Purchased: {new Date(card.purchased_at).toLocaleDateString()}
                                    </div>

                                    {/* Remove Button - Opens confirmation modal */}
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

            {/* Remove Confirmation Modal - Only shown when showRemoveModal is true */}
            {showRemoveModal && cardToRemove && (
                /* Modal Overlay - Dark background that closes modal on click */
                <div
                    className="modal-overlay"
                    // Close modal when clicking overlay (but not if removal in progress)
                    onClick={() => !isRemoving && setShowRemoveModal(false)}
                >
                    {/* Modal Content - Prevents click events from bubbling to overlay */}
                    <div className="modal modal-remove" onClick={(e) => e.stopPropagation()}>
                        <h3>Remove Card from Collection</h3>

                        {/* Card Preview - Shows which card will be removed */}
                        <div className="remove-card-preview">
                            {/* Card Image */}
                            <img src={cardToRemove.image_url} alt={cardToRemove.name} />

                            {/* Card Info */}
                            <div className="remove-card-info">
                                {/* Card Name */}
                                <strong>{cardToRemove.name}</strong>

                                {/* Pokemon Type */}
                                <span className="remove-card-type">{cardToRemove.pokemon_type}</span>

                                {/* Card Value */}
                                <span className="remove-card-value">Value: ${cardToRemove.price}</span>
                            </div>
                        </div>

                        {/* Warning Message - Confirms user's intent */}
                        <p className="remove-warning">
                            Are you sure you want to remove <strong>{cardToRemove.name}</strong> from your collection?
                        </p>

                        {/* Subtext - Informs user they can re-purchase */}
                        <p className="remove-subtext">
                            You can purchase this card again later from the marketplace.
                        </p>

                        {/* Modal Actions - Cancel and Confirm buttons */}
                        <div className="modal-actions">
                            {/* Cancel Button - Closes modal without removing */}
                            <button
                                className="btn-cancel"
                                onClick={() => setShowRemoveModal(false)}
                                // Disable while removal is in progress
                                disabled={isRemoving}
                            >
                                Keep Card
                            </button>

                            {/* Confirm Button - Executes card removal */}
                            <button
                                className="btn-danger"
                                onClick={handleConfirmRemove}
                                // Disable while removal is in progress
                                disabled={isRemoving}
                            >
                                {/* Show loading text during removal */}
                                {isRemoving ? "Removing..." : "Remove Card"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Export MyCollection component as default export
export default MyCollection;