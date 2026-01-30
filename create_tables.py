# create_tables.py - Script to create all database tables

# Import the database engine from our database configuration
from database import engine
# Import the Base class that all models inherit from
from models import Base

# Create all tables defined in our models
# - Base.metadata contains information about all tables defined in our models
# - create_all() creates tables if they don't already exist
# - bind=engine tells SQLAlchemy which database to create the tables in
Base.metadata.create_all(bind=engine)

# Print success message to confirm tables were created
print("Database tables created successfully")
