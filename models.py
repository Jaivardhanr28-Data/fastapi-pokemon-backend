# models.py - Database models for the Pokemon Cards API

# Import SQLAlchemy column types and relationship utilities
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship  # For defining relationships between tables
# Import the Base class from our database configuration
from database import Base
# Import datetime for timestamp fields
from datetime import datetime
# Import uuid for generating unique IDs
import uuid

# ======================================================
# User Model - Represents users in the system
# ======================================================
class User(Base):
    """
    User model for storing user account information

    This table stores user credentials and admin status
    """
    # Define the table name in the database
    __tablename__ = "users"

    # Primary key - unique identifier for each user (UUID as string)
    # default=lambda: str(uuid.uuid4()) generates a new UUID for each new user
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # User's full name (required field)
    name = Column(String, nullable=False)

    # User's email address (must be unique, required)
    email = Column(String, unique=True, nullable=False)

    # User's hashed password (required, stored as hash for security)
    password = Column(String, nullable=False)

    # Boolean flag indicating if user has admin privileges (defaults to False)
    is_admin = Column(Boolean, default=False)

    # Relationships - Define how this model relates to other models
    # owned_cards: One-to-many relationship with UserCardOwnership
    # - back_populates="user": Creates bidirectional relationship
    # - cascade="all, delete-orphan": When user is deleted, delete all their card ownerships
    owned_cards = relationship("UserCardOwnership", back_populates="user", cascade="all, delete-orphan")

    # cart_items: One-to-many relationship with CartItem
    # - When user is deleted, delete all their cart items
    cart_items = relationship("CartItem", back_populates="user", cascade="all, delete-orphan")

# ======================================================
# PokemonCard Model - Represents Pokemon cards available in the system
# ======================================================
class PokemonCard(Base):
    """
    PokemonCard model for storing Pokemon card information

    This table stores all available Pokemon cards with their attributes
    """
    # Define the table name in the database
    __tablename__ = "pokemon_cards"

    # Primary key - unique identifier for each card (UUID as string)
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # Name of the Pokemon (e.g., "Pikachu", "Charizard")
    name = Column(String, nullable=False)

    # Pokemon's elemental type (e.g., "Fire", "Water", "Electric")
    pokemon_type = Column(String, nullable=False)

    # Hit Points - determines how much damage the Pokemon can take
    hp = Column(Integer, nullable=False)

    # Name of the Pokemon's attack move (e.g., "Thunderbolt", "Flamethrower")
    attack = Column(String, nullable=False)

    # Price of the card in dollars (stored as floating point number)
    price = Column(Float, nullable=False)

    # Rarity level of the card (e.g., "Common", "Rare", "Legendary")
    rarity = Column(String, nullable=False)

    # URL to the card's image
    image_url = Column(String, nullable=False)

    # Pokemon's number in the National Pokedex
    pokedex_number = Column(Integer, nullable=False)

    # Timestamp of when the card was added to the database
    # default=datetime.utcnow sets the timestamp automatically when card is created
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships - Define how this model relates to other models
    # ownerships: One-to-many relationship with UserCardOwnership
    # - Shows which users own this card
    ownerships = relationship("UserCardOwnership", back_populates="card")

# ======================================================
# UserCardOwnership Model - Junction table linking users to their owned cards
# ======================================================
class UserCardOwnership(Base):
    """
    UserCardOwnership model for tracking which cards each user owns

    This is a junction table that creates a many-to-many relationship
    between Users and PokemonCards, with an additional timestamp
    """
    # Define the table name in the database
    __tablename__ = "user_card_ownership"

    # Primary key - unique identifier for each ownership record
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # Foreign key linking to the User table
    # - References the id column in the users table
    # - nullable=False means every ownership must be linked to a user
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    # Foreign key linking to the PokemonCard table
    # - References the id column in the pokemon_cards table
    # - nullable=False means every ownership must be linked to a card
    card_id = Column(String, ForeignKey("pokemon_cards.id"), nullable=False)

    # Timestamp of when the card was purchased/acquired by the user
    purchased_at = Column(DateTime, default=datetime.utcnow)

    # Relationships - Define bidirectional relationships
    # user: Many-to-one relationship back to the User model
    user = relationship("User", back_populates="owned_cards")

    # card: Many-to-one relationship back to the PokemonCard model
    card = relationship("PokemonCard", back_populates="ownerships")

# ======================================================
# CartItem Model - Represents items in a user's shopping cart
# ======================================================
class CartItem(Base):
    """
    CartItem model for storing cards that users have added to their cart

    This table acts as a temporary holding area before cards are purchased
    """
    # Define the table name in the database
    __tablename__ = "cart_items"

    # Primary key - unique identifier for each cart item
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # Foreign key linking to the User who owns this cart item
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    # Foreign key linking to the PokemonCard that's in the cart
    card_id = Column(String, ForeignKey("pokemon_cards.id"), nullable=False)

    # Timestamp of when the card was added to the cart
    added_at = Column(DateTime, default=datetime.utcnow)

    # Relationships - Define bidirectional relationships
    # user: Many-to-one relationship back to the User model
    user = relationship("User", back_populates="cart_items")

    # card: Many-to-one relationship to the PokemonCard model
    # - Note: No back_populates here as PokemonCard doesn't need to know about cart items
    card = relationship("PokemonCard")
