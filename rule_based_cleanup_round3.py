#!/usr/bin/env python3
"""
Round 3: Target newly discovered garbage patterns.
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
print(f"ROUND 3: TARGETING NEW GARBAGE PATTERNS")
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

# Round 3 garbage detection
def is_garbage_round3(name, department, title, email):
    """Round 3: Target specific new patterns."""
    name_lower = name.lower().strip()
    words = name.split()
    
    # Rule 1: Specific garbage phrases
    specific_garbage = [
        'display events', 'distinguished lectures', 'required disclosures',
        'technical issues', 'be boundless', 'what we offer', 'media guide',
        'air quality', 'civil society', 'corporate governance',
        'class action', 'data science', 'systems engineering',
        'maxillofacial surgery', 'northwest radar', 'northwest satellite',
        'planning accreditation'
    ]
    
    for phrase in specific_garbage:
        if phrase in name_lower:
            return (True, f"Specific garbage phrase: {phrase}", 0.9)
    
    # Rule 2: Library/Building names
    if 'library' in name_lower or 'libraries' in name_lower:
        return (True, "Library name", 0.9)
    
    # Rule 3: Equipment/Technology names
    tech_keywords = ['radar', 'satellite', 'sensor', 'detector', 'scanner', 'monitor']
    for keyword in tech_keywords:
        if keyword in name_lower and len(words) <= 3:
            return (True, f"Equipment/Technology: {keyword}", 0.85)
    
    # Rule 4: Slogans/Mottos (often 2-3 words, no typical name structure)
    if len(words) == 2 or len(words) == 3:
        # Check if it's a verb phrase (starts with verb)
        common_verbs = ['be', 'get', 'make', 'do', 'have', 'see', 'go', 'come', 'take', 'give',
                       'find', 'think', 'tell', 'become', 'leave', 'feel', 'put', 'bring', 'begin',
                       'keep', 'hold', 'write', 'stand', 'hear', 'let', 'mean', 'set', 'meet',
                       'run', 'pay', 'sit', 'speak', 'lie', 'lead', 'read', 'grow', 'lose', 'fall',
                       'send', 'build', 'understand', 'draw', 'break', 'spend', 'cut', 'rise', 'drive',
                       'buy', 'wear', 'choose', 'seek', 'throw', 'catch', 'deal', 'win', 'forget',
                       'hang', 'strike', 'shake', 'climb', 'hide', 'bite', 'blow', 'ride', 'split']
        
        first_word = words[0].lower()
        if first_word in common_verbs:
            return (True, "Verb phrase (likely slogan)", 0.8)
    
    # Rule 5: Question phrases
    question_words = ['what', 'who', 'where', 'when', 'why', 'how', 'which']
    if words[0].lower() in question_words:
        return (True, "Question phrase", 0.9)
    
    # Rule 6: Medical/Dental specialties (ending in specific suffixes)
    medical_suffixes = ['surgery', 'medicine', 'therapy', 'treatment', 'care', 'health']
    for suffix in medical_suffixes:
        if name_lower.endswith(suffix) and len(words) <= 3:
            # Exception: Could be part of a person's title
            # But if it's JUST the specialty, it's garbage
            if not any(word[0].isupper() and len(word) > 2 for word in words[:-1]):
                return (True, f"Medical/Dental specialty: {suffix}", 0.85)
    
    # Rule 7: Academic disciplines (when standalone)
    disciplines = [
        'data science', 'computer science', 'information science',
        'systems engineering', 'software engineering', 'mechanical engineering',
        'electrical engineering', 'civil engineering', 'bioengineering',
        'political science', 'social science', 'environmental science',
        'materials science', 'cognitive science', 'library science'
    ]
    
    for discipline in disciplines:
        if name_lower == discipline:
            return (True, f"Academic discipline: {discipline}", 0.95)
    
    # Rule 8: Governance/Legal/Business terms
    governance_terms = [
        'governance', 'litigation', 'regulation', 'compliance', 'accreditation',
        'certification', 'disclosure', 'transparency', 'accountability'
    ]
    
    for term in governance_terms:
        if term in name_lower and len(words) <= 3:
            return (True, f"Governance/Legal term: {term}", 0.85)
    
    # Rule 9: Incomplete names (too short last name)
    if len(words) == 2:
        # Check if last word is suspiciously short (< 3 chars)
        last_word = words[1]
        if len(last_word) <= 2 and not last_word.endswith('.'):
            return (True, f"Incomplete name (short last name: {last_word})", 0.75)
    
    # Rule 10: Directional/Geographic descriptors + Noun
    if len(words) <= 3:
        directional = ['north', 'south', 'east', 'west', 'northwest', 'northeast', 'southwest', 'southeast',
                      'northern', 'southern', 'eastern', 'western', 'central', 'upper', 'lower']
        
        first_word = words[0].lower()
        if first_word in directional:
            # If it's "Northwest Radar" or "Central Library", likely garbage
            return (True, f"Directional + Noun pattern", 0.8)
    
    # Not garbage
    return (False, "Looks valid", 0.0)

# Identify garbage professors
print(f"\nIdentifying garbage professors...")

garbage_professors = []

for prof in professors:
    is_garbage, reason, confidence = is_garbage_round3(
        prof['name'],
        prof['department'],
        prof['title'],
        prof['email']
    )
    
    if is_garbage and confidence >= 0.75:
        garbage_professors.append({
            'id': prof['id'],
            'name': prof['name'],
            'department': prof['department'],
            'reason': reason,
            'confidence': confidence
        })

print(f"Identified {len(garbage_professors)} garbage professors (confidence >= 0.75)")

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
print(f"Professors before round 3: {total_count}")
print(f"Professors after round 3: {final_count}")
print(f"Professors removed in round 3: {total_count - final_count}")

print(f"\n{'='*80}")
print(f"ROUND 3 COMPLETE")
print(f"{'='*80}\n")

cursor.close()
conn.close()
