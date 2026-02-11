import mysql from 'mysql2/promise';
import fs from 'fs';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await conn.execute(`
SELECT DISTINCT p.research_field 
FROM professors p
LEFT JOIN research_field_images r ON p.research_field = r.field_name
WHERE p.research_field IS NOT NULL 
  AND p.research_field != ''
  AND r.field_name IS NULL
ORDER BY p.research_field
`);

const missingFields = rows.map(row => row.research_field);

console.log('Missing research fields:');
missingFields.forEach(field => console.log(`  - ${field}`));

fs.writeFileSync('/home/ubuntu/missing_fields.json', JSON.stringify(missingFields, null, 2));

console.log(`\nTotal missing: ${missingFields.length}`);

await conn.end();
process.exit(0);
