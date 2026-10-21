import sqlite3
import os

db_path = 'traffic.db'
print(f"Database file: {db_path}")
print(f"File size: {os.path.getsize(db_path)} bytes")
print(f"File exists: {os.path.exists(db_path)}\n")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

print("Tables and row counts:")
for table in tables:
    table_name = table[0]
    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    count = cursor.fetchone()[0]
    print(f"  {table_name}: {count} rows")
    
    # Show schema
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = cursor.fetchall()
    for col in columns:
        col_name = col[1]
        col_type = col[2]
        print(f"    - {col_name}: {col_type}")

conn.close()
print("\nDatabase verification complete!")
