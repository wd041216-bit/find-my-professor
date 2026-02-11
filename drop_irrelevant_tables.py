#!/usr/bin/env python3
import os
import pymysql
from urllib.parse import urlparse

# Parse DATABASE_URL
database_url = os.environ['DATABASE_URL']
parsed = urlparse(database_url)

# Extract connection parameters
host = parsed.hostname
port = parsed.port
username = parsed.username
password = parsed.password
database = parsed.path.lstrip('/')
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

tables_to_drop = [
    'application_letters',
    'contact_messages',
    'credit_transactions',
    'major_normalization',
    'normalization_locks',
    'notifications',
    'professor_match_scores',
    'professor_url_cache',
    'profile_cache',
    'project_matches',
    'scraped_projects',
    'scraping_locks',
    'scraping_tasks',
    'schools',
    'universities',
    'university_major_cache',
    'university_major_mapping',
    'university_mascots',
    'university_normalization',
    'university_url_cache',
    'user_credits',
    'user_input_history'
]

try:
    cursor = conn.cursor()
    
    print(f"\n{'='*60}")
    print(f"Dropping {len(tables_to_drop)} tables...")
    print(f"{'='*60}\n")
    
    for table in tables_to_drop:
        try:
            cursor.execute(f"DROP TABLE IF EXISTS `{table}`")
            print(f"✓ Dropped table: {table}")
        except Exception as e:
            print(f"✗ Failed to drop table {table}: {e}")
    
    conn.commit()
    print(f"\n{'='*60}")
    print(f"✓ Successfully dropped {len(tables_to_drop)} tables")
    print(f"{'='*60}\n")
    
    cursor.close()
finally:
    conn.close()
