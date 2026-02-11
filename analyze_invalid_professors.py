#!/usr/bin/env python3
"""
Analyze and identify invalid professor records in the database.
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

# Define invalid patterns
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

# Analyze each professor
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
    
    if is_invalid:
        invalid_professors.append({
            'id': prof['id'],
            'name': name,
            'department': prof['department'],
            'patterns': matched_patterns
        })

# Print results
print(f"\n{'='*80}")
print(f"INVALID PROFESSOR RECORDS ANALYSIS")
print(f"{'='*80}\n")

print(f"Total professors in database: {len(professors)}")
print(f"Invalid professors found: {len(invalid_professors)}")
print(f"Invalid percentage: {len(invalid_professors)/len(professors)*100:.2f}%\n")

# Group by department
dept_stats = {}
for prof in invalid_professors:
    dept = prof['department']
    if dept not in dept_stats:
        dept_stats[dept] = []
    dept_stats[dept].append(prof)

print(f"{'='*80}")
print(f"INVALID RECORDS BY DEPARTMENT")
print(f"{'='*80}\n")

for dept in sorted(dept_stats.keys(), key=lambda x: len(dept_stats[x]), reverse=True):
    print(f"\n{dept}: {len(dept_stats[dept])} invalid records")
    print(f"{'-'*80}")
    for prof in dept_stats[dept][:10]:  # Show first 10
        print(f"  - {prof['name']}")
    if len(dept_stats[dept]) > 10:
        print(f"  ... and {len(dept_stats[dept]) - 10} more")

# Save to file
with open('/home/ubuntu/find-my-professor/invalid_professors.txt', 'w') as f:
    f.write(f"INVALID PROFESSOR IDS (Total: {len(invalid_professors)})\n")
    f.write(f"{'='*80}\n\n")
    for prof in invalid_professors:
        f.write(f"ID: {prof['id']}\n")
        f.write(f"Name: {prof['name']}\n")
        f.write(f"Department: {prof['department']}\n")
        f.write(f"Matched patterns: {', '.join(prof['patterns'])}\n")
        f.write(f"{'-'*80}\n")

print(f"\n{'='*80}")
print(f"Full report saved to: /home/ubuntu/find-my-professor/invalid_professors.txt")
print(f"{'='*80}\n")

cursor.close()
conn.close()
