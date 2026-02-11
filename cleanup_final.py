#!/usr/bin/env python3
"""
Final cleanup using heuristic rules based on name structure.
A valid professor name should have:
1. At least 2 words (First Last)
2. Each word should start with uppercase
3. Should not contain common invalid keywords
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

# Keywords that indicate invalid names
INVALID_KEYWORDS = [
    'chair', 'ceremony', 'magazine', 'mountaineers', 'orthodontics', 'endodontics',
    'september', 'street', 'simulation', 'operations', 'contacts', 'information',
    'programs', 'hiring', 'tunnel', 'impacts', 'group', 'analytics', 'concerns',
    'opportunities', 'involvement', 'safety', 'methods', 'work', 'council',
    'admissions', 'part-time', 'full-time', 'summer', 'winter', 'spring', 'fall',
    'undergraduate', 'graduate', 'postdoctoral', 'doctoral', 'masters',
    'climate', 'marine', 'molecular', 'kirsten', 'boat', 'funding',
    'the ', 'in ', 'on ', 'at ', 'for ', 'with ', 'from ', 'to ',
    'google', 'facebook', 'twitter', 'linkedin', 'instagram',
]

# Query all professors
cursor.execute("SELECT id, name, department FROM professors")
professors = cursor.fetchall()

# Analyze each professor
invalid_professors = []
valid_professors = []

for prof in professors:
    name = prof['name'].strip()
    is_invalid = False
    reason = []
    
    # Rule 1: Check for invalid keywords
    name_lower = name.lower()
    for keyword in INVALID_KEYWORDS:
        if keyword in name_lower:
            is_invalid = True
            reason.append(f'contains_keyword_{keyword}')
            break
    
    # Rule 2: Valid names should have exactly 2-4 words (First Middle? Last)
    # Allow some flexibility for compound names
    words = name.split()
    if len(words) < 2:
        is_invalid = True
        reason.append('too_few_words')
    elif len(words) > 5:
        is_invalid = True
        reason.append('too_many_words')
    
    # Rule 3: Each word should start with uppercase (proper names)
    # Exception: particles like "de", "van", "von", "da", "di"
    particles = ['de', 'van', 'von', 'da', 'di', 'del', 'della', 'le', 'la']
    if not is_invalid:
        for i, word in enumerate(words):
            # Skip particles
            if word.lower() in particles:
                continue
            # First letter should be uppercase
            if not word[0].isupper():
                is_invalid = True
                reason.append('lowercase_word')
                break
    
    # Rule 4: Should not contain numbers (except maybe Jr., II, III)
    if not is_invalid:
        if re.search(r'\d+', name) and not re.search(r'\b(Jr|Sr|II|III|IV)\b', name):
            is_invalid = True
            reason.append('contains_numbers')
    
    # Rule 5: Should not contain special characters (except hyphens, apostrophes, periods)
    if not is_invalid:
        if re.search(r'[^a-zA-Z\s\-\'.()]', name):
            is_invalid = True
            reason.append('special_characters')
    
    if is_invalid:
        invalid_professors.append({
            'id': prof['id'],
            'name': name,
            'department': prof['department'],
            'reason': reason
        })
    else:
        valid_professors.append({
            'id': prof['id'],
            'name': name,
            'department': prof['department']
        })

print(f"\n{'='*80}")
print(f"FINAL CLEANUP ANALYSIS")
print(f"{'='*80}\n")

print(f"Total professors in database: {len(professors)}")
print(f"Valid professors: {len(valid_professors)}")
print(f"Invalid professors to delete: {len(invalid_professors)}")
print(f"\nSample invalid records:")
print(f"{'-'*80}")
for prof in invalid_professors[:30]:
    print(f"  - {prof['name']} | Reason: {', '.join(prof['reason'])}")
if len(invalid_professors) > 30:
    print(f"  ... and {len(invalid_professors) - 30} more")

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
print(f"FINAL CLEANUP COMPLETE")
print(f"{'='*80}\n")

print(f"Total records deleted: {deleted_count}")

# Verify final count
cursor.execute("SELECT COUNT(*) as count FROM professors")
final_count = cursor.fetchone()['count']
print(f"Final professor count: {final_count}")

# Show sample of remaining professors
print(f"\n{'='*80}")
print(f"SAMPLE OF REMAINING PROFESSORS (Random 20)")
print(f"{'='*80}\n")
cursor.execute("SELECT name, department FROM professors ORDER BY RAND() LIMIT 20")
samples = cursor.fetchall()
for sample in samples:
    print(f"  - {sample['name']} ({sample['department']})")

cursor.close()
conn.close()
