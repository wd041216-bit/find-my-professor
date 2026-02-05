import { getDb } from '../db';
import { projectMatches } from '../../drizzle/schema';
import { and, eq, sql } from 'drizzle-orm';
import type { MatchedProject } from './llmMatching';

/**
 * Simplified Matching Service
 * For users with minimal profile (only required fields, no skills/activities),
 * randomly select projects from database instead of calling LLM
 */

/**
 * Check if user has a simplified profile (minimal information)
 */
export function isSimplifiedProfile(
  skills: string[] | undefined,
  interests: string[] | undefined,
  activities: any[] | undefined,
  bio: string | undefined
): boolean {
  const hasSkills = skills && skills.length > 0;
  const hasInterests = interests && interests.length > 0;
  const hasActivities = activities && activities.length > 0;
  const hasBio = bio && bio.trim().length > 0;
  
  // Simplified profile: no skills, no interests, no activities, no bio
  return !hasSkills && !hasInterests && !hasActivities && !hasBio;
}

/**
 * Get random projects from database for simplified matching
 * Returns 8-10 projects from the same university and major
 */
export async function getRandomProjectsFromDatabase(
  university: string,
  major: string,
  count: number = 10
): Promise<MatchedProject[]> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[SimplifiedMatching] Database not available');
      return [];
    }
    
    // Query projects from database (from previous matches or scraping results)
    // We'll select from project_matches table where university and major match
    const projects = await db
      .select()
      .from(projectMatches)
      .where(
        and(
          eq(projectMatches.university, university),
          eq(projectMatches.major, major)
        )
      )
      .orderBy(sql`RAND()`) // Random order
      .limit(count);
    
    if (projects.length === 0) {
      console.log(`[SimplifiedMatching] No projects found in database for ${university} + ${major}`);
      return [];
    }
    
    console.log(`[SimplifiedMatching] Found ${projects.length} projects in database`);
    
    // Convert to MatchedProject format
    const matchedProjects: MatchedProject[] = projects.map((p, index) => ({
      projectName: p.projectName,
      professorName: p.professorName,
      lab: p.lab || undefined,
      researchDirection: p.researchDirection,
      description: p.description,
      requirements: p.requirements || undefined,
      contactEmail: p.contactEmail || undefined,
      url: p.url || undefined,
      matchScore: 70 + Math.random() * 20, // Random score 70-90 for simplified matching
      matchReason: `This project matches your target university (${university}) and major (${major}). Consider reviewing the project details to see if it aligns with your interests.`,
    }));
    
    return matchedProjects;
  } catch (error) {
    console.error('[SimplifiedMatching] Error querying database:', error);
    return [];
  }
}

/**
 * Check if database has sufficient projects for simplified matching
 */
export async function hasSufficientProjects(
  university: string,
  major: string,
  minCount: number = 5
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;
    
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(projectMatches)
      .where(
        and(
          eq(projectMatches.university, university),
          eq(projectMatches.major, major)
        )
      );
    
    const count = result[0]?.count ?? 0;
    console.log(`[SimplifiedMatching] Database has ${count} projects for ${university} + ${major}`);
    
    return count >= minCount;
  } catch (error) {
    console.error('[SimplifiedMatching] Error checking project count:', error);
    return false;
  }
}
