#!/usr/bin/env npx tsx
/**
 * 数据迁移脚本：从scraped_projects迁移到professors表
 * 
 * 迁移策略：
 * 1. 读取scraped_projects表中的所有记录
 * 2. 按教授姓名去重（同一教授可能有多个项目）
 * 3. 合并同一教授的tags
 * 4. 插入到professors表
 */

import { getDb } from './server/db';
import { scrapedProjects, professors } from './drizzle/schema';
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
  console.log('📦 Data Migration: scraped_projects → professors');
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

  // Step 3: 插入到professors表
  console.log('Step 3: Inserting into professors table...');
  let insertedCount = 0;
  let skippedCount = 0;

  for (const [key, prof] of professorMap.entries()) {
    try {
      // 检查是否已存在
      const existing = await db.select()
        .from(professors)
        .where(
          and(
            eq(professors.name, prof.professorName),
            eq(professors.universityName, prof.universityName),
            eq(professors.majorName, prof.majorName)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        console.log(`  ⚠️  Skipping ${prof.professorName} (already exists)`);
        skippedCount++;
        continue;
      }

      // 插入新记录
      await db.insert(professors).values({
        universityName: prof.universityName,
        majorName: prof.majorName,
        name: prof.professorName,
        department: prof.majorName, // 使用major作为department
        tags: prof.tags,
        sourceUrl: prof.sourceUrl,
        labName: prof.labName,
        researchAreas: prof.researchArea ? JSON.stringify([prof.researchArea]) : null,
        acceptingStudents: true,
      });

      console.log(`  ✅ Inserted ${prof.professorName} (${prof.tags.length} tags)`);
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
  console.log(`Skipped (already exists): ${skippedCount}`);
  console.log('================================================================================\n');

  // Step 4: 验证迁移结果
  console.log('Step 4: Verifying migration...');
  const professorsCount = await db.select().from(professors);
  console.log(`  Total professors in database: ${professorsCount.length}\n`);

  console.log('✅ Migration completed successfully!');
}

// 执行迁移
migrateData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
