from database import SessionLocal, engine, Base
from models import PokemonCard
import uuid

Base.metadata.create_all(bind=engine)

db = SessionLocal()

print("🗑️  Deleting old Pokemon cards...")
db.query(PokemonCard).delete()
db.commit()

pokemon_cards = [
    {
        "name": "Charizard",
        "pokemon_type": "Fire",
        "hp": 120,
        "attack": "Flamethrower",
        "price": 29.99,
        "rarity": "Legendary",
        "image_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png",
        "pokedex_number": 6
    },
    {
        "name": "Pikachu",
        "pokemon_type": "Electric",
        "hp": 60,
        "attack": "Thunderbolt",
        "price": 9.99,
        "rarity": "Rare",
        "image_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
        "pokedex_number": 25
    },
    {
        "name": "Blastoise",
        "pokemon_type": "Water",
        "hp": 100,
        "attack": "Hydro Pump",
        "price": 19.99,
        "rarity": "Rare",
        "image_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png",
        "pokedex_number": 9
    },
    {
        "name": "Bulbasaur",
        "pokemon_type": "Grass/Poison",
        "hp": 70,
        "attack": "Vine Whip",
        "price": 12.99,
        "rarity": "Common",
        "image_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png",
        "pokedex_number": 1
    },
    {
        "name": "Gengar",
        "pokemon_type": "Ghost/Poison",
        "hp": 90,
        "attack": "Shadow Ball",
        "price": 22.99,
        "rarity": "Rare",
        "image_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png",
        "pokedex_number": 94
    },
    {
        "name": "Mewtwo",
        "pokemon_type": "Psychic",
        "hp": 150,
        "attack": "Psystrike",
        "price": 49.99,
        "rarity": "Legendary",
        "image_url": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png",
        "pokedex_number": 150
    }
]

print("✨ Adding 6 Pokemon cards...")
for card_data in pokemon_cards:
    card = PokemonCard(
        id=str(uuid.uuid4()),
        **card_data
    )
    db.add(card)
    print(f"   ✅ Added {card_data['name']} - ${card_data['price']}")

db.commit()

print("\n🎉 Successfully added 6 Pokemon cards!")
print("\n📊 Card Summary:")
print("   1. Charizard (Legendary) - $29.99")
print("   2. Pikachu (Rare) - $9.99")
print("   3. Blastoise (Rare) - $19.99")
print("   4. Bulbasaur (Common) - $12.99")
print("   5. Gengar (Rare) - $22.99")
print("   6. Mewtwo (Legendary) - $49.99")

db.close()
