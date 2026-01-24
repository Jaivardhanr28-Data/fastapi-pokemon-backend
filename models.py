# models.py
# ======================================================
# Database models for User and PokemonCard tables
# Defines a one-to-many relationship: User → PokemonCards
# ======================================================

from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import uuid

class User(Base):
    """User model representing an application user."""
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))  # Unique UUID primary key
    name = Column(String, nullable=False)                                     # User's full name
    email = Column(String, unique=True, nullable=False)                       # Unique user email
    password = Column(String, nullable=False)                                 # Hashed password

    # One user can have many Pokemon cards (one-to-many)
    pokemon_cards = relationship(
        "PokemonCard",
        back_populates="owner",
        cascade="all, delete-orphan"                                          # Cascade delete cards when user deleted
    )


class PokemonCard(Base):
    """PokemonCard model representing a collectible card owned by a user."""
    __tablename__ = "pokemon_cards"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))  # Unique UUID primary key
    name = Column(String, nullable=False)                                     # Pokemon name
    type = Column(String, nullable=False)                                     # Pokemon type (e.g., Fire, Water)
    power = Column(Integer, nullable=False)                                   # Pokemon power level

    user_id = Column(String, ForeignKey("users.id"), nullable=False)          # Foreign key to User

    # Each card belongs to one user
    owner = relationship("User", back_populates="pokemon_cards")

