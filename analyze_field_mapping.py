#!/usr/bin/env python3
"""
Analyze the accuracy of research field mapping and image assignment.
"""

import os
import json
import mysql.connector
from urllib.parse import urlparse
from collections import Counter

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

print(f"\n{'='*80}")
print(f"RESEARCH FIELD MAPPING ANALYSIS")
print(f"{'='*80}\n")

# 1. Analyze tags distribution
print("1. TAGS DISTRIBUTION")
print(f"{'-'*80}")

cursor.execute("SELECT COUNT(*) as total FROM professors")
total_professors = cursor.fetchone()['total']

cursor.execute("SELECT COUNT(*) as count FROM professors WHERE tags = '[]' OR tags IS NULL")
empty_tags_count = cursor.fetchone()['count']

cursor.execute("SELECT COUNT(*) as count FROM professors WHERE tags != '[]' AND tags IS NOT NULL")
has_tags_count = cursor.fetchone()['count']

print(f"Total professors: {total_professors}")
print(f"Professors with empty tags: {empty_tags_count} ({empty_tags_count/total_professors*100:.1f}%)")
print(f"Professors with tags: {has_tags_count} ({has_tags_count/total_professors*100:.1f}%)")

# 2. Analyze research_field distribution
print(f"\n2. RESEARCH FIELD DISTRIBUTION")
print(f"{'-'*80}")

cursor.execute("SELECT COUNT(*) as count FROM professors WHERE research_field IS NULL")
null_field_count = cursor.fetchone()['count']

cursor.execute("SELECT COUNT(*) as count FROM professors WHERE research_field IS NOT NULL")
has_field_count = cursor.fetchone()['count']

print(f"Professors with NULL research_field: {null_field_count} ({null_field_count/total_professors*100:.1f}%)")
print(f"Professors with research_field: {has_field_count} ({has_field_count/total_professors*100:.1f}%)")

# 3. Analyze tag format issues
print(f"\n3. TAG FORMAT ISSUES")
print(f"{'-'*80}")

cursor.execute("SELECT id, name, tags FROM professors WHERE tags != '[]' AND tags IS NOT NULL LIMIT 1000")
professors_with_tags = cursor.fetchall()

normal_format_count = 0
double_escaped_count = 0
invalid_format_count = 0

double_escaped_examples = []

for prof in professors_with_tags:
    tags_str = prof['tags']
    
    # Try to parse tags
    try:
        # Check if it's a string representation of JSON (double-escaped)
        if isinstance(tags_str, str) and tags_str.startswith('"['):
            double_escaped_count += 1
            if len(double_escaped_examples) < 5:
                double_escaped_examples.append({
                    'name': prof['name'],
                    'tags': tags_str
                })
        else:
            # Normal JSON format
            tags_list = json.loads(tags_str) if isinstance(tags_str, str) else tags_str
            if isinstance(tags_list, list):
                normal_format_count += 1
            else:
                invalid_format_count += 1
    except:
        invalid_format_count += 1

print(f"Normal JSON format: {normal_format_count} ({normal_format_count/len(professors_with_tags)*100:.1f}%)")
print(f"Double-escaped format: {double_escaped_count} ({double_escaped_count/len(professors_with_tags)*100:.1f}%)")
print(f"Invalid format: {invalid_format_count} ({invalid_format_count/len(professors_with_tags)*100:.1f}%)")

if double_escaped_examples:
    print(f"\nDouble-escaped examples:")
    for ex in double_escaped_examples:
        print(f"  - {ex['name']}: {ex['tags'][:100]}...")

# 4. Analyze tag-to-field mapping coverage
print(f"\n4. TAG-TO-FIELD MAPPING COVERAGE")
print(f"{'-'*80}")

