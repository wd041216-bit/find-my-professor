#!/usr/bin/env python3
"""
Use LLM to intelligently identify and remove invalid professor records.
"""

import os
import json
import mysql.connector
from urllib.parse import urlparse
import asyncio
import aiohttp

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
print(f"LLM-POWERED PROFESSOR DATA CLEANUP")
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

# 2. Prepare batches for LLM processing
print(f"\n2. PREPARING BATCHES FOR LLM")
print(f"{'-'*80}")

BATCH_SIZE = 50  # Process 50 professors at a time
batches = [professors[i:i + BATCH_SIZE] for i in range(0, len(professors), BATCH_SIZE)]

print(f"Total batches: {len(batches)}")
print(f"Batch size: {BATCH_SIZE}")

# 3. Process each batch with LLM
print(f"\n3. PROCESSING WITH LLM")
print(f"{'-'*80}")

async def check_professor_validity(session, professor):
    """
    Use LLM to check if a professor record is valid.
    Returns: (professor_id, is_valid, reason)
    """
    prompt = f"""You are a data quality expert. Determine if the following record represents a REAL PROFESSOR or INVALID DATA.

Record:
- Name: {professor['name']}
- Department: {professor['department']}
- Title: {professor['title']}
- Email: {professor['email']}
- Bio: {professor['bio'][:200] if professor['bio'] else 'N/A'}...
- Research Areas: {professor['research_areas'][:200] if professor['research_areas'] else 'N/A'}...

Invalid data examples:
- Website UI elements (e.g., "Search Button", "Mobile Menu")
- CSS/Font names (e.g., "Noto Sans", "Font Awesome")
- Job titles without names (e.g., "Department Chair", "Assistant Dean")
- Research fields (e.g., "Fluid Mechanics", "Structural Engineering")
- Website sections (e.g., "Fast Facts", "In Memoriam")
- Facilities/Buildings (e.g., "Kirsten Wind Tunnel")
- Organizations (e.g., "Climate Impacts Group")
- Software/Tools (e.g., "Google Analytics")
- Generic phrases (e.g., "Funding Opportunities", "Student Engagement")

Valid professor examples:
- Has a person's name (first + last name, or full name with initials)
- Has an academic title (Professor, Associate Professor, etc.)
- Has an email address
- Has research areas or bio

Respond in JSON format:
{{
  "is_valid": true/false,
  "confidence": 0.0-1.0,
  "reason": "brief explanation"
}}"""

    try:
        async with session.post(
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
            timeout=aiohttp.ClientTimeout(total=30)
        ) as response:
            if response.status == 200:
                data = await response.json()
                result = json.loads(data['choices'][0]['message']['content'])
                return (professor['id'], result['is_valid'], result['reason'], result.get('confidence', 1.0))
            else:
                print(f"  ❌ API error for professor {professor['id']}: {response.status}")
                return (professor['id'], True, "API error - assume valid", 0.0)  # Assume valid on error
    except Exception as e:
        print(f"  ❌ Exception for professor {professor['id']}: {str(e)}")
        return (professor['id'], True, "Exception - assume valid", 0.0)  # Assume valid on error

async def process_batch(batch, batch_num):
    """Process a batch of professors with LLM."""
    print(f"\nProcessing batch {batch_num}/{len(batches)} ({len(batch)} professors)...")
    
    async with aiohttp.ClientSession() as session:
        tasks = [check_professor_validity(session, prof) for prof in batch]
        results = await asyncio.gather(*tasks)
    
    valid_count = sum(1 for _, is_valid, _, _ in results if is_valid)
    invalid_count = len(results) - valid_count
    
    print(f"  ✅ Valid: {valid_count}")
    print(f"  ❌ Invalid: {invalid_count}")
    
    return results

# Process all batches
async def process_all_batches():
    all_results = []
    for i, batch in enumerate(batches, 1):
        batch_results = await process_batch(batch, i)
        all_results.extend(batch_results)
        
        # Small delay between batches to avoid rate limiting
        if i < len(batches):
            await asyncio.sleep(1)
    return all_results

all_results = asyncio.run(process_all_batches())

# 4. Analyze results
print(f"\n4. ANALYSIS RESULTS")
print(f"{'-'*80}")

valid_professors = [(pid, reason, conf) for pid, is_valid, reason, conf in all_results if is_valid]
invalid_professors = [(pid, reason, conf) for pid, is_valid, reason, conf in all_results if not is_valid]

print(f"Total professors analyzed: {len(all_results)}")
print(f"Valid professors: {len(valid_professors)} ({len(valid_professors)/len(all_results)*100:.1f}%)")
print(f"Invalid professors: {len(invalid_professors)} ({len(invalid_professors)/len(all_results)*100:.1f}%)")

# Show sample invalid professors
if invalid_professors:
    print(f"\nSample invalid professors (first 10):")
    for pid, reason, conf in invalid_professors[:10]:
        # Get professor name
        prof = next(p for p in professors if p['id'] == pid)
        print(f"  - ID {pid}: {prof['name']} - {reason} (confidence: {conf:.2f})")

# 5. Delete invalid professors
print(f"\n5. DELETING INVALID PROFESSORS")
print(f"{'-'*80}")

if invalid_professors:
    # First, delete related records in student_likes table
    invalid_ids = [pid for pid, _, _ in invalid_professors]
    
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

# 6. Final statistics
print(f"\n6. FINAL STATISTICS")
print(f"{'-'*80}")

cursor.execute("SELECT COUNT(*) as count FROM professors")
final_count = cursor.fetchone()['count']

print(f"Professors before cleanup: {total_count}")
print(f"Professors after cleanup: {final_count}")
print(f"Professors removed: {total_count - final_count}")
print(f"Data quality improvement: {(total_count - final_count) / total_count * 100:.1f}% reduction in invalid data")

print(f"\n{'='*80}")
print(f"CLEANUP COMPLETE")
print(f"{'='*80}\n")

cursor.close()
conn.close()
