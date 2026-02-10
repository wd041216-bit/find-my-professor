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
  schoolId?: number | null;
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
  schoolImageUrl?: string;
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
    
    // 先查询教授数据（使用Drizzle ORM）
    const professorsList = await db
      .select()
      .from(professors)
      .where(
        sql`LOWER(${professors.universityName}) = LOWER(${university}) AND LOWER(${professors.majorName}) = LOWER(${major})`
      )
      .limit(limit);
    
    // 为每个教授获取研究领域背景图片
    const matchedProfessors: MatchedProfessor[] = [];
    
    for (const prof of professorsList) {
      let researchFieldImageUrl: string | undefined = undefined;
      
      // 如果教授有tags，根据tags查找研究领域
      if (prof.tags && Array.isArray(prof.tags) && prof.tags.length > 0) {
        const tags = prof.tags.map(t => t.trim().toLowerCase()).filter(t => t !== '');
        
        // 查找每个tag对应的研究领域
        const researchFieldCounts: Record<string, number> = {};
        
        for (const tag of tags) {
          const result = await db.execute(
            sql`SELECT research_field_name FROM research_field_tag_mapping WHERE LOWER(tag) = ${tag} LIMIT 1`
          );
          const rows = result[0] as unknown as any[];
          
          if (rows && rows.length > 0) {
            const fieldName = rows[0].research_field_name || rows[0][1]; // 兼容两种格式
            if (fieldName) {
              researchFieldCounts[fieldName] = (researchFieldCounts[fieldName] || 0) + 1;
            }
          }
        }
        
        // 选择出现次数最多的研究领域
        let primaryResearchField: string | null = null;
        let maxCount = 0;
        
        for (const [field, count] of Object.entries(researchFieldCounts)) {
          if (count > maxCount) {
            maxCount = count;
            primaryResearchField = field;
          }
        }
        
        // 如果找到了主要研究领域，查找对应的背景图片
        if (primaryResearchField) {
          const imageResult = await db.execute(
            sql`SELECT image_url FROM research_field_images WHERE field_name = ${primaryResearchField} LIMIT 1`
          );
          const imageRows = imageResult[0] as unknown as any[];
          
          if (imageRows && imageRows.length > 0) {
            researchFieldImageUrl = imageRows[0].image_url || imageRows[0][1]; // 兼容两种格式
          }
        }
      }
      
      matchedProfessors.push({
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
        schoolImageUrl: researchFieldImageUrl,
      });
    }
    
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
        sql`LOWER(university_name) = LOWER(${university}) AND LOWER(major_name) = LOWER(${major})`
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

/**
 * 获取用于滑动的教授列表
 * 根据学生profile计算匹配分数并排序
 * @param userId 学生ID
 * @param limit 返回数量限制
 * @param excludeIds 排除的教授ID列表（已滑过的）
 * @returns 带匹配分数的教授列表
 */
export async function getProfessorsForSwipe(
  userId: number,
  limit: number = 10,
  excludeIds: number[] = [],
  offset: number = 0
): Promise<MatchedProfessor[]> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Professors] Database connection failed');
      return [];
    }

    // Import here to avoid circular dependency
    const { getStudentProfile } = await import('../db');
    const { extractStudentTags } = await import('./studentTagsService');
    const { rankProfessorsByMatch } = await import('./tagsMatchingService');

    // Get student profile
    const profile = await getStudentProfile(userId);
    if (!profile) {
      console.error('[Professors] Student profile not found');
      return [];
    }

    // Get target university and major
    const targetUniversities = profile.targetUniversities ? JSON.parse(profile.targetUniversities as string) : [];
    const targetMajors = profile.targetMajors ? JSON.parse(profile.targetMajors as string) : [];

    if (targetUniversities.length === 0 || targetMajors.length === 0) {
      console.error('[Professors] No target university or major specified');
      return [];
    }

    const university = targetUniversities[0];
    const major = targetMajors[0];

    // Get all professors for this university+major
    let allProfessors = await getProfessorsFromDatabase(university, major, 1000);

    // Exclude already swiped professors
    if (excludeIds.length > 0) {
      allProfessors = allProfessors.filter(prof => !excludeIds.includes(prof.id));
    }

    if (allProfessors.length === 0) {
      return [];
    }

    // Extract student tags
    const userProfile = {
      academicLevel: profile.academicLevel || '',
      gpa: profile.gpa ? String(profile.gpa) : undefined,
      skills: profile.skills ? JSON.parse(profile.skills as string) : [],
      interests: profile.interests ? JSON.parse(profile.interests as string) : [],
      bio: profile.bio || '',
      activities: [], // Activities are in separate table, skip for now
    };

    const studentTags = await extractStudentTags(userProfile, university, major);

    // Convert professors to format expected by rankProfessorsByMatch
    const professorsForRanking = allProfessors.map(prof => ({
      professorName: prof.name,
      projectTitle: prof.title || '',
      tags: prof.tags || [],
      sourceUrl: prof.personalWebsite || undefined
    }));

    // Rank professors by match score
    const rankedResults = rankProfessorsByMatch(studentTags, professorsForRanking);

    // School images removed - using research_field_images instead

    // Convert MatchResult[] back to MatchedProfessor[] with school images
    const rankedProfessors: MatchedProfessor[] = rankedResults.map(result => {
      const originalProf = allProfessors.find(p => p.name === result.professorName)!;
      
      // 使用getProfessorsFromDatabase已经设置好的schoolImageUrl
      // 不再重新查询，直接使用原有值
      const converted = {
        ...originalProf,
        matchScore: result.matchScore,
        displayScore: result.displayScore,
        matchedTags: result.matchedTags,
        // 保留原有的schoolImageUrl，不覆盖
      };
      
      return converted;
    });

    // Return top N professors with offset support
    
    return rankedProfessors.slice(offset, offset + limit);
  } catch (error) {
    console.error('[Professors] Error getting professors for swipe:', error);
    return [];
  }
}
