#!/usr/bin/env python3
import os
import pymysql
from urllib.parse import urlparse, parse_qs

# Parse DATABASE_URL
database_url = os.environ['DATABASE_URL']
parsed = urlparse(database_url)

# Extract connection parameters
host = parsed.hostname
port = parsed.port
username = parsed.username
password = parsed.password
database = parsed.path.lstrip('/')
# Remove query parameters from database name
if '?' in database:
    database = database.split('?')[0]

# Connect to database
conn = pymysql.connect(
    host=host,
    port=port,
    user=username,
    password=password,
    database=database,
    ssl={'ssl_mode': 'VERIFY_IDENTITY'}
)

try:
    cursor = conn.cursor()
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    
    print(f"\n{'='*60}")
    print(f"Total tables: {len(tables)}")
    print(f"{'='*60}\n")
    
    for i, (table_name,) in enumerate(tables, 1):
        # Get row count
        cursor.execute(f"SELECT COUNT(*) FROM `{table_name}`")
        count = cursor.fetchone()[0]
        print(f"{i:2d}. {table_name:40s} ({count:6d} rows)")
    
    cursor.close()
finally:
    conn.close()
