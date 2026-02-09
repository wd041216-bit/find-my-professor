import { getDb } from '../db';
import { professors } from '../../drizzle/schema';
import { and, eq, sql } from 'drizzle-orm';

/**
 * 教授匹配结果类型
 */
export interface MatchedProfessor {
  id: number;
  name: string;
  universityName: string;
  majorName: string;
  department?: string | null;
  title?: string | null;
  labName?: string | null;
  labWebsite?: string | null;
  personalWebsite?: string | null;
  sourceUrl?: string | null;
  researchAreas?: string[] | null;
  tags?: string[] | null;
  email?: string | null;
  bio?: string | null;
  matchScore?: number;
  displayScore?: number;
  matchLevel?: string;
  matchedTags?: string[];
}

/**
 * Professors Service
 * 检索professors表中的教授数据
 */

/**
 * 从professors表获取教授列表
 * @param university 大学名称
 * @param major 专业名称
 * @param limit 返回数量限制
 * @returns 教授列表
 */
export async function getProfessorsFromDatabase(
  university: string,
  major: string,
  limit: number = 100
): Promise<MatchedProfessor[]> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Professors] Database connection failed');
      return [];
    }
    
    // 查询professors表
    const professorsList = await db
      .select()
      .from(professors)
      .where(
        and(
          eq(professors.universityName, university),
          eq(professors.majorName, major)
        )
      )
      .limit(limit);
    
    console.log(`[Professors] Found ${professorsList.length} professors for ${university} - ${major}`);
    
    // 转换为MatchedProfessor格式
    const matchedProfessors: MatchedProfessor[] = professorsList.map((prof) => ({
      id: prof.id,
      name: prof.name,
      universityName: prof.universityName || university,
      majorName: prof.majorName || major,
      department: prof.department,
      title: prof.title,
      labName: prof.labName,
      labWebsite: prof.labWebsite,
      personalWebsite: prof.personalWebsite,
      sourceUrl: prof.sourceUrl,
      researchAreas: prof.researchAreas ? JSON.parse(prof.researchAreas as string) : null,
      tags: prof.tags || [],
      email: prof.email,
      bio: prof.bio,
    }));
    
    return matchedProfessors;
  } catch (error) {
    console.error('[Professors] Error querying professors:', error);
    return [];
  }
}

/**
 * 检查professors表是否有足够的数据
 * 用于判断是否需要触发爬虫
 * @param university 大学名称
 * @param major 专业名称
 * @param threshold 阈值（默认20）
 * @returns 是否有足够数据
 */
export async function hasSufficientProfessorsData(
  university: string,
  major: string,
  threshold: number = 20
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;
    
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(professors)
      .where(
        and(
          eq(professors.universityName, university),
          eq(professors.majorName, major)
        )
      );
    
    const count = Number(result[0]?.count || 0);
    console.log(`[Professors] Data check: ${count} professors (threshold: ${threshold})`);
    
    return count >= threshold;
  } catch (error) {
    console.error('[Professors] Error checking data sufficiency:', error);
    return false;
  }
}

/**
 * 获取单个教授详情
 * @param professorId 教授ID
 * @returns 教授详情
 */
export async function getProfessorById(professorId: number): Promise<MatchedProfessor | null> {
  try {
    const db = await getDb();
    if (!db) return null;
    
    const result = await db
      .select()
      .from(professors)
      .where(eq(professors.id, professorId))
      .limit(1);
    
    if (result.length === 0) return null;
    
    const prof = result[0];
    return {
      id: prof.id,
      name: prof.name,
      universityName: prof.universityName || '',
      majorName: prof.majorName || '',
      department: prof.department,
      title: prof.title,
      labName: prof.labName,
      labWebsite: prof.labWebsite,
      personalWebsite: prof.personalWebsite,
      sourceUrl: prof.sourceUrl,
      researchAreas: prof.researchAreas ? JSON.parse(prof.researchAreas as string) : null,
      tags: prof.tags || [],
    };
  } catch (error) {
    console.error('[Professors] Error getting professor by ID:', error);
    return null;
  }
}
