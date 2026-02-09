import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.js';
import * as fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

// Read professors data
const professorsData = JSON.parse(fs.readFileSync('/home/ubuntu/professors_data.json', 'utf-8'));

// Get UW Information School ID
const schools = await db.select().from(schema.schools).where(eq(schema.schools.name, 'Information School'));
if (schools.length === 0) {
  throw new Error('Information School not found in database');
}
const schoolId = schools[0].id;

console.log(`Found Information School with ID: ${schoolId}`);
console.log(`Inserting ${professorsData.length} professors...`);

// Insert professors
for (const prof of professorsData) {
  const result = await db.insert(schema.professors).values({
    name: prof.name,
    email: prof.email,
    title: prof.title,
    schoolId: schoolId,
    researchInterests: prof.research_interests,
    bio: prof.bio,
    photoUrl: `https://via.placeholder.com/400x400/6366f1/ffffff?text=${encodeURIComponent(prof.name.split(' ')[0])}`,
    websiteUrl: `https://ischool.uw.edu/people/faculty/profile/${prof.email.split('@')[0]}`
  });
  
  console.log(`✅ Inserted: ${prof.name}`);
}

console.log('\n✨ All professors inserted successfully!');

await connection.end();
