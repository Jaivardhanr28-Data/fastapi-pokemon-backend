from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Generator, List
from fastapi.middleware.cors import CORSMiddleware

from database import SessionLocal
from models import User as UserModel, PokemonCard, UserCardOwnership, CartItem
from security import hash_password, verify_password, create_access_token, verify_access_token

app = FastAPI(
    title="Pokemon Cards API",
    version="2.0",
    description="Pokemon card management with cart system"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    payload = verify_access_token(token)

    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(UserModel).filter(UserModel.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user

def admin_required(current_user: UserModel = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

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
    password: str | None = None

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    cards_owned: int = 0

    class Config:
        from_attributes = True

class PokemonCardResponse(BaseModel):
    id: str
    name: str
    pokemon_type: str
    hp: int
    attack: str
    price: float
    rarity: str
    image_url: str
    pokedex_number: int
    is_owned: bool = False

    class Config:
        from_attributes = True

class CartItemResponse(BaseModel):
    id: str
    card_id: str
    card_name: str
    card_price: float
    card_image: str
    added_at: str

    class Config:
        from_attributes = True

@app.get("/")
def health_check():
    return {"message": "Pokemon Cards API is running"}

@app.post("/user", status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
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

@app.post("/login")
def login_user(login: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == login.email).first()

    if not user or not verify_password(login.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user.id})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "is_admin": user.is_admin
        }
    }

@app.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(UserModel).all()
    result = []

    for user in users:
        cards_count = db.query(UserCardOwnership).filter(UserCardOwnership.user_id == user.id).count()
        result.append({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "cards_owned": cards_count
        })
    return result

@app.put("/admin/users/{user_id}")
def admin_update_user(
    user_id: str,
    data: UserUpdate,
    db: Session = Depends(get_db),
    _: UserModel = Depends(admin_required)
):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.name:
        user.name = data.name
    if data.email:
        user.email = data.email
    if data.password:
        user.password = hash_password(data.password)

    db.commit()
    return {"message": "User updated successfully"}

@app.delete("/admin/users/{user_id}")
def admin_delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    _: UserModel = Depends(admin_required)
):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@app.get("/admin/users/{user_id}/cards")
def admin_get_user_cards(
    user_id: str,
    db: Session = Depends(get_db),
    _: UserModel = Depends(admin_required)
):
    target_user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    ownerships = db.query(UserCardOwnership).filter(
        UserCardOwnership.user_id == user_id
    ).all()

    result = []

    for ownership in ownerships:
        card = db.query(PokemonCard).filter(PokemonCard.id == ownership.card_id).first()
        if card:
            result.append({
                "id": card.id,
                "name": card.name,
                "pokemon_type": card.pokemon_type,
                "hp": card.hp,
                "attack": card.attack,
                "price": card.price,
                "rarity": card.rarity,
                "image_url": card.image_url,
                "purchased_at": ownership.purchased_at.isoformat()
            })

    return result

