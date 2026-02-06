/**
 * Perplexity Search Cache Service
 * Checks if a university+major combination has been searched by Perplexity
 */

import { getDb } from '../db';
import * as schema from '../../drizzle/schema';
import { and, eq, sql } from 'drizzle-orm';

/**
 * Check if Perplexity has already searched this university+major combination
 * Returns true if at least one record exists (meaning we've searched before)
 */
export async function hasPerplexitySearched(
  university: string,
  major: string
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;
    
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.scrapedProjects)
      .where(
        and(
          eq(schema.scrapedProjects.universityName, university),
          eq(schema.scrapedProjects.majorName, major)
        )
      );
    
    const count = result[0]?.count ?? 0;
    console.log(`[PerplexityCache] Found ${count} existing records for ${university} + ${major}`);
    
    return count > 0;
  } catch (error) {
    console.error('[PerplexityCache] Error checking search history:', error);
    return false;
  }
}
