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
    
    // 查询professors表（大小写不敏感）
    const professorsList = await db
      .select()
      .from(professors)
      .where(
        sql`LOWER(university_name) = LOWER(${university}) AND LOWER(major_name) = LOWER(${major})`
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
  excludeIds: number[] = []
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

    // Get school images for random selection
    const { schools, schoolImages } = await import('../../drizzle/schema');
    const schoolRecords = await db.select().from(schools);
    const schoolImagesRecords = await db.select().from(schoolImages);

    // Convert MatchResult[] back to MatchedProfessor[] with school images
    const rankedProfessors: MatchedProfessor[] = rankedResults.map(result => {
      const originalProf = allProfessors.find(p => p.name === result.professorName)!;
      
      // Find school images for this professor's school
      const professorSchool = schoolRecords.find(s => s.id === originalProf.schoolId);
      const schoolImagesList = schoolImagesRecords.filter(img => img.schoolId === originalProf.schoolId);
      
      // Randomly select one school image
      const randomSchoolImage = schoolImagesList.length > 0
        ? schoolImagesList[Math.floor(Math.random() * schoolImagesList.length)]
        : null;

      return {
        ...originalProf,
        matchScore: result.matchScore,
        displayScore: result.displayScore,
        matchedTags: result.matchedTags,
        schoolImageUrl: randomSchoolImage?.imageUrl || undefined
      };
    });

    // Return top N professors
    return rankedProfessors.slice(0, limit);
  } catch (error) {
    console.error('[Professors] Error getting professors for swipe:', error);
    return [];
  }
}
