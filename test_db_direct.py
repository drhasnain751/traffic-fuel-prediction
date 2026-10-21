#!/usr/bin/env python
import sys
print("Python started", flush=True)

from api.database import engine, Base, SessionLocal
print("✓ Database imports OK", flush=True)

from api.db_models import DBUser
print("✓ Models imported", flush=True)

Base.metadata.create_all(bind=engine)
print("✓ Tables created", flush=True)

db = SessionLocal()
print("✓ Session created", flush=True)

users = db.query(DBUser).all()
print(f"✓ Query successful, {len(users)} users found", flush=True)

db.close()
print("✓ Connection closed", flush=True)
