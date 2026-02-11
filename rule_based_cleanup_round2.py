#!/usr/bin/env python3
"""
Round 2: Enhanced rule-based cleanup with stricter patterns.
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

print(f"\n{'='*80}")
print(f"ROUND 2: ENHANCED RULE-BASED CLEANUP")
print(f"{'='*80}\n")

# Load all professors
cursor.execute("""
    SELECT id, name, department, title, email
    FROM professors
    ORDER BY id
""")

professors = cursor.fetchall()
total_count = len(professors)

print(f"Total professors: {total_count}")

# Enhanced garbage detection
def is_garbage_enhanced(name, department, title, email):
    """Enhanced garbage detection with stricter rules."""
    name_lower = name.lower().strip()
    words = name.split()
    
    # Rule 1: Academic/Research fields (usually plural or compound)
    academic_fields = [
        'periodontics', 'endodontics', 'orthodontics', 'prosthodontics',
        'oceanography', 'geography', 'demography', 'epidemiology',
        'immunology', 'neurology', 'cardiology', 'oncology',
        'structures', 'mechanics', 'dynamics', 'thermodynamics',
        'electromagnetics', 'optics', 'acoustics', 'robotics',
        'communities', 'societies', 'populations', 'cultures',
        'degrees', 'programs', 'courses', 'curriculum',
        'reports', 'publications', 'proceedings', 'journals',
        'students', 'faculty', 'staff', 'alumni',
        'laboratories', 'facilities', 'centers', 'institutes',
        'resolution', 'innovation', 'collaboration', 'engagement'
    ]
    
    for field in academic_fields:
        if field in name_lower:
            # Exception: Could be part of a person's research area in their name
            # But if the ENTIRE name is just the field, it's garbage
            if name_lower == field or name_lower.endswith(field):
                return (True, f"Academic field: {field}", 0.9)
            # If it's a short phrase with the field, likely garbage
            if len(words) <= 3 and field in name_lower:
                return (True, f"Short phrase with field: {field}", 0.85)
    
    # Rule 2: Compound nouns (usually not person names)
    # Pattern: "Adjective + Noun" or "Noun + Noun"
    compound_patterns = [
        r'\b(graduate|undergraduate|current|future|prospective)\s+(students?|faculty)\b',
        r'\b(health|dental|medical|nursing)\s+(profession|hygiene|education|innovation)\b',
        r'\b(technical|research|annual|monthly)\s+(reports?|publications?|schedule)\b',
        r'\b(school|department|college|university)\s+(history|news|events?)\b',
        r'\b(teaching|learning|research)\s+(innovation|excellence|awards?)\b',
        r'\b(sustainable|healthy|smart|green)\s+(communities|cities|people|living)\b',
        r'\b(digital|virtual|online|remote)\s+(health|learning|education|hub)\b',
        r'\b(constitutional|supreme|federal|state)\s+(court|law|government)\b',
        r'\b(composite|hybrid|advanced|modern)\s+(structures|materials|systems)\b',
        r'\b(biological|chemical|physical|environmental)\s+(oceanography|engineering|science)\b',
    ]
    
    for pattern in compound_patterns:
        if re.search(pattern, name_lower):
            return (True, f"Compound noun pattern", 0.85)
    
    # Rule 3: Facilities/Buildings/Locations
    facility_keywords = [
        'laboratory', 'laboratories', 'lab', 'labs',
        'center', 'centre', 'hub', 'institute',
        'clinic', 'hospital', 'facility', 'facilities',
        'house', 'hall', 'building', 'room',
        'harbor', 'harbour', 'port', 'station'
    ]
    
    for keyword in facility_keywords:
        if keyword in name_lower:
            # If it's a multi-word phrase with facility keyword, likely garbage
            if len(words) >= 2:
                return (True, f"Facility/Building: {keyword}", 0.8)
    
    # Rule 4: Time references
    time_patterns = [
        r'\b(this|last|next)\s+(month|week|year|quarter|semester)\b',
        r'\b(spring|summer|fall|autumn|winter)\s+\d{4}\b',
        r'\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}\b',
    ]
    
    for pattern in time_patterns:
        if re.search(pattern, name_lower):
            return (True, "Time reference", 0.9)
    
    # Rule 5: Font/Typography names
    font_names = [
        'helvetica', 'arial', 'times', 'courier', 'verdana', 'georgia',
        'trebuchet', 'impact', 'comic', 'palatino', 'garamond',
        'neue', 'condensed', 'bold', 'italic', 'regular', 'light', 'medium'
    ]
    
    for font in font_names:
        if font in name_lower:
            return (True, f"Font name: {font}", 0.95)
    
    # Rule 6: Lacks typical person name structure
    # Real names usually have at least one capital letter in each word
    # Exception: particles like "van", "de", "von"
    if len(words) >= 2:
        particles = {'van', 'de', 'von', 'der', 'den', 'el', 'la', 'le', 'du', 'di', 'da'}
        
        # Check if it looks like a phrase rather than a name
        # Phrases often have lowercase words that aren't particles
        lowercase_words = [w for w in words if w.islower() and w not in particles]
        
        # If more than half the words are lowercase (and not particles), likely a phrase
        if len(lowercase_words) > len(words) / 2:
            return (True, "Phrase-like structure (many lowercase words)", 0.7)
    
    # Rule 7: No email + suspicious name pattern
    if not email:
        # Single word names without email are suspicious
        if len(words) == 1 and len(name) > 15:
            return (True, "Long single word, no email", 0.75)
        
        # Phrases with common garbage words, no email
        garbage_words = ['student', 'faculty', 'staff', 'program', 'course', 'degree', 'report', 'publication']
        if any(word in name_lower for word in garbage_words):
            return (True, "Contains garbage word, no email", 0.8)
    
    # Not garbage
    return (False, "Looks valid", 0.0)

# Identify garbage professors
print(f"\nIdentifying garbage professors...")

garbage_professors = []

for prof in professors:
    is_garbage, reason, confidence = is_garbage_enhanced(
        prof['name'],
        prof['department'],
        prof['title'],
        prof['email']
    )
    
    if is_garbage and confidence >= 0.7:
        garbage_professors.append({
            'id': prof['id'],
            'name': prof['name'],
            'department': prof['department'],
            'reason': reason,
            'confidence': confidence
        })

print(f"Identified {len(garbage_professors)} garbage professors (confidence >= 0.7)")

# Show sample
if garbage_professors:
    print(f"\nSample garbage professors (first 30):")
    for prof in garbage_professors[:30]:
        print(f"  - ID {prof['id']}: {prof['name']} - {prof['reason']} (conf: {prof['confidence']:.2f})")

# Delete garbage professors
if garbage_professors:
    garbage_ids = [prof['id'] for prof in garbage_professors]
    
    # Delete in batches
    BATCH_SIZE = 100
    for i in range(0, len(garbage_ids), BATCH_SIZE):
        batch_ids = garbage_ids[i:i+BATCH_SIZE]
        placeholders = ','.join(['%s'] * len(batch_ids))
        
        # Delete from student_likes
        cursor.execute(f"DELETE FROM student_likes WHERE professor_id IN ({placeholders})", batch_ids)
        conn.commit()
    
    # Delete professors
    for i in range(0, len(garbage_ids), BATCH_SIZE):
        batch_ids = garbage_ids[i:i+BATCH_SIZE]
        placeholders = ','.join(['%s'] * len(batch_ids))
        
        cursor.execute(f"DELETE FROM professors WHERE id IN ({placeholders})", batch_ids)
        conn.commit()
    
    print(f"\n✅ Successfully deleted {len(garbage_professors)} garbage professors")

# Final statistics
cursor.execute("SELECT COUNT(*) as count FROM professors")
final_count = cursor.fetchone()['count']

print(f"\nFinal statistics:")
print(f"Professors before round 2: {total_count}")
print(f"Professors after round 2: {final_count}")
print(f"Professors removed in round 2: {total_count - final_count}")

print(f"\n{'='*80}")
print(f"ROUND 2 COMPLETE")
print(f"{'='*80}\n")

cursor.close()
conn.close()
