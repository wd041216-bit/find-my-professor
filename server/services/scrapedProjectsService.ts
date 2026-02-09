import { getDb } from '../db';
import { scrapedProjects } from '../../drizzle/schema';
import { and, eq, sql } from 'drizzle-orm';
import type { MatchedProject } from './llmMatching';

/**
 * Extended MatchedProject type with tags for matching
 */
export interface MatchedProjectWithTags extends MatchedProject {
  tags?: string[];
}

/**
 * Scraped Projects Service
 * Retrieves projects from scraped_projects table (Perplexity search results)
 */

/**
 * Get projects from scraped_projects table
 * Returns projects found by Perplexity search
 */
export async function getProjectsFromScrapedData(
  university: string,
  major: string,
  count: number = 10
): Promise<MatchedProjectWithTags[]> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[ScrapedProjects] Database not available');
      return [];
    }
    
    // Query projects from scraped_projects table
    const projects = await db
      .select()
      .from(scrapedProjects)
      .where(
        and(
          eq(scrapedProjects.universityName, university),
          eq(scrapedProjects.majorName, major)
        )
      )
      .orderBy(sql`RAND()`) // Random order for variety
      .limit(count);
    
    if (projects.length === 0) {
      console.log(`[ScrapedProjects] No projects found for ${university} + ${major}`);
      return [];
    }
    
    console.log(`[ScrapedProjects] Found ${projects.length} projects from Perplexity search results`);
    
    // Convert to MatchedProject format with tags
    const matchedProjects: MatchedProjectWithTags[] = projects.map(p => ({
      projectName: p.projectTitle,
      professorName: p.professorName || 'Unknown Professor',
      lab: p.labName || undefined,
      researchDirection: p.researchArea || 'Not specified',
      description: p.projectDescription || 'No description available',
      requirements: p.requirements || undefined,
      contactEmail: p.contactEmail || undefined,
      url: p.sourceUrl || undefined,
      matchScore: 75, // Default score, will be updated by tags matching
      matchReason: 'This project matches your target university and major.',
      tags: (p.tags as string[]) || undefined, // Include tags for matching
    }));
    
    return matchedProjects;
  } catch (error) {
    console.error('[ScrapedProjects] Error querying scraped_projects:', error);
    return [];
  }
}

/**
 * Check if scraped_projects table has sufficient data
 * Used to determine if we should use profile cache
 */
export async function hasSufficientScrapedProjects(
  university: string,
  major: string,
  minCount: number = 50
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;
    
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(scrapedProjects)
      .where(
        and(
          eq(scrapedProjects.universityName, university),
          eq(scrapedProjects.majorName, major)
        )
      );
    
    const count = result[0]?.count ?? 0;
    console.log(`[ScrapedProjects] Database has ${count} scraped projects for ${university} + ${major}`);
    
    return count >= minCount;
  } catch (error) {
    console.error('[ScrapedProjects] Error checking project count:', error);
    return false;
  }
}
