import { getDb } from '../server/db';
import { professors } from '../drizzle/schema';

async function checkProfessorsData() {
  const db = await getDb();
  if (!db) {
    console.error('Database connection failed');
    return;
  }

  // 查看前5位教授的数据
  const professorsList = await db
    .select()
    .from(professors)
    .limit(5);

  console.log('=== Professors Table Sample ===');
  professorsList.forEach((prof, index) => {
    console.log(`\n[${index + 1}] ID: ${prof.id}`);
    console.log(`Name: ${prof.name}`);
    console.log(`Tags: ${prof.tags || 'NULL'}`);
    console.log(`Research Field: ${prof.researchField || 'NULL'}`);
  });

  // 统计有tags的教授数量
  const allProfs = await db.select().from(professors);
  const profsWithTags = allProfs.filter(p => p.tags && p.tags !== null && p.tags !== '');
  const profsWithResearchField = allProfs.filter(p => p.researchField && p.researchField !== null && p.researchField !== '');

  console.log(`\n=== Statistics ===`);
  console.log(`Total professors: ${allProfs.length}`);
  console.log(`Professors with tags: ${profsWithTags.length}`);
  console.log(`Professors with research_field: ${profsWithResearchField.length}`);

  process.exit(0);
}

checkProfessorsData().catch(console.error);
