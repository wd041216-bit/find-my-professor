#!/usr/bin/env python3
"""
Use LLM to intelligently identify and remove invalid professor records.
Synchronous version to avoid rate limiting.
"""

import os
import json
import mysql.connector
from urllib.parse import urlparse
import requests
import time

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

# Get LLM API credentials
LLM_API_URL = os.environ.get('BUILT_IN_FORGE_API_URL')
LLM_API_KEY = os.environ.get('BUILT_IN_FORGE_API_KEY')

print(f"\n{'='*80}")
print(f"LLM-POWERED PROFESSOR DATA CLEANUP (SYNC VERSION)")
print(f"{'='*80}\n")

# 1. Export all professors to JSON
print("1. EXPORTING PROFESSOR DATA")
print(f"{'-'*80}")

cursor.execute("""
    SELECT id, name, department, title, email, bio, research_areas, tags
    FROM professors
    ORDER BY id
""")

professors = cursor.fetchall()
total_count = len(professors)

print(f"Total professors: {total_count}")

# 2. Process professors one by one with LLM
print(f"\n2. PROCESSING WITH LLM (Sequential)")
print(f"{'-'*80}")
print(f"Estimated time: {total_count * 1.5 / 60:.1f} minutes")
print(f"Estimated cost: ${total_count * 0.00001:.4f}")

def check_professor_validity(professor):
    """
    Use LLM to check if a professor record is valid.
    Returns: (is_valid, reason, confidence)
    """
    prompt = f"""You are a data quality expert. Determine if the following record represents a REAL PROFESSOR or INVALID DATA.

Record:
- Name: {professor['name']}
- Department: {professor['department'] or 'N/A'}
- Title: {professor['title'] or 'N/A'}
- Email: {professor['email'] or 'N/A'}

Invalid data examples:
- Website UI elements (e.g., "Search Button", "Mobile Menu", "Toggle Main Menu")
- CSS/Font names (e.g., "Noto Sans", "Font Awesome", "Open Sans")
- Job titles WITHOUT person names (e.g., "Department Chair", "Assistant Dean", "Finance Analyst")
- Research fields (e.g., "Fluid Mechanics", "Structural Engineering", "Political Science")
- Website sections (e.g., "Fast Facts", "In Memoriam", "Seminar Series")
- Facilities/Buildings (e.g., "Kirsten Wind Tunnel", "Harborview Medical Center")
- Organizations (e.g., "Climate Impacts Group", "Gates Public Service Law Program")
- Software/Tools (e.g., "Google Analytics", "Scroll Event")
- Generic phrases (e.g., "Funding Opportunities", "Student Engagement Coordinator")
- Project/Program names (e.g., "Predoctoral Dental Teaching Clinic", "Wellness Programs")

Valid professor criteria:
- Has a person's name (first + last name, or full name with initials)
- Name looks like a human name (not a phrase or concept)
- Optionally has an academic title (Professor, Associate Professor, etc.)
- Optionally has an email address

Respond in JSON format:
{{
  "is_valid": true/false,
  "confidence": 0.0-1.0,
  "reason": "brief explanation (max 50 chars)"
}}"""

    try:
        response = requests.post(
            f"{LLM_API_URL}/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {LLM_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are a data quality expert. Always respond in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.1
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            result = json.loads(data['choices'][0]['message']['content'])
            return (result['is_valid'], result['reason'], result.get('confidence', 1.0))
        else:
            print(f"  ❌ API error {response.status_code}: {response.text[:100]}")
            return (True, "API error - assume valid", 0.0)  # Assume valid on error
    except Exception as e:
        print(f"  ❌ Exception: {str(e)[:100]}")
        return (True, "Exception - assume valid", 0.0)  # Assume valid on error

# Process all professors
all_results = []
invalid_professors = []

for i, prof in enumerate(professors, 1):
    is_valid, reason, confidence = check_professor_validity(prof)
    all_results.append((prof['id'], is_valid, reason, confidence))
    
    if not is_valid:
        invalid_professors.append((prof['id'], prof['name'], reason, confidence))
        print(f"  [{i}/{total_count}] ❌ INVALID: {prof['name']} - {reason} (conf: {confidence:.2f})")
    else:
        if i % 50 == 0:
            print(f"  [{i}/{total_count}] Processed... (valid so far)")
    
    # Small delay to avoid rate limiting
    time.sleep(0.5)

# 3. Analyze results
print(f"\n3. ANALYSIS RESULTS")
print(f"{'-'*80}")

valid_count = sum(1 for _, is_valid, _, _ in all_results if is_valid)
invalid_count = len(all_results) - valid_count

print(f"Total professors analyzed: {len(all_results)}")
print(f"Valid professors: {valid_count} ({valid_count/len(all_results)*100:.1f}%)")
print(f"Invalid professors: {invalid_count} ({invalid_count/len(all_results)*100:.1f}%)")

# Show all invalid professors
if invalid_professors:
    print(f"\nAll invalid professors:")
    for pid, name, reason, conf in invalid_professors:
        print(f"  - ID {pid}: {name} - {reason} (confidence: {conf:.2f})")

# 4. Delete invalid professors
print(f"\n4. DELETING INVALID PROFESSORS")
print(f"{'-'*80}")

if invalid_professors:
    # First, delete related records in student_likes table
    invalid_ids = [pid for pid, _, _, _ in invalid_professors]
    
    # Delete in batches to avoid SQL query size limits
    BATCH_SIZE = 100
    for i in range(0, len(invalid_ids), BATCH_SIZE):
        batch_ids = invalid_ids[i:i+BATCH_SIZE]
        placeholders = ','.join(['%s'] * len(batch_ids))
        
        # Delete from student_likes
        cursor.execute(f"DELETE FROM student_likes WHERE professor_id IN ({placeholders})", batch_ids)
        conn.commit()
        print(f"  Deleted student_likes for professors {i+1}-{min(i+BATCH_SIZE, len(invalid_ids))}")
    
    # Now delete professors
    for i in range(0, len(invalid_ids), BATCH_SIZE):
        batch_ids = invalid_ids[i:i+BATCH_SIZE]
        placeholders = ','.join(['%s'] * len(batch_ids))
        
        cursor.execute(f"DELETE FROM professors WHERE id IN ({placeholders})", batch_ids)
        conn.commit()
        print(f"  Deleted professors {i+1}-{min(i+BATCH_SIZE, len(invalid_ids))}")
    
    print(f"\n✅ Successfully deleted {len(invalid_professors)} invalid professors")
else:
    print("No invalid professors found!")

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
