import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.query('DESCRIBE university_field_images');
console.log('university_field_images表结构:');
console.log(rows);
await conn.end();
