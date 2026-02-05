import crypto from 'crypto';
import { getDb } from '../db';
import { profileCache, type ProfileCache } from '../../drizzle/schema';
import { eq, and, gt, sql } from 'drizzle-orm';
import type { MatchedProject } from './llmMatching';

/**
 * Profile Cache Service
 * Caches matching results for similar user profiles to reduce LLM API calls
 */

interface ProfileKey {
  university: string;
  major: string;
  academicLevel?: string;
  hasSkills: boolean;
  hasActivities: boolean;
}

/**
 * Generate a unique hash for a user profile
 * Only considers key fields that affect matching results
 */
export function generateProfileHash(key: ProfileKey): string {
  // Sort keys for consistent hashing
  const normalized = {
    university: key.university.toLowerCase().trim(),
    major: key.major.toLowerCase().trim(),
    academicLevel: key.academicLevel || 'unknown',
    hasSkills: key.hasSkills,
    hasActivities: key.hasActivities,
  };
  
  const keyString = JSON.stringify(normalized);
  return crypto.createHash('sha256').update(keyString).digest('hex');
}

/**
 * Check if a cached result exists and is still valid
 */
export async function getCachedMatches(
  university: string,
  major: string,
  academicLevel?: string,
  hasSkills: boolean = false,
  hasActivities: boolean = false
): Promise<MatchedProject[] | null> {
  const hash = generateProfileHash({ university, major, academicLevel, hasSkills, hasActivities });
  
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[ProfileCache] Database not available');
      return null;
    }
    const cached = await db
      .select()
      .from(profileCache)
      .where(
        and(
          eq(profileCache.profileHash, hash),
          gt(profileCache.expiresAt, new Date())
        )
      )
      .limit(1);
    
    if (cached.length === 0) {
      console.log(`[ProfileCache] Cache miss for hash: ${hash}`);
      return null;
    }
    
    const record = cached[0];
    console.log(`[ProfileCache] Cache hit! Hash: ${hash}, Hit count: ${record.hitCount + 1}`);
    
    // Increment hit count
    await db
      .update(profileCache)
      .set({ hitCount: record.hitCount + 1 })
      .where(eq(profileCache.id, record.id));
    
    // Parse and return cached matches
    const matches: MatchedProject[] = JSON.parse(record.cachedMatches);
    return matches;
  } catch (error) {
    console.error('[ProfileCache] Error reading cache:', error);
    return null;
  }
}

/**
 * Store matching results in cache
 */
export async function cacheMatches(
  university: string,
  major: string,
  academicLevel: string | undefined,
  hasSkills: boolean,
  hasActivities: boolean,
  matches: MatchedProject[]
): Promise<void> {
  const hash = generateProfileHash({ university, major, academicLevel, hasSkills, hasActivities });
  
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[ProfileCache] Database not available');
      return;
    }
    // Calculate expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Check if cache already exists
    const existing = await db
      .select()
      .from(profileCache)
      .where(eq(profileCache.profileHash, hash))
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing cache
      await db
        .update(profileCache)
        .set({
          cachedMatches: JSON.stringify(matches),
          matchCount: matches.length,
          expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(profileCache.id, existing[0].id));
      
      console.log(`[ProfileCache] Updated cache for hash: ${hash}`);
    } else {
      // Insert new cache
      await db.insert(profileCache).values({
        profileHash: hash,
        university,
        major,
        academicLevel: academicLevel as any,
        hasSkills,
        hasActivities,
        cachedMatches: JSON.stringify(matches),
        matchCount: matches.length,
        hitCount: 0,
        expiresAt,
      });
      
      console.log(`[ProfileCache] Created new cache for hash: ${hash}`);
    }
  } catch (error) {
    console.error('[ProfileCache] Error storing cache:', error);
    // Don't throw - caching is optional
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalCaches: number;
  totalHits: number;
  averageHitsPerCache: number;
}> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[ProfileCache] Database not available');
      return { totalCaches: 0, totalHits: 0, averageHitsPerCache: 0 };
    }
    const caches = await db.select().from(profileCache);
    
    const totalCaches = caches.length;
    const totalHits = caches.reduce((sum: number, c: ProfileCache) => sum + c.hitCount, 0);
    const averageHitsPerCache = totalCaches > 0 ? totalHits / totalCaches : 0;
    
    return {
      totalCaches,
      totalHits,
      averageHitsPerCache: Math.round(averageHitsPerCache * 100) / 100,
    };
  } catch (error) {
    console.error('[ProfileCache] Error getting stats:', error);
    return { totalCaches: 0, totalHits: 0, averageHitsPerCache: 0 };
  }
}

/**
 * Clean up expired caches
 */
export async function cleanExpiredCaches(): Promise<number> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[ProfileCache] Database not available');
      return 0;
    }
    const result = await db
      .delete(profileCache)
      .where(sql`${profileCache.expiresAt} < NOW()`);
    
    console.log(`[ProfileCache] Cleaned up expired caches`);
    return 0; // Result count not available in Drizzle
  } catch (error) {
    console.error('[ProfileCache] Error cleaning expired caches:', error);
    return 0;
  }
}
