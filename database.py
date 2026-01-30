# database.py - Database configuration and session management for the Pokemon Cards API

# Import SQLAlchemy components for database operations
from sqlalchemy import create_engine  # Creates the database engine
from sqlalchemy.orm import sessionmaker, declarative_base  # Session factory and base class for models

# Define the database URL - using SQLite database stored in app.db file
DATABASE_URL = "sqlite:///./app.db"

# Create the database engine
# - connect_args={"check_same_thread": False} allows SQLite to be used with FastAPI's async nature
# - This is needed because SQLite normally restricts database access to the thread that created it
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

# Create a SessionLocal class that will be used to create database sessions
# - autocommit=False: Changes are not automatically committed (we control when to commit)
# - autoflush=False: Changes are not automatically flushed to the database
# - bind=engine: Binds this session factory to our database engine
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Create a Base class that all our database models will inherit from
# - This declarative_base() creates a base class for our ORM models
# - All models (User, PokemonCard, etc.) will extend this Base class
Base = declarative_base()
