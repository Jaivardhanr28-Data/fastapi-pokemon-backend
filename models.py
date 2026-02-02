from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)

    owned_cards = relationship("UserCardOwnership", back_populates="user", cascade="all, delete-orphan")
    cart_items = relationship("CartItem", back_populates="user", cascade="all, delete-orphan")

class PokemonCard(Base):
    __tablename__ = "pokemon_cards"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    pokemon_type = Column(String, nullable=False)
    hp = Column(Integer, nullable=False)
    attack = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    rarity = Column(String, nullable=False)
    image_url = Column(String, nullable=False)
    pokedex_number = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    ownerships = relationship("UserCardOwnership", back_populates="card")

class UserCardOwnership(Base):
    __tablename__ = "user_card_ownership"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    card_id = Column(String, ForeignKey("pokemon_cards.id"), nullable=False)
    purchased_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="owned_cards")
    card = relationship("PokemonCard", back_populates="ownerships")

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    card_id = Column(String, ForeignKey("pokemon_cards.id"), nullable=False)
    added_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="cart_items")
    card = relationship("PokemonCard")
