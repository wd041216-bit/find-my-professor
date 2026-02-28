import { getDb } from '../db';
import { professors } from '../../drizzle/schema';
import { and, eq, sql } from 'drizzle-orm';

/**
 * 教授匹配结果类型
 */
interface ProfessorWithScore {
  id: number;
  name: string;
  universityName: string;
  department: string;
  research_field?: string | null;
  research_field_zh?: string | null;
  department_zh?: string | null;
  tags_zh?: string[] | null;
  title?: string | null;
  researchAreas?: string[] | null;
  tags?: string[] | null;
  matchScore?: number;
  displayScore?: number;
  matchedTags?: string[];
  schoolImageUrl?: string;
  imageUrl?: string;
}

/**
 * Professors Service
 * 检索professors表中的教授数据
 */

/**
 * 从professors表获取教授列表（优化版：使用JOIN避免N+1查询）
 * @param university 大学名称
 * @param major 专业名称
 * @param limit 返回数量限制
 * @returns 教授列表
 */export async function getProfessorsFromDatabase(
  university: string,
  major: string | null,
  limit: number = 100,
  department?: string | null
): Promise<ProfessorWithScore[]> {  try {
    const db = await getDb();
    if (!db) {
      console.error('[Professors] Database connection failed');
      return [];
    }
    
    // 查询教授数据（使用索引加速）
    let whereClause;
    if (department) {
      // 如果指定了department，按department查询（部分匹配）
      const deptPattern = `%${department}%`;
      whereClause = and(
        sql`LOWER(university_name) = LOWER(${university})`,
        sql`LOWER(department) LIKE LOWER(${deptPattern})`
      );
    } else if (major) {
      // 如果指定了major，按major查询
      whereClause = sql`LOWER(university_name) = LOWER(${university})`;
    } else {
      // 否则只按university查询
      whereClause = sql`LOWER(university_name) = LOWER(${university})`;
    }
    
    const professorsList = await db
      .select()
      .from(professors)
      .where(whereClause)
      .limit(limit);
    
    if (professorsList.length === 0) {
      return [];
    }
    
    // 批量获取所有教授的研究领域图片（避免N+1查询）
    // 1. 收集所有教授的research_field
    const researchFields = new Set<string>();
    for (const prof of professorsList) {
      if (prof.research_field && typeof prof.research_field === 'string') {
        researchFields.add(prof.research_field.trim());
      }
    }
    
    // 2. 批量查询大学专属领域图片（university_field_images表）
    const universityFieldImageMap = new Map<string, string>();
    
    if (researchFields.size > 0) {
      const fieldsArray = Array.from(researchFields);
      const placeholders = fieldsArray.map((_, i) => `{val${i}}`).join(',');
      
      // 查询大学专属领域图片（university_field_images表）
      let universityImageQueryStr = `SELECT research_field_name, image_url FROM university_field_images WHERE university_name = '${university.replace(/'/g, "''")}' AND research_field_name IN (${placeholders})`;
      fieldsArray.forEach((field, i) => {
        universityImageQueryStr = universityImageQueryStr.replace(`{val${i}}`, `'${field.replace(/'/g, "''")}'`);
      });
      const universityImageQuery = sql.raw(universityImageQueryStr);
      const universityImageResult = await db.execute(universityImageQuery);
      const universityImageRows = universityImageResult[0] as unknown as any[];
      if (universityImageRows && universityImageRows.length > 0) {
        for (const row of universityImageRows) {
          const fieldName = row.research_field_name || row[0];
          const imageUrl = row.image_url || row[1];
          if (fieldName && imageUrl) {
            universityFieldImageMap.set(fieldName, imageUrl);
          }
        }
      }
    }
    
    // 4. 为每个教授分配研究领域图片
    const matchedProfessors: ProfessorWithScore[] = [];
    
    for (const prof of professorsList) {
      let researchFieldImageUrl: string | undefined = undefined;
      
      // 直接使用教授的research_field字段获取大学专属领域图片
      if (prof.research_field && typeof prof.research_field === 'string') {
        const fieldName = prof.research_field.trim();
        researchFieldImageUrl = universityFieldImageMap.get(fieldName);
      }
      
      // Fallback: 如果没有找到任何研究领域图片，不设置schoolImageUrl
      // 前端会显示默认渐变色背景，避免图片错配
      // if (!researchFieldImageUrl) {
      //   researchFieldImageUrl = null; // 显式设置为null
      // }
      
      matchedProfessors.push({
        id: prof.id,
        name: prof.name,
        universityName: prof.universityName || university,
        department: prof.department || '',
        research_field: prof.research_field,
        research_field_zh: (prof as any).research_field_zh || null,
        department_zh: (prof as any).department_zh || null,
        tags_zh: (prof as any).tags_zh ? (typeof (prof as any).tags_zh === 'string' ? JSON.parse((prof as any).tags_zh) : (prof as any).tags_zh) : null,
        title: prof.title,
        researchAreas: prof.researchAreas ? (() => {
          try {
            return JSON.parse(prof.researchAreas as string);
          } catch (e) {
            return [prof.researchAreas as string];
          }
        })() : null,
        tags: Array.isArray(prof.tags) ? prof.tags : (prof.tags ? [prof.tags] : []),
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
        sql`LOWER(university_name) = LOWER(${university})`
      );
    
    const count = result[0]?.count || 0;
    return count >= threshold;
  } catch (error) {
    console.error('[Professors] Error checking professors data:', error);
    return false;
  }
}

/**
 * 获取单个教授详情
 * @param professorId 教授ID
 * @returns 教授详情
 */
export async function getProfessorById(professorId: number): Promise<ProfessorWithScore | null> {
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
      department: prof.department || '',
      title: prof.title,
      researchAreas: prof.researchAreas ? JSON.parse(prof.researchAreas as string) : null,
      tags: prof.tags || [],
    };
  } catch (error) {
    console.error('[Professors] Error getting professor by ID:', error);
    return null;
  }
}

