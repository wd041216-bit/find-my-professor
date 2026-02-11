import os
import mysql.connector
from urllib.parse import urlparse

# Parse DATABASE_URL
db_url = os.environ['DATABASE_URL']
parsed = urlparse(db_url)

# Connect to database
conn = mysql.connector.connect(
    host=parsed.hostname,
    port=parsed.port,
    user=parsed.username,
    password=parsed.password,
    database=parsed.path[1:]  # Remove leading /
)

cursor = conn.cursor()

# Show indexes
print("=" * 80)
print("INDEXES ON professors TABLE:")
print("=" * 80)
cursor.execute("SHOW INDEX FROM professors")
for row in cursor.fetchall():
    print(f"Table: {row[0]}, Non_unique: {row[1]}, Key_name: {row[2]}, Column_name: {row[4]}, Index_type: {row[10]}")

# Show create table
print("\n" + "=" * 80)
print("CREATE TABLE STATEMENT:")
print("=" * 80)
cursor.execute("SHOW CREATE TABLE professors")
result = cursor.fetchone()
print(result[1])

cursor.close()
conn.close()
