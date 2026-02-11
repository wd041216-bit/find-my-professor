#!/usr/bin/env python3
"""
Clean up invalid professor records from the database.
"""

import os
import re
import mysql.connector
from urllib.parse import urlparse

# Parse DATABASE_URL
database_url = os.environ.get('DATABASE_URL')
parsed = urlparse(database_url)

# Connect to database
conn = mysql.connector.connect(
    host=parsed.hostname,
    port=parsed.port,
    user=parsed.username,
    password=parsed.password,
    database=parsed.path[1:]  # Remove leading slash
)

cursor = conn.cursor(dictionary=True)

# Define invalid patterns (same as analysis script)
INVALID_PATTERNS = [
    # Web elements and CSS
    r'Sans',
    r'Font',
    r'Encode',
    r'Liberation',
    r'Awesome',
    r'Noto',
    
    # Website functionality
    r'Menu',
    r'Toggle',
    r'Search',
    r'Feed',
    r'Comments',
    r'Link',
    r'Button',
    r'Page',
    r'Selection',
    r'Skip',
    r'Mode',
    r'Icon',
    r'Logo',
    r'Image',
    r'Cover',
    
    # Job titles/positions (should not be professor names)
    r'Professor$',  # Ends with "Professor"
    r'^Professor ',  # Starts with "Professor"
    r'Faculty$',
    r'^Faculty ',
    r'Emeritus',
    r'Adjunct',
    r'Affiliate',
    r'Assistant Dean',
    r'Associate Dean',
    r'Dean$',
    r'Director$',
    r'^Director ',
    r'Instructor$',
    
    # Research areas/fields (not professor names)
    r' Law$',  # Ends with "Law"
    r' Studies$',
    r' Research$',
    r' Program$',
    r' Institute$',
    r' Center$',
    r' Department$',
    
    # Website sections
    r'Directory',
    r'Publications',
    r'Resources',
    r'Meetings',
    r'Affairs',
    r'Services',
    
    # Generic terms
    r'^Primary ',
    r'^Main ',
    r'^Quick ',
    r'^Helpful ',
    r'Not Found',
    r'Washington School',
    r'Washington-School',
    
    # Technical terms that shouldn't be names
    r'Modeling$',
    r'Control$',
    r'System$',
    r'Network$',
    r'Transfer$',
]

# Compile patterns
compiled_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in INVALID_PATTERNS]

# Query all professors
cursor.execute("SELECT id, name, department FROM professors")
professors = cursor.fetchall()

# Identify invalid professors
invalid_ids = []
for prof in professors:
    name = prof['name']
    is_invalid = False
    
    # Check against all patterns
    for pattern in compiled_patterns:
        if pattern.search(name):
            is_invalid = True
            break
    
    if is_invalid:
        invalid_ids.append(prof['id'])

print(f"\n{'='*80}")
print(f"CLEANUP OPERATION")
print(f"{'='*80}\n")

print(f"Total professors in database: {len(professors)}")
print(f"Invalid professors to delete: {len(invalid_ids)}")
print(f"Valid professors remaining: {len(professors) - len(invalid_ids)}")
print(f"\nDeleting {len(invalid_ids)} invalid records...\n")

# Delete invalid professors
if invalid_ids:
    # Split into batches of 100 for safety
    batch_size = 100
    deleted_count = 0
    
    for i in range(0, len(invalid_ids), batch_size):
        batch = invalid_ids[i:i+batch_size]
        placeholders = ','.join(['%s'] * len(batch))
        delete_query = f"DELETE FROM professors WHERE id IN ({placeholders})"
        cursor.execute(delete_query, batch)
        conn.commit()
        deleted_count += len(batch)
        print(f"Deleted batch {i//batch_size + 1}: {deleted_count}/{len(invalid_ids)} records")

print(f"\n{'='*80}")
print(f"CLEANUP COMPLETE")
print(f"{'='*80}\n")

print(f"Total records deleted: {deleted_count}")

# Verify final count
cursor.execute("SELECT COUNT(*) as count FROM professors")
final_count = cursor.fetchone()['count']
print(f"Final professor count: {final_count}")

cursor.close()
conn.close()
