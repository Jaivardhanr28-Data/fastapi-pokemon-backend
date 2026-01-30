"""
main.py - FastAPI Pokemon Card Management System

This is the main application file for a Pokemon card marketplace API. It provides:
- User authentication and authorization (JWT-based)
- Pokemon card browsing and collection management
- Shopping cart functionality with purchase limits
- Admin user management capabilities

The API enforces a 3-card limit per user and includes protected routes that require
authentication tokens. Admin users have additional privileges for managing other users.
"""

# ======================================================
# IMPORTS
# ======================================================

# FastAPI core imports for building the API
from fastapi import FastAPI, HTTPException, status, Depends  # FastAPI framework, exception handling, HTTP status codes, and dependency injection
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials  # HTTP Bearer token authentication scheme for JWT tokens
from sqlalchemy.orm import Session  # SQLAlchemy Session type for database operations
from pydantic import BaseModel  # Pydantic base class for request/response validation schemas
from typing import Generator, List  # Python typing hints for better code documentation
from fastapi.middleware.cors import CORSMiddleware  # CORS middleware to allow frontend requests from different origins

# Local module imports
from database import SessionLocal  # Database session factory for creating DB connections
from models import User as UserModel, PokemonCard, UserCardOwnership, CartItem  # SQLAlchemy database models
from security import hash_password, verify_password, create_access_token, verify_access_token  # Password hashing and JWT token utilities

# ======================================================
# APPLICATION SETUP
# ======================================================

# Create the FastAPI application instance with metadata
app = FastAPI(
    title="Pokemon Cards API",  # API title shown in documentation
    version="2.0",  # Current API version
    description="Pokemon card management with cart system"  # Brief description for API docs
)

# Configure CORS (Cross-Origin Resource Sharing) middleware
# This allows the frontend running on localhost:5173 or 5174 to make requests to this API
app.add_middleware(
    CORSMiddleware,  # Add CORS middleware to the application
    allow_origins=["http://localhost:5173", "http://localhost:5174"],  # Allow requests from these frontend dev servers
    allow_credentials=True,  # Allow cookies and authorization headers to be sent
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers in requests
)

# Initialize HTTP Bearer token authentication scheme
# This will be used to extract JWT tokens from the Authorization header
security = HTTPBearer()

# ======================================================
# DATABASE DEPENDENCY
# ======================================================

