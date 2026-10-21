import sys
sys.path.insert(0, '.')

# Test basic endpoint
from api.database import Base, engine
from api.db_models import DBUser, DBPrediction, DBRoadSegment, DBTripPrediction, DBModelVersion

# Create tables
print("Creating database schema...")
Base.metadata.create_all(bind=engine)
print("Schema created.")

# Try a direct query
from sqlalchemy.orm import sessionmaker
Session = sessionmaker(bind=engine)
db = Session()

print("\nTesting database operations...")
print(f"User table exists: {db.query(DBUser).count()} users")
print("Database connection successful!")

db.close()
