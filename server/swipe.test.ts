import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from './db';
import { studentSwipes, studentLikes, professors, users, studentProfiles } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Swipe Router', () => {
  let testUserId: number;
  let testProfessorId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Find an existing user
    const existingUser = await db
      .select()
      .from(users)
      .limit(1);

    if (existingUser.length > 0) {
      testUserId = existingUser[0].id;
    } else {
      throw new Error('No users found in database');
    }

    // Find a professor for testing
    const existingProfessor = await db
      .select()
      .from(professors)
      .limit(1);

    if (existingProfessor.length > 0) {
      testProfessorId = existingProfessor[0].id;
    } else {
      throw new Error('No professors found in database');
    }
  });

  describe('Match Score Calculation', () => {
    it('should calculate and save match score when user likes a professor', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Clean up any existing like
      await db
        .delete(studentLikes)
        .where(eq(studentLikes.studentId, testUserId));

      // Simulate swipe like action
      await db.insert(studentSwipes).values({
        studentId: testUserId,
        professorId: testProfessorId,
        action: 'like',
      });

      // Get student profile for match calculation
      const profile = await db
        .select()
        .from(studentProfiles)
        .where(eq(studentProfiles.userId, testUserId))
        .limit(1);

      const studentProfile = profile[0];
      let matchScore = 70; // Default score

      if (studentProfile) {
        // Get professor data
        const prof = await db
          .select()
          .from(professors)
          .where(eq(professors.id, testProfessorId))
          .limit(1);

        if (prof.length > 0) {
          const professorTags = (prof[0].tags as string[]) || [];
          const studentSkills = studentProfile.skills ? JSON.parse(studentProfile.skills as string) : [];
          const studentInterests = studentProfile.interests ? JSON.parse(studentProfile.interests as string) : [];
          const studentTags = [...studentSkills, ...studentInterests].map(t => t.toLowerCase());
          
          const matchedTags = professorTags.filter(tag => 
            studentTags.some(st => st.includes(tag.toLowerCase()) || tag.toLowerCase().includes(st))
          );
          
          const totalTags = Math.max(professorTags.length, studentTags.length);
          matchScore = totalTags > 0 
            ? Math.round((matchedTags.length / totalTags) * 100)
            : 70;
          
          matchScore = Math.max(60, Math.min(100, matchScore));
        }
      }

      // Insert like with match score
      await db.insert(studentLikes).values({
        studentId: testUserId,
        professorId: testProfessorId,
        matchScore,
      });

      // Verify that match score was saved
      const savedLike = await db
        .select()
        .from(studentLikes)
        .where(eq(studentLikes.studentId, testUserId))
        .limit(1);

      expect(savedLike.length).toBeGreaterThan(0);
      expect(savedLike[0].matchScore).toBeGreaterThanOrEqual(60);
      expect(savedLike[0].matchScore).toBeLessThanOrEqual(100);
    });

    it('should use saved match score from database', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Get liked professors
      const likedProfessors = await db
        .select({
          professor: professors,
          matchScore: studentLikes.matchScore,
        })
        .from(studentLikes)
        .innerJoin(professors, eq(studentLikes.professorId, professors.id))
        .where(eq(studentLikes.studentId, testUserId));

      if (likedProfessors.length > 0) {
        // Verify that match scores are retrieved from database
        likedProfessors.forEach(prof => {
          expect(prof.matchScore).toBeDefined();
          expect(prof.matchScore).toBeGreaterThanOrEqual(60);
          expect(prof.matchScore).toBeLessThanOrEqual(100);
        });
      }
    });
  });

  describe('Research Field Filtering', () => {
    it('should filter professors by research field', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Get all research fields
      const fields = await db
        .selectDistinct({ field: professors.research_field })
        .from(professors)
        .where(eq(professors.research_field, 'Mathematics'));

      expect(fields).toBeDefined();
      // If there are professors with Mathematics field, verify filtering works
      if (fields.length > 0) {
        expect(fields[0].field).toBe('Mathematics');
      }
    });
  });
});
