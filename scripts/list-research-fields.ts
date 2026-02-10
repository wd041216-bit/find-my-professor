import { getDb } from '../server/db';

async function listResearchFields() {
  const db = await getDb();
  if (!db) {
    console.error('Database connection failed');
    return;
  }

  const result = await db.execute('SELECT field_name, image_url FROM research_field_images ORDER BY field_name');
  const fields = result[0] as any[];

  console.log('=== Research Fields with AI Images (29 total) ===\n');
  fields.forEach((field, index) => {
    console.log(`[${index + 1}] ${field.field_name}`);
    console.log(`    Image: ${field.image_url}\n`);
  });

  process.exit(0);
}

listResearchFields().catch(console.error);
