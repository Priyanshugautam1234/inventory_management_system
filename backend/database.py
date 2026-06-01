import os
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Get database URL from environment variable, default to local sqlite for development fallback if needed
# But standard docker-compose will supply postgresql://...
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://inventory_admin:supersecurepassword123@db:5432/inventory_db"
)

# Retry connection logic for Postgres in Docker
max_retries = 5
retry_delay = 3
engine = None

for i in range(max_retries):
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        # Test connection
        with engine.connect() as conn:
            print("Successfully connected to the database!")
            break
    except Exception as e:
        print(f"Database connection attempt {i + 1} failed: {e}")
        if i < max_retries - 1:
            print(f"Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)
        else:
            print("Failed to connect to the database after max retries. Exiting.")
            raise e

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
