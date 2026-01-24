# security.py
# ======================================================
# Security utilities: password hashing and JWT token handling
# ======================================================

from datetime import datetime, timedelta
from jose import jwt, JWTError
import bcrypt

# ======================================================
# Configurable Security Constants
# ======================================================

SECRET_KEY = "super-secret-key-change-this"              # Secret key for signing JWTs
ALGORITHM = "HS256"                                      # Token algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = 60                         # Token expiration time (in minutes)

# ======================================================
# Password Hashing Utilities
# ======================================================

def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify that a plaintext password matches its hashed version."""
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)

# ======================================================
# JWT Token Utilities
# ======================================================

def create_access_token(data: dict):
    """Create a signed JWT access token containing user data."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})  # Add expiration claim
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_access_token(token: str):
    """Decode and verify JWT token validity and expiration."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")  # Return user ID from token payload
    except JWTError:
        return None
