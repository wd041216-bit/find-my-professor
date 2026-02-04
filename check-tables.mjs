import mysql from 'mysql2/promise';

const pool = mysql.createPool({ uri: process.env.DATABASE_URL });
const [rows] = await pool.execute('SHOW TABLES');
console.log(JSON.stringify(rows, null, 2));
await pool.end();
