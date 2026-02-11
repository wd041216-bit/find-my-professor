#!/usr/bin/env python3
"""
Second round cleanup with stricter patterns.
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

# Additional invalid patterns (more specific)
ADDITIONAL_PATTERNS = [
    # Job titles and positions
    r'Fellow$',
    r'Coordinator$',
    r'Assistant$',
    r'Associate$',
    r'Specialist$',
    r'Manager$',
    r'Administrator$',
    
    # Research areas and fields (more specific)
    r'^Legal ',
    r'^Human ',
    r'^Campus ',
    r'^Student ',
    r'^Medical ',
    r'^Clinical ',
    r'^Environmental ',
    r'^Social ',
    r'^Public ',
    r'^Urban ',
    r'^Rural ',
    r'^Global ',
    r'^International ',
    r'^Community ',
    r'^Regional ',
    
    # Generic academic terms
    r' Education$',
    r' Analysis$',
    r' Design$',
    r' Environment$',
    r' Opportunities$',
    r' Processes$',
    r' Association$',
    r' Coordinator$',
    r' Plot$',
    r' Stations$',
    r' Layer$',
    r' Boundary$',
    
    # Names with hyphens (likely website elements)
    r'^[A-Z][a-z]+-[A-Z][a-z]+$',  # e.g., Lock-Barbara, Heather-Hill
    r'^The-[A-Z]',  # e.g., The-Columns
    
    # Single word names (likely not real professors)
    r'^[A-Z][a-z]+$',  # Single capitalized word
]

# Compile patterns
compiled_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in ADDITIONAL_PATTERNS]

# Query all professors
cursor.execute("SELECT id, name, department FROM professors")
professors = cursor.fetchall()

# Identify invalid professors
invalid_professors = []
for prof in professors:
    name = prof['name']
    is_invalid = False
    matched_patterns = []
    
    # Check against all patterns
    for pattern in compiled_patterns:
        if pattern.search(name):
            is_invalid = True
            matched_patterns.append(pattern.pattern)
    
    # Additional heuristic: names without spaces are likely invalid
    # (except for single-name professors like "Madonna" - but very rare in academia)
    if ' ' not in name and len(name) < 20:
        # Skip if it looks like a real single name (all lowercase or mixed case)
        if not (name.islower() or (name[0].isupper() and name[1:].islower())):
            is_invalid = True
            matched_patterns.append('no_space_heuristic')
    
    if is_invalid:
        invalid_professors.append({
            'id': prof['id'],
            'name': name,
            'department': prof['department'],
            'patterns': matched_patterns
        })

print(f"\n{'='*80}")
print(f"ROUND 2 CLEANUP ANALYSIS")
print(f"{'='*80}\n")

print(f"Total professors in database: {len(professors)}")
print(f"Additional invalid professors found: {len(invalid_professors)}")
print(f"\nSample invalid records:")
print(f"{'-'*80}")
for prof in invalid_professors[:20]:
    print(f"  - {prof['name']} ({prof['department']})")
if len(invalid_professors) > 20:
    print(f"  ... and {len(invalid_professors) - 20} more")

print(f"\n{'='*80}")
print(f"Proceed with deletion? (This will delete {len(invalid_professors)} records)")
print(f"{'='*80}\n")

# Delete invalid professors
if invalid_professors:
    invalid_ids = [prof['id'] for prof in invalid_professors]
    
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
print(f"ROUND 2 CLEANUP COMPLETE")
print(f"{'='*80}\n")

print(f"Total records deleted: {deleted_count}")

# Verify final count
cursor.execute("SELECT COUNT(*) as count FROM professors")
final_count = cursor.fetchone()['count']
print(f"Final professor count: {final_count}")

cursor.close()
conn.close()
