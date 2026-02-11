import mysql from 'mysql2/promise';
import fs from 'fs';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await conn.execute(`
SELECT field_name FROM research_field_images ORDER BY field_name
`);

const standardFields = rows.map(row => row.field_name);

console.log('Standard research fields (33 total):');
standardFields.forEach((field, idx) => console.log(`${idx + 1}. ${field}`));

fs.writeFileSync('/home/ubuntu/standard_fields.json', JSON.stringify(standardFields, null, 2));

console.log(`\nSaved to /home/ubuntu/standard_fields.json`);

await conn.end();
process.exit(0);
