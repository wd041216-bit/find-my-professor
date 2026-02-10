import { getDb } from '../server/db';

async function analyzeTagMapping() {
  const db = await getDb();
  if (!db) {
    console.error('Database connection failed');
    return;
  }

  const result = await db.execute('SELECT tag, research_field_name FROM research_field_tag_mapping LIMIT 20');
  const mappings = result[0] as any[];

  console.log('=== Tag Mapping Sample (20 out of 414) ===');
  console.log('');
  mappings.forEach((mapping, index) => {
    console.log('[' + (index + 1) + '] "' + mapping.tag + '" -> "' + mapping.research_field_name + '"');
  });

  const testResult = await db.execute("SELECT research_field_name FROM research_field_tag_mapping WHERE tag = 'human-computer interaction'");
  const testMapping = testResult[0] as any[];

  console.log('');
  console.log('=== Test Query ===');
  console.log('Tag: "human-computer interaction"');
  console.log('Research Field: ' + (testMapping.length > 0 ? testMapping[0].research_field_name : 'NOT FOUND'));

  process.exit(0);
}

analyzeTagMapping().catch(console.error);
