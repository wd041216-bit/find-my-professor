/**
 * Tags词典服务
 * 管理基于大学+专业的研究tags词典
 * 确保学生和教授使用统一的tags体系
 */

import { getDb } from "../db";
import { researchTagsDictionary, scrapedProjects } from "../../drizzle/schema";
import { and, eq, sql } from "drizzle-orm";

/**
 * 从scraped_projects表中提取所有tags并填充词典
 * @param universityName 大学名称
 * @param majorName 专业名称
 * @returns 填充的tags数量
 */
export async function buildTagsDictionary(
  universityName: string,
  majorName: string
): Promise<number> {
  console.log(`[TagsDictionary] Building dictionary for ${universityName} - ${majorName}...`);
  
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // 1. 获取该大学+专业的所有教授tags
  const professors = await db
    .select()
    .from(scrapedProjects)
    .where(
      and(
        eq(scrapedProjects.universityName, universityName),
        eq(scrapedProjects.majorName, majorName)
      )
    );

  console.log(`[TagsDictionary] Found ${professors.length} professors`);

  // 2. 统计所有tags的频率
  const tagsFrequency = new Map<string, number>();
  
  for (const prof of professors) {
    if (prof.tags && Array.isArray(prof.tags)) {
      for (const tag of prof.tags) {
        tagsFrequency.set(tag, (tagsFrequency.get(tag) || 0) + 1);
      }
    }
  }

  console.log(`[TagsDictionary] Found ${tagsFrequency.size} unique tags`);

  // 3. 清空该大学+专业的旧词典
  await db
    .delete(researchTagsDictionary)
    .where(
      and(
        eq(researchTagsDictionary.universityName, universityName),
        eq(researchTagsDictionary.majorName, majorName)
      )
    );

  // 4. 插入新词典
  const entries = Array.from(tagsFrequency.entries()).map(([tag, frequency]) => ({
    universityName,
    majorName,
    tag,
    frequency,
  }));

  if (entries.length > 0) {
    await db.insert(researchTagsDictionary).values(entries);
  }

  console.log(`[TagsDictionary] Dictionary built with ${entries.length} tags`);
  return entries.length;
}

/**
 * 获取指定大学+专业的所有可用tags
 * @param universityName 大学名称
 * @param majorName 专业名称
 * @returns tags数组，按频率降序排列
 */
export async function getAvailableTags(
  universityName: string,
  majorName: string
): Promise<string[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const tags = await db
    .select()
    .from(researchTagsDictionary)
    .where(
      and(
        eq(researchTagsDictionary.universityName, universityName),
        eq(researchTagsDictionary.majorName, majorName)
      )
    )
    .orderBy(sql`${researchTagsDictionary.frequency} DESC`);

  return tags.map(t => t.tag);
}

/**
 * 检查词典是否已建立
 * @param universityName 大学名称
 * @param majorName 专业名称
 * @returns 是否已建立词典
 */
export async function hasDictionary(
  universityName: string,
  majorName: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    return false;
  }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(researchTagsDictionary)
    .where(
      and(
        eq(researchTagsDictionary.universityName, universityName),
        eq(researchTagsDictionary.majorName, majorName)
      )
    );

  return (result[0]?.count || 0) > 0;
}

/**
 * 获取词典统计信息
 * @param universityName 大学名称
 * @param majorName 专业名称
 */
export async function getDictionaryStats(
  universityName: string,
  majorName: string
): Promise<{
  totalTags: number;
  avgFrequency: number;
  topTags: Array<{ tag: string; frequency: number }>;
}> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const tags = await db
    .select()
    .from(researchTagsDictionary)
    .where(
      and(
        eq(researchTagsDictionary.universityName, universityName),
        eq(researchTagsDictionary.majorName, majorName)
      )
    )
    .orderBy(sql`${researchTagsDictionary.frequency} DESC`);

  const totalTags = tags.length;
  const avgFrequency = totalTags > 0
    ? tags.reduce((sum, t) => sum + (t.frequency || 0), 0) / totalTags
    : 0;
  const topTags = tags.slice(0, 10).map(t => ({
    tag: t.tag,
    frequency: t.frequency || 0,
  }));

  return { totalTags, avgFrequency, topTags };
}