@app.get("/api/cards")
def get_all_cards(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cards = db.query(PokemonCard).all()

    owned_card_ids = [
        ownership.card_id
        for ownership in db.query(UserCardOwnership).filter(
            UserCardOwnership.user_id == current_user.id
        ).all()
    ]

    result = []

    for card in cards:
        result.append({
            "id": card.id,
            "name": card.name,
            "pokemon_type": card.pokemon_type,
            "hp": card.hp,
            "attack": card.attack,
            "price": card.price,
            "rarity": card.rarity,
            "image_url": card.image_url,
            "pokedex_number": card.pokedex_number,
            "is_owned": card.id in owned_card_ids
        })

    return result

@app.get("/api/cards/owned")
def get_owned_cards(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ownerships = db.query(UserCardOwnership).filter(
        UserCardOwnership.user_id == current_user.id
    ).all()

    result = []

    for ownership in ownerships:
        card = db.query(PokemonCard).filter(PokemonCard.id == ownership.card_id).first()
        if card:
            result.append({
                "id": card.id,
                "name": card.name,
                "pokemon_type": card.pokemon_type,
                "hp": card.hp,
                "attack": card.attack,
                "price": card.price,
                "rarity": card.rarity,
                "image_url": card.image_url,
                "purchased_at": ownership.purchased_at.isoformat()
            })

    return result

@app.delete("/api/cards/owned/{card_id}")
def remove_card_from_collection(
    card_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ownership = db.query(UserCardOwnership).filter(
        UserCardOwnership.card_id == card_id,
        UserCardOwnership.user_id == current_user.id
    ).first()

    if not ownership:
        raise HTTPException(
            status_code=404,
            detail="Card not found in your collection"
        )

    card = db.query(PokemonCard).filter(PokemonCard.id == card_id).first()
    card_name = card.name if card else "Card"

    db.delete(ownership)
    db.commit()

    return {"message": f"{card_name} removed from collection successfully"}

@app.get("/api/cart")
def get_cart(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart_items = db.query(CartItem).filter(CartItem.user_id == current_user.id).all()

    result = []

    for item in cart_items:
        card = db.query(PokemonCard).filter(PokemonCard.id == item.card_id).first()
        if card:
            result.append({
                "id": item.id,
                "card_id": card.id,
                "card_name": card.name,
                "card_price": card.price,
                "card_image": card.image_url,
                "added_at": item.added_at.isoformat()
            })

    return result

@app.post("/api/cart/add/{card_id}")
def add_to_cart(
    card_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    card = db.query(PokemonCard).filter(PokemonCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    ownership = db.query(UserCardOwnership).filter(
        UserCardOwnership.user_id == current_user.id,
        UserCardOwnership.card_id == card_id
    ).first()
    if ownership:
        raise HTTPException(status_code=400, detail="You already own this card")

    owned_count = db.query(UserCardOwnership).filter(
        UserCardOwnership.user_id == current_user.id
    ).count()
    cart_count = db.query(CartItem).filter(
        CartItem.user_id == current_user.id
    ).count()

    if owned_count + cart_count >= 3:
        raise HTTPException(status_code=400, detail="Maximum 3 cards allowed")

    existing_cart_item = db.query(CartItem).filter(
        CartItem.user_id == current_user.id,
        CartItem.card_id == card_id
    ).first()
    if existing_cart_item:
        raise HTTPException(status_code=400, detail="Card already in cart")

    cart_item = CartItem(
        user_id=current_user.id,
        card_id=card_id
    )
    db.add(cart_item)
    db.commit()

    return {"message": "Card added to cart", "card_name": card.name}

@app.delete("/api/cart/remove/{cart_item_id}")
def remove_from_cart(
    cart_item_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart_item = db.query(CartItem).filter(
        CartItem.id == cart_item_id,
        CartItem.user_id == current_user.id
    ).first()

    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    db.delete(cart_item)
    db.commit()

    return {"message": "Card removed from cart"}

@app.post("/api/cart/purchase")
def purchase_cart(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart_items = db.query(CartItem).filter(CartItem.user_id == current_user.id).all()

    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    owned_count = db.query(UserCardOwnership).filter(
        UserCardOwnership.user_id == current_user.id
    ).count()

    if owned_count + len(cart_items) > 3:
        raise HTTPException(status_code=400, detail="Purchase would exceed 3 card limit")

    total_price = 0
    purchased_cards = []

    for cart_item in cart_items:
        card = db.query(PokemonCard).filter(PokemonCard.id == cart_item.card_id).first()
        if card:
            ownership = UserCardOwnership(
                user_id=current_user.id,
                card_id=cart_item.card_id
            )
            db.add(ownership)
            total_price += card.price
            purchased_cards.append(card.name)

            db.delete(cart_item)

    db.commit()

    return {
        "message": "Purchase successful!",
        "cards_purchased": purchased_cards,
        "total_price": total_price,
        "cards_count": len(purchased_cards)
    }

@app.delete("/api/cart/clear")
def clear_cart(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()
    db.commit()

    return {"message": "Cart cleared"}
