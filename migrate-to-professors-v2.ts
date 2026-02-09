#!/usr/bin/env npx tsx
/**
 * 数据迁移脚本 V2：从scraped_projects迁移到professors表
 * 
 * 迁移策略：
 * 1. 读取scraped_projects表中的所有记录
 * 2. 按教授姓名去重（同一教授可能有多个项目）
 * 3. 合并同一教授的tags
 * 4. 查找或创建对应的school记录
 * 5. 插入到professors表（包含schoolId）
 */

import { getDb } from './server/db';
import { scrapedProjects, professors, schools, universities } from './drizzle/schema';
import { eq, and } from 'drizzle-orm';

interface ProfessorData {
  universityName: string;
  majorName: string;
  professorName: string;
  tags: string[];
  sourceUrl?: string;
  labName?: string;
  researchArea?: string;
}

async function migrateData() {
  const db = await getDb();
  console.log('================================================================================');
  console.log('📦 Data Migration V2: scraped_projects → professors (with schoolId)');
  console.log('================================================================================\n');

  // Step 1: 读取所有scraped_projects数据
  console.log('Step 1: Fetching all records from scraped_projects...');
  const allProjects = await db.select().from(scrapedProjects);
  console.log(`  Found ${allProjects.length} records\n`);

  if (allProjects.length === 0) {
    console.log('❌ No data to migrate. Exiting...');
    return;
  }

  // Step 2: 按教授姓名分组并合并tags
  console.log('Step 2: Grouping by professor name and merging tags...');
  const professorMap = new Map<string, ProfessorData>();

  for (const project of allProjects) {
    if (!project.professorName) continue;

    const key = `${project.universityName}|${project.majorName}|${project.professorName}`;
    
    if (professorMap.has(key)) {
      // 合并tags
      const existing = professorMap.get(key)!;
      const newTags = project.tags || [];
      const mergedTags = Array.from(new Set([...existing.tags, ...newTags]));
      existing.tags = mergedTags;
    } else {
      // 新教授
      professorMap.set(key, {
        universityName: project.universityName,
        majorName: project.majorName,
        professorName: project.professorName,
        tags: project.tags || [],
        sourceUrl: project.sourceUrl || undefined,
        labName: project.labName || undefined,
        researchArea: project.researchArea || undefined,
      });
    }
  }

  console.log(`  Grouped into ${professorMap.size} unique professors\n`);

  // Step 3: 清空professors表（重新迁移）
  console.log('Step 3: Clearing professors table...');
  await db.delete(professors);
  console.log('  ✅ Cleared\n');

  // Step 4: 插入到professors表
  console.log('Step 4: Inserting into professors table...');
  let insertedCount = 0;

  for (const [key, prof] of professorMap.entries()) {
    try {
      // 查找或创建university
      let university = await db.select()
        .from(universities)
        .where(eq(universities.name, prof.universityName))
        .limit(1);

      let universityId: number;
      if (university.length === 0) {
        const newUni = await db.insert(universities).values({
          name: prof.universityName,
          country: 'United States',
          website: 'https://www.washington.edu',
        });
        universityId = Number(newUni.insertId);
        console.log(`  ➕ Created university: ${prof.universityName}`);
      } else {
        universityId = university[0].id;
      }

      // 查找或创建school
      let school = await db.select()
        .from(schools)
        .where(
          and(
            eq(schools.universityId, universityId),
            eq(schools.name, prof.majorName)
          )
        )
        .limit(1);

      let schoolId: number;
      if (school.length === 0) {
        const newSchool = await db.insert(schools).values({
          universityId: universityId,
          name: prof.majorName,
          website: 'https://ischool.uw.edu',
        });
        schoolId = Number(newSchool.insertId);
        console.log(`  ➕ Created school: ${prof.majorName}`);
      } else {
        schoolId = school[0].id;
      }

      // 插入教授记录
      await db.insert(professors).values({
        universityName: prof.universityName,
        majorName: prof.majorName,
        schoolId: schoolId,
        name: prof.professorName,
        department: prof.majorName,
        tags: prof.tags,
        sourceUrl: prof.sourceUrl,
        labName: prof.labName,
        researchAreas: prof.researchArea ? JSON.stringify([prof.researchArea]) : null,
        acceptingStudents: true,
        photoUrl: `https://via.placeholder.com/400x400/6366f1/ffffff?text=${encodeURIComponent(prof.professorName.split(' ')[0])}`,
      });

      console.log(`  ✅ Inserted ${prof.professorName} (${prof.tags.length} tags, schoolId: ${schoolId})`);
      insertedCount++;
    } catch (error) {
      console.error(`  ❌ Error inserting ${prof.professorName}:`, error);
    }
  }

  console.log('\n================================================================================');
  console.log('📊 Migration Summary');
  console.log('================================================================================');
  console.log(`Total records in scraped_projects: ${allProjects.length}`);
  console.log(`Unique professors: ${professorMap.size}`);
  console.log(`Inserted: ${insertedCount}`);
  console.log('================================================================================\n');

  // Step 5: 验证迁移结果
  console.log('Step 5: Verifying migration...');
  const professorsCount = await db.select().from(professors);
  console.log(`  Total professors in database: ${professorsCount.length}`);
  
  // 显示前5位教授
  console.log('\n  Sample professors:');
  for (let i = 0; i < Math.min(5, professorsCount.length); i++) {
    const p = professorsCount[i];
    console.log(`    - ${p.name} (${p.tags?.length || 0} tags, schoolId: ${p.schoolId})`);
  }

  console.log('\n✅ Migration completed successfully!');
}

// 执行迁移
migrateData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
