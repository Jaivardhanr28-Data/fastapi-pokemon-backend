import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface CartItem {
    id: string;
    card_id: string;
    card_name: string;
    card_price: number;
    card_image: string;
}

function Cart() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        const token = localStorage.getItem("token");

        try {
            const res = await fetch("http://localhost:8000/api/cart", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await res.json();
            setCartItems(data);
        } catch (err) {
            console.error("Failed to fetch cart:", err);
        } finally {
            setLoading(false);
        }
    };

    const removeFromCart = async (cartItemId: string, cardName: string) => {
        if (!confirm(`Remove ${cardName} from cart?`)) return;

        const token = localStorage.getItem("token");

        try {
            const res = await fetch(`http://localhost:8000/api/cart/${cartItemId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (res.ok) {
                alert("✅ Removed from cart");
                fetchCart();
            }
        } catch (err) {
            alert("Failed to remove item from cart");
        }
    };

    const clearCart = async () => {
        if (!confirm("Are you sure you want to clear your cart?")) return;

        const token = localStorage.getItem("token");

        try {
            const res = await fetch("http://localhost:8000/api/cart/clear", {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (res.ok) {
                alert("✅ Cart cleared");
                setCartItems([]);
            }
        } catch (err) {
            alert("Failed to clear cart");
        }
    };

    const purchaseCart = async () => {
        setPurchasing(true);

        const token = localStorage.getItem("token");

        try {
            const res = await fetch("http://localhost:8000/api/cart/purchase", {
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

            const data = await res.json();
            alert(`🎉 ${data.message}\n\nCards purchased: ${data.cards_purchased.join(", ")}\nTotal: $${data.total_price.toFixed(2)}`);

            setCartItems([]);
            navigate("/my-collection");
        } catch (err) {
            alert("Failed to complete purchase");
        } finally {
            setPurchasing(false);
        }
    };

    const totalPrice = cartItems.reduce((sum, item) => sum + item.card_price, 0);

    if (loading) {
        return <div className="loading">Loading cart...</div>;
    }

    return (
        <div className="cart-page">
            <div className="cart-header">
                <h2>Shopping Cart</h2>

                <button className="back-btn" onClick={() => navigate("/pokemon-cards")}>
                    ← Back to Cards
                </button>
            </div>

            {cartItems.length === 0 ? (
                <div className="empty-cart">
                    <div className="empty-icon">🛒</div>

                    <h3>Your cart is empty</h3>

                    <p>Add some Pokemon cards to get started!</p>

                    <button className="browse-btn" onClick={() => navigate("/pokemon-cards")}>
                        Browse Cards
                    </button>
                </div>
            ) : (
                <>
                    <div className="cart-items">
                        {cartItems.map((item) => (
                            <div key={item.id} className="cart-item">
                                <img src={item.card_image} alt={item.card_name} className="cart-item-image" />

                                <div className="cart-item-details">
                                    <h3>{item.card_name}</h3>

                                    <div className="cart-item-price">${item.card_price.toFixed(2)}</div>
                                </div>

                                <button
                                    className="remove-btn"
                                    onClick={() => removeFromCart(item.id, item.card_name)}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="cart-summary">
                        <div className="summary-row">
                            <span>Items in cart:</span>

                            <strong>{cartItems.length}</strong>
                        </div>

                        <div className="summary-row total">
                            <span>Total:</span>

                            <strong>${totalPrice.toFixed(2)}</strong>
                        </div>

                        <div className="cart-actions">
                            <button
                                className="clear-btn"
                                onClick={clearCart}
                                disabled={purchasing}
                            >
                                Clear Cart
                            </button>

                            <button
                                className="purchase-btn"
                                onClick={purchaseCart}
                                disabled={purchasing}
                            >
                                {purchasing ? "Processing..." : "Purchase Now"}
                            </button>
                        </div>

                        <p className="cart-note">
                            💳 Note: This is a demo. No actual payment will be processed.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}

export default Cart;