/**
 * 获取用于滑动的教授列表（优化版：限制查询数量）
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
  offset: number = 0,
  filterUniversity?: string,
  filterResearchField?: string,
  minMatchScore?: number
): Promise<ProfessorWithScore[]> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Professors] Database connection failed');
      return [];
    }

    // Import here to avoid circular dependency
    const { getStudentProfile } = await import('../db');

    // Get student profile
    const profile = await getStudentProfile(userId);
    if (!profile) {
      console.error('[Professors] Student profile not found');
      return [];
    }

    // Get target university and major
    const targetUniversities = profile.targetUniversities ? JSON.parse(profile.targetUniversities as string) : [];
    const targetMajors = profile.targetMajors ? JSON.parse(profile.targetMajors as string) : [];

    if (targetUniversities.length === 0) {
      console.error('[Professors] No target university specified');
      return [];
    }

    // Major is optional - if not provided, search all professors at the university

    // 如果用户通过Filter选择了university，使用Filter的university；否则使用profile的target university
    const university = filterUniversity && filterUniversity !== '__all__' ? filterUniversity : (targetUniversities[0] || null);
    
    // 如果用户通过Filter选择了research field，忽略profile的targetMajors，查询全校教授然后通过filter过滤
    // 否则使用profile的targetMajors
    const shouldUseProfileMajor = !filterResearchField && targetMajors.length > 0;
    const major = shouldUseProfileMajor ? targetMajors[0] : null;

    console.log('[Professors] Querying with university:', university, 'major:', major, 'filterResearchField:', filterResearchField);

    // 优化：如果用户只选择了research field（没有选university），从全库查询该领域教授
    const queryLimit = filterResearchField ? 1000 : Math.min(limit * 3, 300);
    
    let allProfessors: ProfessorWithScore[];
    if (filterResearchField && !filterUniversity) {
      // 只有research field filter时，直接按research_field从全库查询，不限制大学
      console.log('[Professors] Research field only filter - querying all universities for field:', filterResearchField);
      const rawDb = await getDb();
      if (!rawDb) return [];
      const fieldProfs = await rawDb
        .select()
        .from(professors)
        .where(sql`LOWER(research_field) = LOWER(${filterResearchField})`)
        .limit(queryLimit);
      
      // Build a map of university -> image_url for this research field from university_field_images
      const uniImageMap = new Map<string, string>();
      try {
        const escapedField = filterResearchField.replace(/'/g, "''");
        const imgQuery = sql.raw(`SELECT university_name, image_url FROM university_field_images WHERE LOWER(research_field_name) = LOWER('${escapedField}')`);
        const imgResult = await rawDb.execute(imgQuery);
        const imgRows = imgResult[0] as unknown as any[];
        if (imgRows) {
          for (const row of imgRows) {
            const uniName = row.university_name || row[0];
            const imgUrl = row.image_url || row[1];
            if (uniName && imgUrl) uniImageMap.set(uniName.toLowerCase(), imgUrl);
          }
        }
      } catch (e) {
        console.error('[Professors] Failed to fetch field images:', e);
      }
      
      // Map to ProfessorWithScore format (Drizzle uses camelCase)
      allProfessors = fieldProfs.map(prof => ({
        id: prof.id,
        name: prof.name,
        title: prof.title || '',
        department: prof.department || '',
        universityName: prof.universityName || '',
        researchAreas: prof.researchAreas ? (typeof prof.researchAreas === 'string' ? (() => { try { return JSON.parse(prof.researchAreas as string); } catch { return [prof.researchAreas as string]; } })() : prof.researchAreas) : [],
        tags: prof.tags ? (typeof prof.tags === 'string' ? JSON.parse(prof.tags) : prof.tags) : [],
        research_field: prof.research_field || '',
        research_field_zh: (prof as any).research_field_zh || null,
        department_zh: (prof as any).department_zh || null,
        tags_zh: (prof as any).tags_zh ? (typeof (prof as any).tags_zh === 'string' ? JSON.parse((prof as any).tags_zh) : (prof as any).tags_zh) : null,
        schoolImageUrl: uniImageMap.get((prof.universityName || '').toLowerCase()) || prof.imageUrl || undefined,
        matchScore: undefined,
        displayScore: undefined,
        matchedTags: [],
        imageUrl: prof.imageUrl || undefined,
      }));
    } else {
      allProfessors = await getProfessorsFromDatabase(university || targetUniversities[0], major, queryLimit, undefined);
    }
    
    console.log('[Professors] Query returned:', allProfessors.length, 'professors');

    // Apply filters if provided
    if (filterUniversity && filterUniversity !== '__all__') {
      allProfessors = allProfessors.filter(prof => 
        prof.universityName.toLowerCase() === filterUniversity.toLowerCase()
      );
    }
    
    // Filter by research field if provided
    if (filterResearchField && filterResearchField !== '__all__') {
      allProfessors = allProfessors.filter(prof => 
        prof.research_field?.toLowerCase() === filterResearchField.toLowerCase()
      );
      console.log('[Professors] Filtered by research field:', filterResearchField, '- remaining:', allProfessors.length);
    }

    // Exclude already swiped professors
    if (excludeIds.length > 0) {
      allProfessors = allProfessors.filter(prof => !excludeIds.includes(prof.id));
      console.log('[Professors] After excluding swiped:', allProfessors.length);
    }

    if (allProfessors.length === 0) {
      console.log('[Professors] No professors left after filtering');
      return [];
    }

    // Shuffle professors randomly for swipe recommendations
    // No match score calculation - will be calculated only when user likes a professor
    const shuffled = allProfessors.sort(() => Math.random() - 0.5);
    
    const rankedProfessors: ProfessorWithScore[] = shuffled.map(prof => ({
      ...prof,
      matchScore: undefined, // No match score for swipe recommendations
      displayScore: undefined,
      matchedTags: prof.tags || [],
    }));
    
    console.log('[Professors] Randomly shuffled professors for swipe:', rankedProfessors.length);
    
    // Return top N professors with offset support
    const finalResults = rankedProfessors.slice(offset, offset + limit);
    console.log('[Professors] Returning', finalResults.length, 'professors (offset:', offset, 'limit:', limit, ')');
    return finalResults;
  } catch (error) {
    console.error('[Professors] Error getting professors for swipe:', error);
    return [];
  }
}
