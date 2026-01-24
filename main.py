# main.py
# ======================================================
# FastAPI application implementing user management and
# PokemonCard CRUD operations protected by JWT authentication
# ======================================================

from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Generator, List

from database import SessionLocal
from models import User as UserModel, PokemonCard
from security import (
    hash_password,
    verify_password,
    create_access_token,
    verify_access_token
)

# ======================================================
# App Configuration
# ======================================================

app = FastAPI(
    title="Jaivardhan's User Management API",
    version="1.0",
    description="User management with JWT authentication and Pokemon Cards"
)

security = HTTPBearer()  # Security scheme for Bearer token

# ======================================================
# Database Dependency
# ======================================================

def get_db() -> Generator[Session, None, None]:
    """Provide a database session to each request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ======================================================
# Authentication Dependency
# ======================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Validate JWT token and retrieve the current authenticated user."""
    token = credentials.credentials
    user_id = verify_access_token(token)

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user

# ======================================================
# User Schemas
# ======================================================

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None

class ChangePasswordRequest(BaseModel):
    new_password: str

# ======================================================
# Pokemon Card Schemas
# ======================================================

class PokemonCardCreate(BaseModel):
    name: str
    type: str
    power: int

class PokemonCardUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    power: int | None = None

class PokemonCardResponse(BaseModel):
    id: str
    name: str
    type: str
    power: int
    user_id: str

    class Config:
        from_attributes = True  # Allow ORM model conversion

class SelectMultipleCardsRequest(BaseModel):
    card_ids: List[str]

# ======================================================
# User Routes
# ======================================================

@app.get("/")
def health_check():
    """API health check endpoint."""
    return {"message": "API is running"}

# ---------------- REGISTER ----------------

@app.post("/user", status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account."""
    if db.query(UserModel).filter(UserModel.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = UserModel(
        name=user.name,
        email=user.email,
        password=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created", "user_id": new_user.id}

# ---------------- LOGIN ----------------

@app.post("/login")
def login_user(login: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return JWT access token."""
    user = db.query(UserModel).filter(UserModel.email == login.email).first()

    if not user or not verify_password(login.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user.id})
    return {"access_token": token, "token_type": "bearer"}

# ---------------- PROFILE ----------------

@app.get("/profile")
def get_profile(current_user: UserModel = Depends(get_current_user)):
    """Retrieve profile of the currently authenticated user."""
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email
    }

# ---------------- UPDATE PROFILE ----------------

@app.put("/profile")
def update_profile(
    updated: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    if updated.name is not None:
        current_user.name = updated.name
    if updated.email is not None:
        current_user.email = updated.email
    db.commit()
    db.refresh(current_user)
    return {"message": "Profile updated"}


# ---------------- CHANGE PASSWORD ----------------

@app.put("/change-password")
def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Change the password for the authenticated user."""
    current_user.password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}

#----------------DELETE THE USER ------------------

@app.delete("/user")
def delete_user(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    db.delete(current_user)
    db.commit()
    return {"message": "User and their Pokémon cards deleted successfully"}


# ======================================================
# Pokemon Card Routes
# ======================================================

@app.post("/pokemon-cards", status_code=status.HTTP_201_CREATED)
def create_pokemon_card(
    card: PokemonCardCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Create a new Pokemon card for the authenticated user."""
    new_card = PokemonCard(
        name=card.name,
        type=card.type,
        power=card.power,
        user_id=current_user.id
    )
    db.add(new_card)
    db.commit()
    db.refresh(new_card)
    return {"message": "Pokemon card created successfully", "card": new_card}

@app.get("/pokemon-cards", response_model=List[PokemonCardResponse])
def get_all_pokemon_cards(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Retrieve all Pokemon cards owned by the current user."""
    cards = db.query(PokemonCard).filter(PokemonCard.user_id == current_user.id).all()
    return cards

@app.get("/pokemon-cards/{card_id}")
def get_pokemon_card(
    card_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Get a specific Pokemon card by ID for the current user."""
    card = db.query(PokemonCard).filter(
        PokemonCard.id == card_id,
        PokemonCard.user_id == current_user.id
    ).first()
    if not card:
        raise HTTPException(status_code=404, detail="Pokemon card not found")
    return card

@app.put("/pokemon-cards/{card_id}")
def update_pokemon_card(
    card_id: str,
    card_update: PokemonCardUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    # Find the card owned by current user
    card = db.query(PokemonCard).filter(
        PokemonCard.id == card_id,
        PokemonCard.user_id == current_user.id
    ).first()

    if not card:
        raise HTTPException(status_code=404, detail="Pokemon card not found")

    # Update only the provided fields
    if card_update.name is not None:
        card.name = card_update.name
    if card_update.type is not None:
        card.type = card_update.type
    if card_update.power is not None:
        card.power = card_update.power

    db.commit()
    db.refresh(card)
    return {"message": "Pokemon card updated successfully", "card": card}


@app.delete("/pokemon-cards/{card_id}")
def delete_pokemon_card(
    card_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Delete a Pokemon card owned by the current user."""
    card = db.query(PokemonCard).filter(
        PokemonCard.id == card_id,
        PokemonCard.user_id == current_user.id
    ).first()
    if not card:
        raise HTTPException(status_code=404, detail="Pokemon card not found")

    db.delete(card)
    db.commit()
    return {"message": "Pokemon card deleted successfully"}

@app.post("/pokemon-cards/select-multiple")
def select_multiple_cards(
    request: SelectMultipleCardsRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Select multiple cards by IDs and return details + total power."""
    if not request.card_ids:
        raise HTTPException(status_code=400, detail="No card IDs provided")

    selected_cards = db.query(PokemonCard).filter(
        PokemonCard.id.in_(request.card_ids),
        PokemonCard.user_id == current_user.id
    ).all()

    if not selected_cards:
        raise HTTPException(status_code=404, detail="No matching cards found")

    found_ids = {card.id for card in selected_cards}
    invalid_ids = set(request.card_ids) - found_ids

    result = {
        "message": f"Selected {len(selected_cards)} card(s)",
        "selected_cards": selected_cards,
        "total_power": sum(card.power for card in selected_cards)
    }

    if invalid_ids:
        result["warning"] = f"{len(invalid_ids)} invalid or unauthorized card ID(s)"
        result["invalid_ids"] = list(invalid_ids)

    return result
