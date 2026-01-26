# models.py
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)

    pokemon_cards = relationship(
        "PokemonCard",
        back_populates="owner",
        cascade="all, delete-orphan"
    )

class PokemonCard(Base):
    __tablename__ = "pokemon_cards"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    power = Column(Integer, nullable=False)

    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="pokemon_cards")
