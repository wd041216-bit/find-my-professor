import { invokeLLM } from "../_core/llm";
import * as db from "../db";
import mysql from "mysql2/promise";

/**
 * Intelligent Matching Service
 * 
 * Two matching strategies:
 * A. Rich Profile: User has detailed info (skills, activities) → LLM recommends 8-10 projects from database
 * B. Minimal Profile: User only has basic info → Use crawler to find projects
 */

// Database connection pool
let connectionPool: mysql.Pool | null = null;

function getConnectionPool(): mysql.Pool {
  if (!connectionPool && process.env.DATABASE_URL) {
    connectionPool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      connectionLimit: 10,
      queueLimit: 20,
      waitForConnections: true,
    });
  }
  if (!connectionPool) {
    throw new Error('Database connection not available');
  }
  return connectionPool;
}

export interface UserProfileAnalysis {
  hasRichProfile: boolean;
  profileCompleteness: number; // 0-100
  strengths: string[];
  researchInterests: string[];
  targetMajors: string[];
}

/**
 * Analyze user profile to determine matching strategy
 */
export async function analyzeUserProfile(userId: number): Promise<UserProfileAnalysis> {
  const profile = await db.getStudentProfile(userId);
  const activities = await db.getUserActivities(userId);
  
  let completeness = 0;
  const strengths: string[] = [];
  const researchInterests: string[] = [];
  let targetMajors: string[] = [];
  
  // Check profile fields
  if (profile) {
    if (profile.academicLevel) completeness += 10;
    if (profile.currentUniversity) completeness += 10;
    if (profile.currentMajor) completeness += 10;
    if (profile.gpa) completeness += 10;
    
    if (profile.skills) {
      try {
        const skills = JSON.parse(profile.skills);
        if (Array.isArray(skills) && skills.length > 0) {
          completeness += 20;
          strengths.push(...skills);
        }
      } catch (e) {}
    }
    
    if (profile.interests) {
      try {
        const interests = JSON.parse(profile.interests);
        if (Array.isArray(interests) && interests.length > 0) {
          completeness += 15;
          researchInterests.push(...interests);
        }
      } catch (e) {}
    }
    
    if (profile.targetMajors) {
      try {
        targetMajors = JSON.parse(profile.targetMajors);
        if (Array.isArray(targetMajors) && targetMajors.length > 0) {
          completeness += 10;
        }
      } catch (e) {}
    }
  }
  
  // Check activities
  if (activities && activities.length > 0) {
    completeness += Math.min(activities.length * 5, 15);
  }
  
  // Rich profile: completeness >= 60%
  const hasRichProfile = completeness >= 60;
  
  return {
    hasRichProfile,
    profileCompleteness: Math.min(completeness, 100),
    strengths,
    researchInterests,
    targetMajors,
  };
}

/**
 * Get available projects from database for target universities and majors
 */
async function getAvailableProjects(
  targetUniversities: string[],
  targetMajors: string[]
): Promise<any[]> {
  try {
    const pool = getConnectionPool();
    
    // Build query to get projects from scraped_projects table
    const universityConditions = targetUniversities.map(() => 'university_name LIKE ?').join(' OR ');
    const majorConditions = targetMajors.map(() => 'major_name LIKE ?').join(' OR ');
    
    let query = `
      SELECT * FROM scraped_projects 
      WHERE expires_at > NOW()
    `;
    
    const params: string[] = [];
    
    if (targetUniversities.length > 0) {
      query += ` AND (${universityConditions})`;
      params.push(...targetUniversities.map(u => `%${u}%`));
    }
    
    if (targetMajors.length > 0) {
      query += ` AND (${majorConditions})`;
      params.push(...targetMajors.map(m => `%${m}%`));
    }
    
    query += ` ORDER BY scraped_at DESC LIMIT 100`;
    
    const [rows] = await pool.execute(query, params);
    
    return (rows as any[]).map(row => ({
      id: row.id,
      universityName: row.university_name,
      majorName: row.major_name,
      professorName: row.professor_name,
      labName: row.lab_name,
      researchArea: row.research_area,
      projectTitle: row.project_title,
      projectDescription: row.project_description,
      requirements: row.requirements,
      contactEmail: row.contact_email,
      sourceUrl: row.source_url,
    }));
  } catch (error) {
    console.error('[IntelligentMatching] Error getting available projects:', error);
    return [];
  }
}

/**
 * Use LLM to recommend best matching projects
 */
export async function recommendProjectsWithLLM(
  userId: number,
  analysis: UserProfileAnalysis
): Promise<{ projectIds: number[]; reasoning: string }> {
  // Get available projects from database
  const availableProjects = await getAvailableProjects(
    [],
    analysis.targetMajors
  );
  
  if (availableProjects.length === 0) {
    return {
      projectIds: [],
      reasoning: 'No projects available in database for target universities/majors. Please use crawler search.',
    };
  }
  
  // Build user profile summary
  const profile = await db.getStudentProfile(userId);
  const activities = await db.getUserActivities(userId);
  
  const profileSummary = {
    academicLevel: profile?.academicLevel || 'unknown',
    major: profile?.currentMajor || 'unknown',
    gpa: profile?.gpa || 'unknown',
    skills: analysis.strengths,
    interests: analysis.researchInterests,
    activities: activities.map(a => ({
      category: a.category,
      title: a.title,
      description: a.description,
    })),
  };
  
  // Prepare projects list for LLM
  const projectsList = availableProjects.map((p, idx) => ({
    index: idx,
    id: p.id,
    university: p.universityName,
    professor: p.professorName,
    lab: p.labName,
    researchArea: p.researchArea,
    title: p.projectTitle,
    description: p.projectDescription?.substring(0, 200), // Limit description length
    requirements: p.requirements?.substring(0, 150),
  }));
  
  // Call LLM to analyze and recommend
  const prompt = `You are a research project matching expert. Analyze the student profile and recommend 8-10 best matching research projects from the available options.

Student Profile:
${JSON.stringify(profileSummary, null, 2)}

Available Projects (${projectsList.length} total):
${JSON.stringify(projectsList, null, 2)}

Task:
1. Analyze the student's strengths, interests, and experience
2. Evaluate each project's fit based on research area, requirements, and student background
3. Select 8-10 projects that best match the student's profile
4. Prioritize projects where the student has relevant skills or interests

Return your response in this JSON format:
{
  "recommendedIndices": [0, 5, 12, ...],
  "reasoning": "Brief explanation of why these projects match the student's profile"
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are a research project matching expert. Always respond with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'project_recommendations',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              recommendedIndices: {
                type: 'array',
                items: { type: 'number' },
                description: 'Array of project indices (0-based) to recommend',
              },
              reasoning: {
                type: 'string',
                description: 'Brief explanation of matching logic',
              },
            },
            required: ['recommendedIndices', 'reasoning'],
            additionalProperties: false,
          },
        },
      },
    });
    
    const content = response.choices[0].message.content;
    const result = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
    const recommendedProjects = result.recommendedIndices
      .filter((idx: number) => idx >= 0 && idx < projectsList.length)
      .map((idx: number) => projectsList[idx].id);
    
    return {
      projectIds: recommendedProjects.slice(0, 10), // Limit to 10
      reasoning: result.reasoning,
    };
  } catch (error) {
    console.error('[IntelligentMatching] LLM recommendation error:', error);
    // Fallback: return top projects by order
    return {
      projectIds: projectsList.slice(0, 10).map(p => p.id),
      reasoning: 'LLM recommendation failed, returning top available projects',
    };
  }
}