def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency for dependency injection.

    Creates a new database session for each request and ensures it's properly closed
    after the request is complete, even if an error occurs.

    Yields:
        Session: SQLAlchemy database session
    """
    db = SessionLocal()  # Create a new database session
    try:
        yield db  # Provide the session to the route handler
    finally:
        db.close()  # Always close the session when done (cleanup)

# ======================================================
# AUTHENTICATION DEPENDENCIES
# ======================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),  # Extract Bearer token from Authorization header
    db: Session = Depends(get_db)  # Inject database session
):
    """
    Dependency that validates JWT token and returns the current authenticated user.

    Extracts the JWT token from the Authorization header, verifies it, and retrieves
    the corresponding user from the database.

    Args:
        credentials: HTTP Bearer token credentials from the request header
        db: Database session (injected by FastAPI)

    Returns:
        UserModel: The authenticated user object

    Raises:
        HTTPException: 401 if token is invalid/expired or user not found
    """
    token = credentials.credentials  # Extract the actual token string from credentials
    payload = verify_access_token(token)  # Decode and verify the JWT token

    # Check if token payload is valid and contains user ID
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Query database to find user by ID from token payload
    user = db.query(UserModel).filter(UserModel.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user  # Return the authenticated user object

def admin_required(current_user: UserModel = Depends(get_current_user)):
    """
    Dependency that ensures the current user has admin privileges.

    This dependency builds on get_current_user and adds an additional check
    for admin status. Use this on routes that require admin access.

    Args:
        current_user: The authenticated user (injected by get_current_user dependency)

    Returns:
        UserModel: The authenticated admin user object

    Raises:
        HTTPException: 403 if user is not an admin
    """
    # Check if the current user has admin privileges
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user  # Return the admin user object

# ======================================================
# PYDANTIC SCHEMAS (Request/Response Models)
# ======================================================

class UserCreate(BaseModel):
    """
    Schema for user registration request.

    Used when a new user signs up for an account.
    All fields are required.
    """
    name: str  # User's full name
    email: str  # User's email address (must be unique)
    password: str  # Plain text password (will be hashed before storing)

class LoginRequest(BaseModel):
    """
    Schema for user login request.

    Used when an existing user attempts to authenticate.
    """
    email: str  # User's email address
    password: str  # User's password for verification

class UserUpdate(BaseModel):
    """
    Schema for updating user information (admin only).

    All fields are optional, allowing partial updates.
    Only provided fields will be updated.
    """
    name: str | None = None  # Optional: New name for the user
    email: str | None = None  # Optional: New email address
    password: str | None = None  # Optional: New password (will be hashed)

class UserResponse(BaseModel):
    """
    Schema for user data in API responses.

    Returns safe user information without sensitive data like passwords.
    """
    id: str  # Unique user identifier
    name: str  # User's name
    email: str  # User's email address
    cards_owned: int = 0  # Number of Pokemon cards owned by this user

    class Config:
        from_attributes = True  # Allow creating this model from SQLAlchemy ORM objects

class PokemonCardResponse(BaseModel):
    """
    Schema for Pokemon card data in API responses.

    Includes all card information plus ownership status for the current user.
    """
    id: str  # Unique card identifier
    name: str  # Pokemon name (e.g., "Pikachu")
    pokemon_type: str  # Pokemon type (e.g., "Electric", "Fire")
    hp: int  # Hit points (health) of the Pokemon
    attack: str  # Attack name and description
    price: float  # Card price in currency units
    rarity: str  # Card rarity (e.g., "Common", "Rare", "Legendary")
    image_url: str  # URL to the card's image
    pokedex_number: int  # National Pokedex number
    is_owned: bool = False  # Whether the current user owns this card

    class Config:
        from_attributes = True  # Allow creating this model from SQLAlchemy ORM objects

class CartItemResponse(BaseModel):
    """
    Schema for shopping cart item in API responses.

    Combines cart item data with card information for easy frontend display.
    """
    id: str  # Unique cart item identifier
    card_id: str  # ID of the Pokemon card
    card_name: str  # Name of the Pokemon for display
    card_price: float  # Price of the card
    card_image: str  # URL to card image
    added_at: str  # ISO timestamp when item was added to cart

    class Config:
        from_attributes = True  # Allow creating this model from SQLAlchemy ORM objects

# ======================================================
# HEALTH CHECK ENDPOINT
# ======================================================

@app.get("/")
def health_check():
    """
    Health check endpoint to verify API is running.

    This is a simple endpoint that doesn't require authentication.
    Useful for monitoring and testing if the server is up.

    Returns:
        dict: Simple status message
    """
    return {"message": "Pokemon Cards API is running"}

# ======================================================
# USER AUTHENTICATION ROUTES
# ======================================================

@app.post("/user", status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user account.

    Creates a new user with hashed password. Validates that email is unique.

    Args:
        user: UserCreate schema containing name, email, and password
        db: Database session (injected)

    Returns:
        dict: Success message with new user ID

    Raises:
        HTTPException: 400 if email is already registered
    """
    # Check if a user with this email already exists
    if db.query(UserModel).filter(UserModel.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user instance with hashed password
    new_user = UserModel(
        name=user.name,  # Store user's name
        email=user.email,  # Store user's email
        password=hash_password(user.password)  # Hash password before storing (security)
    )

    db.add(new_user)  # Add new user to database session
    db.commit()  # Commit transaction to save user to database
    db.refresh(new_user)  # Refresh instance to get generated ID and defaults
    return {"message": "User created", "user_id": new_user.id}  # Return success response

@app.post("/login")
def login_user(login: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user and generate access token.

    Validates user credentials and returns a JWT token for authenticated requests.

    Args:
        login: LoginRequest schema containing email and password
        db: Database session (injected)

    Returns:
        dict: Access token, token type, and user information

    Raises:
        HTTPException: 401 if credentials are invalid
    """
    # Query database to find user by email
    user = db.query(UserModel).filter(UserModel.email == login.email).first()

    # Verify user exists and password matches the hashed password in database
    if not user or not verify_password(login.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Create JWT access token with user ID as subject
    token = create_access_token({"sub": user.id})

    # Return token and user information
    return {
        "access_token": token,  # JWT token for authentication
        "token_type": "bearer",  # Token type (for Authorization header)
        "user": {
            "id": user.id,  # User's unique identifier
            "name": user.name,  # User's name
            "email": user.email,  # User's email
            "is_admin": user.is_admin  # Whether user has admin privileges
        }
    }

@app.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    """
    Get list of all users with their card ownership counts.

    Public endpoint that returns basic user information and how many cards each user owns.
    Does not require authentication (could be changed if needed).

    Args:
        db: Database session (injected)

    Returns:
        list: List of user objects with id, name, email, and cards_owned count
    """
    # Query all users from database
    users = db.query(UserModel).all()
    result = []  # Initialize empty result list

    # Iterate through each user to build response with card counts
    for user in users:
        # Count how many cards this user owns
        cards_count = db.query(UserCardOwnership).filter(UserCardOwnership.user_id == user.id).count()
        # Append user data with card count to result
        result.append({
            "id": user.id,  # User's unique identifier
            "name": user.name,  # User's name
            "email": user.email,  # User's email address
            "cards_owned": cards_count  # Total number of cards owned
        })
    return result  # Return list of all users

# ======================================================
# ADMIN USER MANAGEMENT ROUTES
# ======================================================

@app.put("/admin/users/{user_id}")
def admin_update_user(
    user_id: str,  # User ID from URL path parameter
    data: UserUpdate,  # Update data from request body
    db: Session = Depends(get_db),  # Database session (injected)
    _: UserModel = Depends(admin_required)  # Verify admin access (underscore means we don't use this value)
):
    """
    Admin-only: Update any user's information.

    Allows admins to update name, email, or password for any user.
    Only provided fields will be updated (partial update).

    Args:
        user_id: ID of the user to update (from URL path)
        data: UserUpdate schema with optional name, email, password
        db: Database session (injected)
        _: Admin user verification (injected, unused in function body)

    Returns:
        dict: Success message

    Raises:
        HTTPException: 403 if not admin, 404 if user not found
    """
    # Find the user to update by ID
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update only the fields that were provided (partial update)
    if data.name:
        user.name = data.name  # Update user's name if provided
    if data.email:
        user.email = data.email  # Update user's email if provided
    if data.password:
        user.password = hash_password(data.password)  # Hash and update password if provided

    db.commit()  # Save changes to database
    return {"message": "User updated successfully"}

@app.delete("/admin/users/{user_id}")
def admin_delete_user(
    user_id: str,  # User ID from URL path parameter
    db: Session = Depends(get_db),  # Database session (injected)
    _: UserModel = Depends(admin_required)  # Verify admin access (underscore means we don't use this value)
):
    """
    Admin-only: Delete a user account.

    Permanently removes a user from the database. This will also cascade delete
    their cart items and card ownerships (depending on DB configuration).

    Args:
        user_id: ID of the user to delete (from URL path)
        db: Database session (injected)
        _: Admin user verification (injected, unused in function body)

    Returns:
        dict: Success message

    Raises:
        HTTPException: 403 if not admin, 404 if user not found
    """
    # Find the user to delete by ID
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)  # Delete the user from database
    db.commit()  # Commit the deletion
    return {"message": "User deleted successfully"}

# ======================================================
# ADMIN VIEW USER'S CARDS
# ======================================================

@app.get("/admin/users/{user_id}/cards")
def admin_get_user_cards(
    user_id: str,  # User ID from URL path parameter
    db: Session = Depends(get_db),  # Database session (injected)
    _: UserModel = Depends(admin_required)  # Verify admin access (underscore means we don't use this value)
):
    """
    Admin-only: View a specific user's card collection.

    Allows admins to see what cards any user owns, including purchase timestamps.

    Args:
        user_id: ID of the user whose cards to view (from URL path)
        db: Database session (injected)
        _: Admin user verification (injected, unused in function body)

    Returns:
        list: List of card objects owned by the user with purchase dates

    Raises:
        HTTPException: 403 if not admin, 404 if user not found
    """
    # Check if target user exists
    target_user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get all ownership records for this user
    ownerships = db.query(UserCardOwnership).filter(
        UserCardOwnership.user_id == user_id
    ).all()

    result = []  # Initialize empty result list

    # Build response with card details and purchase timestamps
    for ownership in ownerships:
        # Get the full card details for each ownership record
        card = db.query(PokemonCard).filter(PokemonCard.id == ownership.card_id).first()
        if card:
            # Append card data with purchase timestamp
            result.append({
                "id": card.id,  # Card's unique identifier
                "name": card.name,  # Pokemon name
                "pokemon_type": card.pokemon_type,  # Pokemon type
                "hp": card.hp,  # Hit points
                "attack": card.attack,  # Attack description
                "price": card.price,  # Card price
                "rarity": card.rarity,  # Card rarity level
                "image_url": card.image_url,  # Image URL
                "purchased_at": ownership.purchased_at.isoformat()  # When user acquired this card (ISO format)
            })

    return result  # Return list of owned cards

# ======================================================
# POKEMON CARDS ROUTES
# ======================================================

@app.get("/api/cards")
def get_all_cards(
    current_user: UserModel = Depends(get_current_user),  # Verify user is authenticated
    db: Session = Depends(get_db)  # Database session (injected)
):
    """
    Get all available Pokemon cards with ownership status for current user.

    Returns the complete catalog of Pokemon cards, with each card marked
    as owned or not owned by the authenticated user.

    Args:
        current_user: Authenticated user (injected)
        db: Database session (injected)

    Returns:
        list: List of all Pokemon cards with is_owned flag for current user

    Raises:
        HTTPException: 401 if user is not authenticated
    """
    # Query all Pokemon cards from database
    cards = db.query(PokemonCard).all()

    # Get list of card IDs that the current user owns
    # Using list comprehension for efficiency
    owned_card_ids = [
        ownership.card_id  # Extract just the card_id
        for ownership in db.query(UserCardOwnership).filter(
            UserCardOwnership.user_id == current_user.id  # Filter by current user
        ).all()
    ]

    result = []  # Initialize empty result list

    # Build response with ownership status for each card
    for card in cards:
        result.append({
            "id": card.id,  # Card's unique identifier
            "name": card.name,  # Pokemon name
            "pokemon_type": card.pokemon_type,  # Pokemon type (Electric, Fire, etc.)
            "hp": card.hp,  # Hit points
            "attack": card.attack,  # Attack name and description
            "price": card.price,  # Card price
            "rarity": card.rarity,  # Rarity level
            "image_url": card.image_url,  # URL to card image
            "pokedex_number": card.pokedex_number,  # National Pokedex number
            "is_owned": card.id in owned_card_ids  # True if current user owns this card
        })

    return result  # Return complete card catalog

@app.get("/api/cards/owned")
def get_owned_cards(
    current_user: UserModel = Depends(get_current_user),  # Verify user is authenticated
    db: Session = Depends(get_db)  # Database session (injected)
):
    """
    Get current user's owned cards (My Collection page).

    Returns only the cards that the authenticated user owns, including
    the timestamp when each card was purchased.

    Args:
        current_user: Authenticated user (injected)
        db: Database session (injected)

    Returns:
        list: List of cards owned by current user with purchase timestamps

    Raises:
        HTTPException: 401 if user is not authenticated
    """
    # Query all ownership records for current user
    ownerships = db.query(UserCardOwnership).filter(
        UserCardOwnership.user_id == current_user.id
    ).all()

    result = []  # Initialize empty result list

    # Build response with card details and purchase information
    for ownership in ownerships:
        # Get full card details for each owned card
        card = db.query(PokemonCard).filter(PokemonCard.id == ownership.card_id).first()
        if card:
            # Append card data with purchase timestamp
            result.append({
                "id": card.id,  # Card's unique identifier
                "name": card.name,  # Pokemon name
                "pokemon_type": card.pokemon_type,  # Pokemon type
                "hp": card.hp,  # Hit points
                "attack": card.attack,  # Attack description
                "price": card.price,  # Card price (what they paid)
                "rarity": card.rarity,  # Rarity level
                "image_url": card.image_url,  # URL to card image
                "purchased_at": ownership.purchased_at.isoformat()  # When user purchased (ISO format)
            })

    return result  # Return user's collection

# ======================================================
# REMOVE CARD FROM COLLECTION
# ======================================================

@app.delete("/api/cards/owned/{card_id}")
def remove_card_from_collection(
    card_id: str,  # Card ID from URL path parameter
    current_user: UserModel = Depends(get_current_user),  # Verify user is authenticated
    db: Session = Depends(get_db)  # Database session (injected)
):
    """
    Remove a card from the current user's collection.

    Allows users to remove cards they own, making space for new purchases
    (useful with the 3-card limit).

    Args:
        card_id: ID of the card to remove (from URL path)
        current_user: Authenticated user (injected)
        db: Database session (injected)

    Returns:
        dict: Success message with card name

    Raises:
        HTTPException: 401 if not authenticated, 404 if card not in collection
    """
    # Find the ownership record for this card and current user
    ownership = db.query(UserCardOwnership).filter(
        UserCardOwnership.card_id == card_id,  # Match the specific card
        UserCardOwnership.user_id == current_user.id  # Ensure it belongs to current user
    ).first()

    # If ownership doesn't exist, user doesn't own this card
    if not ownership:
        raise HTTPException(
            status_code=404,
            detail="Card not found in your collection"
        )

    # Get card name for a friendly response message
    card = db.query(PokemonCard).filter(PokemonCard.id == card_id).first()
    card_name = card.name if card else "Card"  # Fallback to "Card" if not found

    # Delete the ownership record to remove card from collection
    db.delete(ownership)
    db.commit()  # Commit the deletion

    return {"message": f"{card_name} removed from collection successfully"}

# ======================================================
# SHOPPING CART ROUTES
# ======================================================

@app.get("/api/cart")
def get_cart(
    current_user: UserModel = Depends(get_current_user),  # Verify user is authenticated
    db: Session = Depends(get_db)  # Database session (injected)
):
    """
    Get current user's shopping cart items.

    Returns all items currently in the user's cart with card details
    and timestamps for when each item was added.

    Args:
        current_user: Authenticated user (injected)
        db: Database session (injected)

    Returns:
        list: List of cart items with card details

    Raises:
        HTTPException: 401 if user is not authenticated
    """
    # Query all cart items for current user
    cart_items = db.query(CartItem).filter(CartItem.user_id == current_user.id).all()

    result = []  # Initialize empty result list

    # Build response with cart item and card details
    for item in cart_items:
        # Get the full card details for each cart item
        card = db.query(PokemonCard).filter(PokemonCard.id == item.card_id).first()
        if card:
            # Append combined cart item and card data
            result.append({
                "id": item.id,  # Cart item ID (for removal)
                "card_id": card.id,  # Card's unique identifier
                "card_name": card.name,  # Pokemon name for display
                "card_price": card.price,  # Price of the card
                "card_image": card.image_url,  # Image URL for display
                "added_at": item.added_at.isoformat()  # When item was added to cart (ISO format)
            })

    return result  # Return cart contents

@app.post("/api/cart/add/{card_id}")
def add_to_cart(
    card_id: str,  # Card ID from URL path parameter
    current_user: UserModel = Depends(get_current_user),  # Verify user is authenticated
    db: Session = Depends(get_db)  # Database session (injected)
):
    """
    Add a Pokemon card to the shopping cart.

    Validates multiple business rules before adding:
    - Card must exist
    - User must not already own the card
    - User must not exceed 3-card limit (owned + cart)
    - Card must not already be in cart

    Args:
        card_id: ID of the card to add (from URL path)
        current_user: Authenticated user (injected)
        db: Database session (injected)

    Returns:
        dict: Success message with card name

    Raises:
        HTTPException: 401 if not authenticated, 404 if card not found,
                      400 if validation fails (already owned, limit exceeded, duplicate)
    """
    # Check if the card exists in the database
    card = db.query(PokemonCard).filter(PokemonCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    # Check if user already owns this card (can't buy duplicates)
    ownership = db.query(UserCardOwnership).filter(
        UserCardOwnership.user_id == current_user.id,  # Current user
        UserCardOwnership.card_id == card_id  # This specific card
    ).first()
    if ownership:
        raise HTTPException(status_code=400, detail="You already own this card")

    # Check if user would exceed the 3-card limit
    # Count cards already owned
    owned_count = db.query(UserCardOwnership).filter(
        UserCardOwnership.user_id == current_user.id
    ).count()
    # Count cards currently in cart
    cart_count = db.query(CartItem).filter(
        CartItem.user_id == current_user.id
    ).count()

    # Enforce 3-card limit (owned + in cart must be < 3)
    if owned_count + cart_count >= 3:
        raise HTTPException(status_code=400, detail="Maximum 3 cards allowed")

    # Check if this card is already in the cart (prevent duplicates in cart)
    existing_cart_item = db.query(CartItem).filter(
        CartItem.user_id == current_user.id,  # Current user's cart
        CartItem.card_id == card_id  # This specific card
    ).first()
    if existing_cart_item:
        raise HTTPException(status_code=400, detail="Card already in cart")

    # All validations passed - create cart item
    cart_item = CartItem(
        user_id=current_user.id,  # Associate with current user
        card_id=card_id  # Reference to the card
    )
    db.add(cart_item)  # Add to database session
    db.commit()  # Commit transaction to save cart item

    return {"message": "Card added to cart", "card_name": card.name}

@app.delete("/api/cart/remove/{cart_item_id}")
def remove_from_cart(
    cart_item_id: str,  # Cart item ID from URL path parameter
    current_user: UserModel = Depends(get_current_user),  # Verify user is authenticated
    db: Session = Depends(get_db)  # Database session (injected)
):
    """
    Remove a specific item from the shopping cart.

    Finds and deletes a cart item by its ID, ensuring the item belongs
    to the authenticated user.

    Args:
        cart_item_id: ID of the cart item to remove (from URL path)
        current_user: Authenticated user (injected)
        db: Database session (injected)

    Returns:
        dict: Success message

    Raises:
        HTTPException: 401 if not authenticated, 404 if cart item not found
    """
    # Find the cart item by ID, ensuring it belongs to current user
    cart_item = db.query(CartItem).filter(
        CartItem.id == cart_item_id,  # Match the specific cart item
        CartItem.user_id == current_user.id  # Ensure it belongs to current user
    ).first()

    # If cart item doesn't exist or doesn't belong to user
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    db.delete(cart_item)  # Delete the cart item
    db.commit()  # Commit the deletion

    return {"message": "Card removed from cart"}

@app.post("/api/cart/purchase")
def purchase_cart(
    current_user: UserModel = Depends(get_current_user),  # Verify user is authenticated
    db: Session = Depends(get_db)  # Database session (injected)
):
    """
    Purchase all items in the shopping cart.

    Converts all cart items to card ownerships (completing the purchase).
    Validates that the purchase won't exceed the 3-card limit.
    Calculates total price and returns purchase summary.

    Args:
        current_user: Authenticated user (injected)
        db: Database session (injected)

    Returns:
        dict: Purchase summary with cards purchased, total price, and count

    Raises:
        HTTPException: 401 if not authenticated, 400 if cart is empty or would exceed limit
    """
    # Get all items currently in user's cart
    cart_items = db.query(CartItem).filter(CartItem.user_id == current_user.id).all()

    # Can't purchase if cart is empty
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Check total cards after purchase wouldn't exceed 3-card limit
    owned_count = db.query(UserCardOwnership).filter(
        UserCardOwnership.user_id == current_user.id
    ).count()

    # Validate purchase won't exceed limit
    if owned_count + len(cart_items) > 3:
        raise HTTPException(status_code=400, detail="Purchase would exceed 3 card limit")

    # Process the purchase: move cart items to ownership
    total_price = 0  # Track total cost of purchase
    purchased_cards = []  # Track names of purchased cards

    # Process each cart item
    for cart_item in cart_items:
        # Get the full card details
        card = db.query(PokemonCard).filter(PokemonCard.id == cart_item.card_id).first()
        if card:
            # Create ownership record (user now owns this card)
            ownership = UserCardOwnership(
                user_id=current_user.id,  # Associate with current user
                card_id=cart_item.card_id  # Reference to the card
            )
            db.add(ownership)  # Add ownership to session
            total_price += card.price  # Add card price to total
            purchased_cards.append(card.name)  # Add card name to list

            # Remove the item from cart (purchase complete)
            db.delete(cart_item)

    db.commit()  # Commit all changes (ownerships created, cart cleared)

    # Return purchase summary
    return {
        "message": "Purchase successful!",  # Success message
        "cards_purchased": purchased_cards,  # List of card names purchased
        "total_price": total_price,  # Total amount spent
        "cards_count": len(purchased_cards)  # Number of cards purchased
    }

@app.delete("/api/cart/clear")
def clear_cart(
    current_user: UserModel = Depends(get_current_user),  # Verify user is authenticated
    db: Session = Depends(get_db)  # Database session (injected)
):
    """
    Clear all items from the shopping cart.

    Removes all cart items for the current user without purchasing them.
    Useful for starting over or canceling a cart.

    Args:
        current_user: Authenticated user (injected)
        db: Database session (injected)

    Returns:
        dict: Success message

    Raises:
        HTTPException: 401 if user is not authenticated
    """
    # Delete all cart items belonging to current user
    # Using a bulk delete for efficiency
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()
    db.commit()  # Commit the deletion

    return {"message": "Cart cleared"}