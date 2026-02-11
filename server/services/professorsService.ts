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
): Promise<MatchedProfessor[]> {  try {
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
        sql`LOWER(${professors.universityName}) = LOWER(${university})`,
        sql`LOWER(${professors.department}) LIKE LOWER(${deptPattern})`
      );
    } else if (major) {
      // 如果指定了major，按major查询
      whereClause = and(
        sql`LOWER(${professors.universityName}) = LOWER(${university})`,
        sql`LOWER(${professors.majorName}) = LOWER(${major})`
      );
    } else {
      // 否则只按university查询
      whereClause = sql`LOWER(${professors.universityName}) = LOWER(${university})`;
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
    // 1. 收集所有tags
    const allTags = new Set<string>();
    for (const prof of professorsList) {
      if (prof.tags && Array.isArray(prof.tags)) {
        prof.tags.forEach(tag => {
          if (tag && typeof tag === 'string') {
            allTags.add(tag.trim().toLowerCase());
          }
        });
      }
    }
    
    // 2. 批量查询tag映射（一次查询获取所有映射关系）
    const tagMappingMap = new Map<string, string>();
    if (allTags.size > 0) {
      const tagsArray = Array.from(allTags);
      const placeholders = tagsArray.map((_, i) => `{val${i}}`).join(',');
      let queryStr = `SELECT LOWER(tag) as tag_lower, research_field_name 
         FROM research_field_tag_mapping 
         WHERE LOWER(tag) IN (${placeholders})`;
      
      // Replace placeholders with actual values
      tagsArray.forEach((tag, i) => {
        queryStr = queryStr.replace(`{val${i}}`, `'${tag.replace(/'/g, "''")}'`);
      });
      
      const tagMappingQuery = sql.raw(queryStr);
      
      const tagMappingResult = await db.execute(tagMappingQuery);
      const tagMappingRows = tagMappingResult[0] as unknown as any[];
      
      if (tagMappingRows && tagMappingRows.length > 0) {
        for (const row of tagMappingRows) {
          const tagLower = row.tag_lower || row[0];
          const fieldName = row.research_field_name || row[1];
          if (tagLower && fieldName) {
            tagMappingMap.set(tagLower, fieldName);
          }
        }
      }
    }
    
    // 3. 批量查询研究领域图片（优先使用大学专属图片）
    const researchFields = new Set(tagMappingMap.values());
    const fieldImageMap = new Map<string, string>();
    const universityFieldImageMap = new Map<string, string>();
    
    if (researchFields.size > 0) {
      const fieldsArray = Array.from(researchFields);
      const placeholders = fieldsArray.map((_, i) => `{val${i}}`).join(',');
      
      // 3.1 查询大学专属领域图片（university_field_images表）
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
      
      // 3.2 查询通用领域图片（research_field_images表）作为回退
      let imageQueryStr = `SELECT field_name, image_url FROM research_field_images WHERE field_name IN (${placeholders})`;
      fieldsArray.forEach((field, i) => {
        imageQueryStr = imageQueryStr.replace(`{val${i}}`, `'${field.replace(/'/g, "''")}'`);
      });
      const imageQuery = sql.raw(imageQueryStr);
      const imageResult = await db.execute(imageQuery);
      const imageRows = imageResult[0] as unknown as any[];
      if (imageRows && imageRows.length > 0) {
        for (const row of imageRows) {
          const fieldName = row.field_name || row[0];
          const imageUrl = row.image_url || row[1];
          if (fieldName && imageUrl) {
            fieldImageMap.set(fieldName, imageUrl);
          }
        }
      }
    }
    
    // 4. 为每个教授分配研究领域图片
    const matchedProfessors: MatchedProfessor[] = [];
    
    for (const prof of professorsList) {
      let researchFieldImageUrl: string | undefined = undefined;
      
      // 如果教授有tags，根据tags查找研究领域
      if (prof.tags && Array.isArray(prof.tags) && prof.tags.length > 0) {
        const tags = prof.tags.map(t => t.trim().toLowerCase()).filter(t => t !== '');
        
        // 统计每个研究领域出现的次数
        const researchFieldCounts: Record<string, number> = {};
        
        for (const tag of tags) {
          const fieldName = tagMappingMap.get(tag);
          if (fieldName) {
            researchFieldCounts[fieldName] = (researchFieldCounts[fieldName] || 0) + 1;
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
        
        // 如果找到了主要研究领域，获取对应的背景图片（优先使用大学专属图片）
        if (primaryResearchField) {
          // 优先使用大学专属图片
          researchFieldImageUrl = universityFieldImageMap.get(primaryResearchField);
          // 如果没有大学专属图片，使用通用领域图片
          if (!researchFieldImageUrl) {
            researchFieldImageUrl = fieldImageMap.get(primaryResearchField);
          }
        }
      }
      
      // Fallback: 如果没有找到任何研究领域图片，使用默认图片
      if (!researchFieldImageUrl) {
        // 优先使用华盛顿大学专属图片（任意一张）
        if (universityFieldImageMap.size > 0) {
          researchFieldImageUrl = Array.from(universityFieldImageMap.values())[0];
        } else if (fieldImageMap.size > 0) {
          // 如果没有华盛顿大学专属图片，使用通用领域图片
          researchFieldImageUrl = Array.from(fieldImageMap.values())[0];
        }
      }
      
      matchedProfessors.push({
        id: prof.id,
        name: prof.name,
        universityName: prof.universityName || university,
        majorName: prof.majorName || major || 'General',
        department: prof.department,
        title: prof.title,
        labName: prof.labName,
        labWebsite: prof.labWebsite,
        personalWebsite: prof.personalWebsite,
        sourceUrl: prof.sourceUrl,
        researchAreas: prof.researchAreas ? (() => {
          try {
            return JSON.parse(prof.researchAreas as string);
          } catch (e) {
            // If researchAreas is not valid JSON, treat it as a single string
            return [prof.researchAreas as string];
          }
        })() : null,
        tags: Array.isArray(prof.tags) ? prof.tags : (prof.tags ? [prof.tags] : []),
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
        sql`LOWER(${professors.universityName}) = LOWER(${university}) AND LOWER(${professors.majorName}) = LOWER(${major})`
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
  filterDepartment?: string,
  minMatchScore?: number
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

    if (targetUniversities.length === 0) {
      console.error('[Professors] No target university specified');
      return [];
    }

    // Major is optional - if not provided, search all professors at the university

    // 如果用户通过Filter选择了university，使用Filter的university；否则使用profile的target university
    const university = filterUniversity || targetUniversities[0];
    
    // 如果用户通过Filter选择了department，忽略profile的targetMajors，查询全校教授然后通过filter过滤
    // 否则使用profile的targetMajors
    const shouldUseProfileMajor = !filterDepartment && targetMajors.length > 0;
    const major = shouldUseProfileMajor ? targetMajors[0] : null;

    console.log('[Professors] Querying with university:', university, 'major:', major, 'filterDepartment:', filterDepartment);

    // 优化：只查询需要的数量（limit * 3，留出排序和筛选的余地）
    // 而不是查询全部1000个教授
    // 如果用户使用了Filter功能选择学院，则直接在数据库查询中过滤department
    const queryLimit = Math.min(limit * 3, 300);
    let allProfessors = await getProfessorsFromDatabase(university, major, queryLimit, filterDepartment);
    
    console.log('[Professors] Query returned:', allProfessors.length, 'professors');

    // Apply filters if provided
    if (filterUniversity && filterUniversity !== '__all__') {
      allProfessors = allProfessors.filter(prof => 
        prof.universityName.toLowerCase() === filterUniversity.toLowerCase()
      );
    }
    // Department filtering is now done in database query (getProfessorsFromDatabase)

    // Exclude already swiped professors
    if (excludeIds.length > 0) {
      allProfessors = allProfessors.filter(prof => !excludeIds.includes(prof.id));
      console.log('[Professors] After excluding swiped:', allProfessors.length);
    }

    if (allProfessors.length === 0) {
      console.log('[Professors] No professors left after filtering');
      return [];
    }

    // Extract student tags (with caching)
    const { getCachedStudentTags, setCachedStudentTags } = await import('./cacheService');
    
    let studentTags = getCachedStudentTags(userId, university, major);
    
    if (!studentTags) {
      // Cache miss, extract tags from profile
      const userProfile = {
        academicLevel: profile.academicLevel || '',
        gpa: profile.gpa ? String(profile.gpa) : undefined,
        skills: profile.skills ? JSON.parse(profile.skills as string) : [],
        interests: profile.interests ? JSON.parse(profile.interests as string) : [],
        bio: profile.bio || '',
        activities: [], // Activities are in separate table, skip for now
      };

      studentTags = await extractStudentTags(userProfile, university, major || 'Computer Science'); // Default major if not specified
      
      // Cache the result for 10 minutes
      setCachedStudentTags(userId, university, major || '', studentTags);
      console.log('[Professors] Student tags extracted and cached:', studentTags.length);
    } else {
      console.log('[Professors] Using cached student tags:', studentTags.length);
    }

    // Convert professors to format expected by rankProfessorsByMatch
    const professorsForRanking = allProfessors.map(prof => ({
      professorName: prof.name,
      projectTitle: prof.title || '',
      tags: prof.tags || [],
      sourceUrl: prof.personalWebsite || undefined
    }));

    // Rank professors by match score
    const rankedResults = rankProfessorsByMatch(studentTags, professorsForRanking);
    console.log('[Professors] Ranked results:', rankedResults.length);

    // Convert MatchResult[] back to MatchedProfessor[] with school images
    const rankedProfessors: MatchedProfessor[] = rankedResults.map(result => {
      const originalProf = allProfessors.find(p => p.name === result.professorName)!;
      
      // 保留原有的schoolImageUrl，不覆盖
      const converted = {
        ...originalProf,
        matchScore: result.matchScore,
        displayScore: result.displayScore,
        matchedTags: result.matchedTags,
      };
      
      return converted;
    });

    // Apply minMatchScore filter if provided (from Filter panel)
    if (rankedProfessors.length === 0) {
      return [];
    }
    
    let filteredProfessors = rankedProfessors;
    if (minMatchScore !== undefined && minMatchScore > 0) {
      filteredProfessors = rankedProfessors.filter(prof => (prof.matchScore || 0) >= minMatchScore);
      console.log('[Professors] Filtered by minMatchScore:', minMatchScore, '- remaining:', filteredProfessors.length);
    } else {
      console.log('[Professors] No minMatchScore filter applied');
    }
    
    // Return top N professors with offset support
    const finalResults = filteredProfessors.slice(offset, offset + limit);
    console.log('[Professors] Returning', finalResults.length, 'professors (offset:', offset, 'limit:', limit, ')');
    return finalResults;
  } catch (error) {
    console.error('[Professors] Error getting professors for swipe:', error);
    return [];
  }
}
