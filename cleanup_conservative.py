#!/usr/bin/env python3
"""
Conservative cleanup - only delete obvious garbage, keep anything that might be a real professor.
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

# Only delete OBVIOUS garbage - be very conservative
OBVIOUS_GARBAGE_KEYWORDS = [
    'google analytics', 'using analytics', 'certificate programs', 'undergraduate programs',
    'graduate programs', 'professional programs', 'postdoctoral programs',
    'undergraduate admission', 'graduate admission', 'graduate curriculum',
    'construction management', 'professionals advisory council',
    'science in architecture', 'washington home', 'insights conversion event',
    'headshot', 'profile', 'ceremony', 'magazine', 'mountaineers',
    'orthodontics', 'endodontics', 'september', 'october', 'november', 'december',
    'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
    'street', 'avenue', 'road', 'boulevard', 'drive',
    'simulation', 'operations contacts', 'funding information',
    'hiring students', 'tunnel', 'impacts group', 'voicing concerns',
    'opportunities', 'involvement', 'safety', 'methods', 'work', 'council',
    'admissions coordinator', 'part-time', 'full-time', 'summer opportunities',
    'winter opportunities', 'spring opportunities', 'fall opportunities',
    'climate impacts', 'marine operations', 'molecular simulation',
    'boat street', 'funding information', 'department chair',
    'designing up magazine', 'graduation ceremony', 'kirsten wind tunnel',
]

# Query all professors
cursor.execute("SELECT id, name, department FROM professors")
professors = cursor.fetchall()

# Analyze each professor
invalid_professors = []

for prof in professors:
    name = prof['name'].strip()
    is_invalid = False
    reason = ''
    
    # Check for obvious garbage keywords
    name_lower = name.lower()
    for keyword in OBVIOUS_GARBAGE_KEYWORDS:
        if keyword in name_lower:
            is_invalid = True
            reason = f'contains_{keyword}'
            break
    
    # Additional heuristic: names with more than 6 words are likely garbage
    words = name.split()
    if len(words) > 6:
        is_invalid = True
        reason = 'too_many_words'
    
    # Names with less than 2 words (unless it's a single famous name)
    if len(words) < 2 and len(name) > 20:
        is_invalid = True
        reason = 'single_long_word'
    
    if is_invalid:
        invalid_professors.append({
            'id': prof['id'],
            'name': name,
            'department': prof['department'],
            'reason': reason
        })

print(f"\n{'='*80}")
print(f"CONSERVATIVE CLEANUP ANALYSIS")
print(f"{'='*80}\n")

print(f"Total professors in database: {len(professors)}")
print(f"Invalid professors to delete: {len(invalid_professors)}")
print(f"\nInvalid records:")
print(f"{'-'*80}")
for prof in invalid_professors:
    print(f"  - {prof['name']} | Reason: {prof['reason']}")

# First, delete related records in student_likes and student_swipes
if invalid_professors:
    invalid_ids = [prof['id'] for prof in invalid_professors]
    
    print(f"\n{'='*80}")
    print(f"Step 1: Deleting related records in student_likes and student_swipes...")
    print(f"{'='*80}\n")
    
    # Delete from student_likes
    placeholders = ','.join(['%s'] * len(invalid_ids))
    cursor.execute(f"DELETE FROM student_likes WHERE professor_id IN ({placeholders})", invalid_ids)
    likes_deleted = cursor.rowcount
    conn.commit()
    print(f"Deleted {likes_deleted} records from student_likes")
    
    # Delete from student_swipes
    cursor.execute(f"DELETE FROM student_swipes WHERE professor_id IN ({placeholders})", invalid_ids)
    swipes_deleted = cursor.rowcount
    conn.commit()
    print(f"Deleted {swipes_deleted} records from student_swipes")
    
    print(f"\n{'='*80}")
    print(f"Step 2: Deleting invalid professors...")
    print(f"{'='*80}\n")
    
    # Now delete professors
    cursor.execute(f"DELETE FROM professors WHERE id IN ({placeholders})", invalid_ids)
    professors_deleted = cursor.rowcount
    conn.commit()
    print(f"Deleted {professors_deleted} professors")

print(f"\n{'='*80}")
print(f"CONSERVATIVE CLEANUP COMPLETE")
print(f"{'='*80}\n")

# Verify final count
cursor.execute("SELECT COUNT(*) as count FROM professors")
final_count = cursor.fetchone()['count']
print(f"Final professor count: {final_count}")

# Show sample of remaining professors
print(f"\n{'='*80}")
print(f"SAMPLE OF REMAINING PROFESSORS (Random 30)")
print(f"{'='*80}\n")
cursor.execute("SELECT name, department FROM professors ORDER BY RAND() LIMIT 30")
samples = cursor.fetchall()
for sample in samples:
    print(f"  - {sample['name']} ({sample['department']})")

cursor.close()
conn.close()
