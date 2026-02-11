#!/usr/bin/env python3
"""
Rule-based cleanup of invalid professor records.
Uses pattern matching and heuristics to identify garbage data.
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
print(f"RULE-BASED PROFESSOR DATA CLEANUP")
print(f"{'='*80}\n")

# 1. Load all professors
print("1. LOADING PROFESSOR DATA")
print(f"{'-'*80}")

cursor.execute("""
    SELECT id, name, department, title, email, bio
    FROM professors
    ORDER BY id
""")

professors = cursor.fetchall()
total_count = len(professors)

print(f"Total professors: {total_count}")

# 2. Define garbage detection rules
print(f"\n2. DEFINING GARBAGE DETECTION RULES")
print(f"{'-'*80}")

# Common garbage keywords (case-insensitive)
GARBAGE_KEYWORDS = {
    # UI elements
    'search', 'menu', 'button', 'toggle', 'icon', 'link', 'navigation', 'breadcrumb',
    'login', 'logout', 'subscribe', 'contact', 'about', 'home', 'back', 'next',
    'view', 'show', 'hide', 'open', 'close', 'expand', 'collapse', 'scroll',
    
    # CSS/Fonts
    'sans', 'serif', 'font', 'awesome', 'noto', 'condensed', 'encode', 'liberation',
    
    # Job titles WITHOUT person names
    'chair', 'dean', 'director', 'coordinator', 'assistant', 'associate',
    'analyst', 'specialist', 'manager', 'officer', 'administrator',
    
    # Research fields (when standalone)
    'engineering', 'science', 'law', 'medicine', 'business', 'economics',
    'physics', 'chemistry', 'biology', 'mathematics', 'statistics',
    
    # Projects/Institutions
    'program', 'center', 'institute', 'laboratory', 'clinic', 'department',
    'school', 'college', 'faculty', 'division', 'unit', 'office',
    
    # Events/Activities
    'seminar', 'conference', 'workshop', 'symposium', 'lecture', 'colloquium',
    'ceremony', 'event', 'series', 'session',
    
    # Website sections
    'directory', 'listing', 'archive', 'calendar', 'schedule', 'agenda',
    'news', 'updates', 'announcements', 'publications', 'resources',
    
    # Miscellaneous
    'opportunities', 'information', 'details', 'overview', 'summary',
    'description', 'profile', 'biography', 'curriculum', 'vitae',
    'research', 'teaching', 'courses', 'projects', 'grants', 'funding'
}

# Phrases that indicate garbage data
GARBAGE_PHRASES = [
    'faculty and staff',
    'faculty directory',
    'faculty list',
    'faculty members',
    'staff directory',
    'staff list',
    'our faculty',
    'our staff',
    'our team',
    'meet our',
    'meet the',
    'the team',
    'the faculty',
    'the staff',
    'in memoriam',
    'emeritus faculty',
    'visiting faculty',
    'adjunct faculty',
    'affiliate faculty',
    'clinical faculty',
    'research faculty',
    'teaching faculty',
    'fast facts',
    'quick links',
    'main menu',
    'user menu',
    'mobile menu',
    'skip to',
    'go to',
    'back to',
    'return to',
    'click here',
    'learn more',
    'read more',
    'see more',
    'view all',
    'show all',
    'hide all',
]

def is_garbage_name(name, department, title, email):
    """
    Determine if a professor name is likely garbage data.
    Returns: (is_garbage, reason, confidence)
    """
    name_lower = name.lower().strip()
    
    # Rule 1: Too short (single word)
    if len(name.split()) == 1:
        # Exception: Could be a mononym (rare but possible)
        if len(name) < 4:
            return (True, "Too short (single word, <4 chars)", 0.9)
        # Check if it's a common garbage keyword
        if name_lower in GARBAGE_KEYWORDS:
            return (True, f"Single garbage keyword: {name}", 0.95)
    
    # Rule 2: Too long (likely a sentence or description)
    if len(name) > 60:
        return (True, "Too long (>60 chars)", 0.85)
    
    # Rule 3: All uppercase (UI elements often use this)
    if name.isupper() and len(name) > 3:
        return (True, "All uppercase", 0.8)
    
    # Rule 4: Contains numbers (except Roman numerals like "III")
    if re.search(r'\d', name) and not re.search(r'\b(II|III|IV|Jr\.?|Sr\.?)\b', name):
        return (True, "Contains numbers", 0.75)
    
    # Rule 5: Contains garbage phrases
    for phrase in GARBAGE_PHRASES:
        if phrase in name_lower:
            return (True, f"Contains phrase: '{phrase}'", 0.9)
    
    # Rule 6: Starts with common garbage words
    first_word = name.split()[0].lower()
    if first_word in {'the', 'a', 'an', 'our', 'your', 'all', 'new', 'top', 'best', 'main', 'home'}:
        return (True, f"Starts with article/determiner: '{first_word}'", 0.85)
    
    # Rule 7: Contains "and" (likely a phrase like "Faculty and Staff")
    if ' and ' in name_lower and len(name.split()) <= 4:
        return (True, "Contains 'and' (likely a phrase)", 0.8)
    
    # Rule 8: Name is same as department (likely a category)
    if department and name_lower == department.lower():
        return (True, "Name same as department", 0.9)
    
    # Rule 9: Name contains multiple garbage keywords
    garbage_count = sum(1 for keyword in GARBAGE_KEYWORDS if keyword in name_lower)
    if garbage_count >= 2:
        return (True, f"Contains {garbage_count} garbage keywords", 0.85)
    
    # Rule 10: Job title without person name (high confidence if no email)
    job_titles = ['chair', 'dean', 'director', 'coordinator', 'analyst', 'specialist', 'manager']
    if any(title_word in name_lower for title_word in job_titles):
        if not email:
            return (True, "Job title without email", 0.8)
        if len(name.split()) <= 2:
            return (True, "Likely job title (short name)", 0.7)
    
    # Rule 11: Research field as name (if matches department)
    research_fields = [
        'engineering', 'science', 'law', 'medicine', 'business', 'economics',
        'physics', 'chemistry', 'biology', 'mathematics', 'statistics', 'history',
        'philosophy', 'psychology', 'sociology', 'anthropology', 'geography'
    ]
    if name_lower in research_fields:
        return (True, "Research field as name", 0.9)
    
    # Rule 12: CSS/Font names
    if any(font in name_lower for font in ['sans', 'serif', 'font', 'awesome', 'noto', 'condensed', 'encode']):
        return (True, "CSS/Font name", 0.95)
    
    # Rule 13: Website functionality
    web_functions = ['search', 'login', 'logout', 'subscribe', 'contact', 'menu', 'navigation']
    if name_lower in web_functions:
        return (True, "Website function", 0.95)
    
    # Rule 14: Lacks typical name structure (no capital letters in middle)
    # Real names usually have: "FirstName LastName" or "FirstName MiddleName LastName"
    words = name.split()
    if len(words) >= 2:
        # Check if all words start with capital letter (typical for names)
        if not all(word[0].isupper() for word in words if len(word) > 0):
            # Exception: particles like "van", "de", "von" are lowercase
            particles = {'van', 'de', 'von', 'der', 'den', 'el', 'la', 'le', 'du'}
            non_capital_words = [w for w in words if not w[0].isupper() and w.lower() not in particles]
            if len(non_capital_words) > 0:
                return (True, "Inconsistent capitalization", 0.6)
    
    # Not garbage
    return (False, "Looks like a valid name", 0.0)

# 3. Identify garbage professors
print(f"\n3. IDENTIFYING GARBAGE PROFESSORS")
print(f"{'-'*80}")

garbage_professors = []

for prof in professors:
    is_garbage, reason, confidence = is_garbage_name(
        prof['name'],
        prof['department'],
        prof['title'],
        prof['email']
    )
    
    if is_garbage and confidence >= 0.7:  # Only high-confidence garbage
        garbage_professors.append({
            'id': prof['id'],
            'name': prof['name'],
            'department': prof['department'],
            'reason': reason,
            'confidence': confidence
        })

print(f"Identified {len(garbage_professors)} garbage professors (confidence >= 0.7)")

# Show sample garbage professors
if garbage_professors:
    print(f"\nSample garbage professors (first 20):")
    for prof in garbage_professors[:20]:
        print(f"  - ID {prof['id']}: {prof['name']} - {prof['reason']} (conf: {prof['confidence']:.2f})")

# 4. Delete garbage professors
print(f"\n4. DELETING GARBAGE PROFESSORS")
print(f"{'-'*80}")

if garbage_professors:
    # First, delete related records in student_likes table
    garbage_ids = [prof['id'] for prof in garbage_professors]
    
    # Delete in batches to avoid SQL query size limits
    BATCH_SIZE = 100
    for i in range(0, len(garbage_ids), BATCH_SIZE):
        batch_ids = garbage_ids[i:i+BATCH_SIZE]
        placeholders = ','.join(['%s'] * len(batch_ids))
        
        # Delete from student_likes
        cursor.execute(f"DELETE FROM student_likes WHERE professor_id IN ({placeholders})", batch_ids)
        conn.commit()
        print(f"  Deleted student_likes for professors {i+1}-{min(i+BATCH_SIZE, len(garbage_ids))}")
    
    # Now delete professors
    for i in range(0, len(garbage_ids), BATCH_SIZE):
        batch_ids = garbage_ids[i:i+BATCH_SIZE]
        placeholders = ','.join(['%s'] * len(batch_ids))
        
        cursor.execute(f"DELETE FROM professors WHERE id IN ({placeholders})", batch_ids)
        conn.commit()
        print(f"  Deleted professors {i+1}-{min(i+BATCH_SIZE, len(garbage_ids))}")
    
    print(f"\n✅ Successfully deleted {len(garbage_professors)} garbage professors")
else:
    print("No garbage professors found!")

# 5. Final statistics
print(f"\n5. FINAL STATISTICS")
print(f"{'-'*80}")

cursor.execute("SELECT COUNT(*) as count FROM professors")
final_count = cursor.fetchone()['count']

print(f"Professors before cleanup: {total_count}")
print(f"Professors after cleanup: {final_count}")
print(f"Professors removed: {total_count - final_count}")
if total_count > final_count:
    print(f"Data quality improvement: {(total_count - final_count) / total_count * 100:.1f}% reduction in invalid data")

print(f"\n{'='*80}")
print(f"CLEANUP COMPLETE")
print(f"{'='*80}\n")

cursor.close()
conn.close()
