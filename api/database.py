import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

_default_db = "sqlite:////tmp/traffic.db" if os.getenv("VERCEL") else "sqlite:///./traffic.db"
DATABASE_URL = os.getenv("DATABASE_URL", _default_db)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