# Get all unique tags from professors
all_tags = set()
cursor.execute("SELECT tags FROM professors WHERE tags != '[]' AND tags IS NOT NULL")
for row in cursor.fetchall():
    try:
        tags_str = row['tags']
        # Handle double-escaped JSON
        if isinstance(tags_str, str) and tags_str.startswith('"['):
            tags_str = json.loads(tags_str)
        tags_list = json.loads(tags_str) if isinstance(tags_str, str) else tags_str
        if isinstance(tags_list, list):
            for tag in tags_list:
                if isinstance(tag, str):
                    all_tags.add(tag.lower().strip())
    except:
        pass

print(f"Total unique tags: {len(all_tags)}")

# Get all tags in mapping table
cursor.execute("SELECT DISTINCT LOWER(tag) as tag FROM research_field_tag_mapping")
mapped_tags = set(row['tag'] for row in cursor.fetchall())

print(f"Tags in mapping table: {len(mapped_tags)}")

# Find unmapped tags
unmapped_tags = all_tags - mapped_tags
print(f"Unmapped tags: {len(unmapped_tags)} ({len(unmapped_tags)/len(all_tags)*100:.1f}%)")

if unmapped_tags:
    print(f"\nSample unmapped tags (first 20):")
    for tag in list(unmapped_tags)[:20]:
        print(f"  - {tag}")

# 5. Analyze professors with tags but no research_field
print(f"\n5. PROFESSORS WITH TAGS BUT NO RESEARCH_FIELD")
print(f"{'-'*80}")

cursor.execute("""
    SELECT COUNT(*) as count 
    FROM professors 
    WHERE (tags != '[]' AND tags IS NOT NULL) 
    AND research_field IS NULL
""")
tags_but_no_field = cursor.fetchone()['count']

print(f"Professors with tags but no research_field: {tags_but_no_field}")
print(f"This suggests {tags_but_no_field} professors have tags that don't map to any research field")

# Sample some of these professors
cursor.execute("""
    SELECT name, department, tags 
    FROM professors 
    WHERE (tags != '[]' AND tags IS NOT NULL) 
    AND research_field IS NULL
    LIMIT 10
""")
examples = cursor.fetchall()

if examples:
    print(f"\nExamples:")
    for ex in examples:
        tags_str = ex['tags']
        try:
            if isinstance(tags_str, str) and tags_str.startswith('"['):
                tags_str = json.loads(tags_str)
            tags_list = json.loads(tags_str) if isinstance(tags_str, str) else tags_str
            print(f"  - {ex['name']} ({ex['department']})")
            print(f"    Tags: {tags_list[:3]}...")
        except:
            print(f"  - {ex['name']} ({ex['department']})")
            print(f"    Tags: [parsing error]")

# 6. Analyze research_field_images table
print(f"\n6. RESEARCH FIELD IMAGES")
print(f"{'-'*80}")

cursor.execute("SELECT COUNT(*) as count FROM research_field_images")
total_images = cursor.fetchone()['count']

cursor.execute("SELECT COUNT(DISTINCT research_field_name) as count FROM research_field_images")
unique_fields = cursor.fetchone()['count']

cursor.execute("SELECT COUNT(*) as count FROM research_field_images WHERE university_name IS NOT NULL")
university_specific = cursor.fetchone()['count']

cursor.execute("SELECT COUNT(*) as count FROM research_field_images WHERE university_name IS NULL")
generic_images = cursor.fetchone()['count']

print(f"Total images: {total_images}")
print(f"Unique research fields: {unique_fields}")
print(f"University-specific images: {university_specific}")
print(f"Generic images: {generic_images}")

# Check coverage
cursor.execute("SELECT DISTINCT research_field_name FROM research_field_tag_mapping")
mapped_fields = set(row['research_field_name'] for row in cursor.fetchall())

cursor.execute("SELECT DISTINCT research_field_name FROM research_field_images")
fields_with_images = set(row['research_field_name'] for row in cursor.fetchall())

fields_without_images = mapped_fields - fields_with_images
print(f"\nResearch fields without images: {len(fields_without_images)}")
if fields_without_images:
    print(f"Fields: {', '.join(fields_without_images)}")

print(f"\n{'='*80}")
print(f"ANALYSIS COMPLETE")
print(f"{'='*80}\n")

cursor.close()
conn.close()
