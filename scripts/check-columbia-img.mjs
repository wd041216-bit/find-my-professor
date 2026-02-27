import mysql from 'mysql2/promise';
const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute("SELECT university_name, research_field_name, image_url FROM university_field_images WHERE university_name LIKE '%Columbia%' LIMIT 10");
console.log(JSON.stringify(rows, null, 2));
await conn.end();
