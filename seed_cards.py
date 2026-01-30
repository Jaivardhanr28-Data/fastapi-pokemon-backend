# seed_cards.py - Script to populate the database with initial Pokemon cards
# Run this script once to add 6 Pokemon cards to the database

# Import database components
from database import SessionLocal, engine, Base
# Import the PokemonCard model
from models import PokemonCard
# Import uuid for generating unique IDs
import uuid

# Create all database tables (in case they don't exist yet)
# This ensures the pokemon_cards table exists before we try to add data
Base.metadata.create_all(bind=engine)

# Create a database session to interact with the database
db = SessionLocal()

# Delete any existing Pokemon cards to start with a clean slate
# This prevents duplicate cards if the script is run multiple times
print("🗑️  Deleting old Pokemon cards...")
db.query(PokemonCard).delete()  # Delete all rows from the pokemon_cards table
db.commit()  # Commit the deletion to the database

# Define 6 Pokemon cards with their attributes
# Each dictionary contains all the information for one Pokemon card
pokemon_cards = [
    {
        # Charizard - A legendary Fire-type Pokemon
        "name": "Charizard",
        "pokemon_type": "Fire",
        "hp": 120,  # Hit Points - how much damage it can take
        "attack": "Flamethrower",  # Signature attack move
        "price": 29.99,  # Price in dollars
        "rarity": "Legendary",  # Rarity level
        # Image URL from official Pokemon sprite repository
        "image_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png",
        "pokedex_number": 6  # Charizard's National Pokedex number
    },
    {
        # Pikachu - A rare Electric-type Pokemon (mascot of Pokemon)
        "name": "Pikachu",
        "pokemon_type": "Electric",
        "hp": 60,
        "attack": "Thunderbolt",
        "price": 9.99,
        "rarity": "Rare",
        "image_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
        "pokedex_number": 25  # Pikachu's National Pokedex number
    },
    {
        # Blastoise - A rare Water-type Pokemon
        "name": "Blastoise",
        "pokemon_type": "Water",
        "hp": 100,
        "attack": "Hydro Pump",
        "price": 19.99,
        "rarity": "Rare",
        "image_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png",
        "pokedex_number": 9  # Blastoise's National Pokedex number
    },
    {
        # Bulbasaur - A common Grass/Poison-type Pokemon (starter Pokemon)
        "name": "Bulbasaur",
        "pokemon_type": "Grass/Poison",
        "hp": 70,
        "attack": "Vine Whip",
        "price": 12.99,
        "rarity": "Common",
        "image_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png",
        "pokedex_number": 1  # Bulbasaur is #1 in the National Pokedex
    },
    {
        # Gengar - A rare Ghost/Poison-type Pokemon
        "name": "Gengar",
        "pokemon_type": "Ghost/Poison",
        "hp": 90,
        "attack": "Shadow Ball",
        "price": 22.99,
        "rarity": "Rare",
        "image_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png",
        "pokedex_number": 94  # Gengar's National Pokedex number
    },
    {
        # Mewtwo - A legendary Psychic-type Pokemon (strongest in Gen 1)
        "name": "Mewtwo",
        "pokemon_type": "Psychic",
        "hp": 150,  # Highest HP of all our cards
        "attack": "Psystrike",
        "price": 49.99,  # Most expensive card
        "rarity": "Legendary",
        "image_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png",
        "pokedex_number": 150  # Mewtwo's National Pokedex number
    }
]

# Add each Pokemon card to the database
print("✨ Adding 6 Pokemon cards...")
for card_data in pokemon_cards:
    # Create a new PokemonCard instance
    # - str(uuid.uuid4()) generates a unique ID for the card
    # - **card_data unpacks the dictionary into keyword arguments
    card = PokemonCard(
        id=str(uuid.uuid4()),
        **card_data
    )
    # Add the card to the session (staging area)
    db.add(card)
    # Print confirmation for each card added
    print(f"   ✅ Added {card_data['name']} - ${card_data['price']}")

# Commit all changes to the database
# This actually saves the cards to the database
db.commit()

# Print success message and summary
print("\n🎉 Successfully added 6 Pokemon cards!")
print("\n📊 Card Summary:")
print("   1. Charizard (Legendary) - $29.99")
print("   2. Pikachu (Rare) - $9.99")
print("   3. Blastoise (Rare) - $19.99")
print("   4. Bulbasaur (Common) - $12.99")
print("   5. Gengar (Rare) - $22.99")
print("   6. Mewtwo (Legendary) - $49.99")

# Close the database session
db.close()
