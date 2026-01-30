# security.py - Handles password hashing and JWT token generation/verification

# Import datetime utilities for token expiration
from datetime import datetime, timedelta
# Import JWT library for creating and verifying JSON Web Tokens
from jose import jwt, JWTError
# Import passlib for secure password hashing
from passlib.context import CryptContext

# Secret key used to sign JWT tokens (in production, this should be in environment variables)
SECRET_KEY = "SUPER_SECRET_KEY"
# Algorithm used for JWT encoding/decoding
ALGORITHM = "HS256"
# Token expiration time in minutes (60 minutes = 1 hour)
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Create a password hashing context using pbkdf2_sha256 algorithm
# - schemes=["pbkdf2_sha256"]: Uses PBKDF2 with SHA-256 for secure password hashing
# - deprecated="auto": Automatically handles deprecated hashing schemes
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto"
)

def hash_password(password: str):
    """
    Hash a plain text password using pbkdf2_sha256

    Args:
        password (str): The plain text password to hash

    Returns:
        str: The hashed password string
    """
    # Use the password context to hash the password
    return pwd_context.hash(password)

def verify_password(password: str, hashed_password: str):
    """
    Verify a plain text password against a hashed password

    Args:
        password (str): The plain text password to verify
        hashed_password (str): The hashed password to compare against

    Returns:
        bool: True if password matches, False otherwise
    """
    # Use the password context to verify the password
    return pwd_context.verify(password, hashed_password)

def create_access_token(data: dict):
    """
    Create a JWT access token with an expiration time

    Args:
        data (dict): The payload data to encode in the token (typically {"sub": user_id})

    Returns:
        str: The encoded JWT token
    """
    # Create a copy of the data to avoid modifying the original
    to_encode = data.copy()
    # Calculate the expiration time (current time + ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    # Add the expiration time to the token payload
    to_encode.update({"exp": expire})
    # Encode and return the JWT token using our secret key and algorithm
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_access_token(token: str):
    """
    Verify and decode a JWT access token

    Args:
        token (str): The JWT token to verify and decode

    Returns:
        dict: The decoded payload if token is valid, None if invalid or expired
    """
    try:
        # Try to decode the token using our secret key and algorithm
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # Return the decoded payload (contains user_id in "sub" field)
        return payload
    except JWTError:
        # If token is invalid, expired, or malformed, return None
        return None
