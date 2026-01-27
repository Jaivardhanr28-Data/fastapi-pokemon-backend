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
from fastapi.middleware.cors import CORSMiddleware

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# ======================================================
# Database Dependency
# ======================================================

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ======================================================
# Auth Dependency
# ======================================================

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

# 🔐 ADMIN GUARD (NEW)
def admin_required(current_user: UserModel = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ======================================================
# Schemas
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
    password: str | None = None

class ChangePasswordRequest(BaseModel):
    new_password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str

    class Config:
        from_attributes = True

# ======================================================
# Health
# ======================================================

@app.get("/")
def health_check():
    return {"message": "API is running"}

# ======================================================
# User Routes (UNCHANGED)
# ======================================================

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

@app.get("/users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    return db.query(UserModel).all()

# ======================================================
# 🔥 ADMIN ROUTES (NEW — SAFE)
# ======================================================

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
