import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { studentLikes, professors, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Match History Feature Tests
 * 
 * Tests the new Match History functionality that displays liked professors
 * and generates personalized cover letters.
 */

describe("Match History - Liked Professors", () => {
  let testUserId: number;
  let testProfessorId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Find or create a test user
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, "test@example.com"))
      .limit(1);

    if (existingUser.length > 0) {
      testUserId = existingUser[0].id;
    } else {
      const result = await db.insert(users).values({
        openId: "test-openid-match-history",
        name: "Test User",
        email: "test@example.com",
        loginMethod: "google",
      });
      testUserId = result[0].insertId;
    }

    // Find a test professor
    const testProfessor = await db
      .select()
      .from(professors)
      .limit(1);

    if (testProfessor.length === 0) {
      throw new Error("No professors found in database for testing");
    }

    testProfessorId = testProfessor[0].id;
  });

  it("should save a liked professor with match score", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const matchScore = 85;

    // Insert a like with match score
    await db.insert(studentLikes).values({
      studentId: testUserId,
      professorId: testProfessorId,
      likeType: "like",
      matchScore,
    }).onDuplicateKeyUpdate({
      set: {
        likeType: "like",
        matchScore,
      },
    });

    // Verify the like was saved
    const savedLike = await db
      .select()
      .from(studentLikes)
      .where(eq(studentLikes.studentId, testUserId))
      .limit(1);

    expect(savedLike.length).toBeGreaterThan(0);
    expect(savedLike[0].matchScore).toBe(matchScore);
    expect(savedLike[0].likeType).toBe("like");
  });

  it("should retrieve liked professors with complete information", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get liked professors (simulating getMyMatches API)
    const likes = await db
      .select({
        id: studentLikes.id,
        likeType: studentLikes.likeType,
        createdAt: studentLikes.createdAt,
        matchScore: studentLikes.matchScore,
        professor: professors,
      })
      .from(studentLikes)
      .innerJoin(professors, eq(studentLikes.professorId, professors.id))
      .where(eq(studentLikes.studentId, testUserId));

    expect(likes.length).toBeGreaterThan(0);

    const firstLike = likes[0];
    expect(firstLike.professor).toBeDefined();
    expect(firstLike.professor.name).toBeDefined();
    expect(firstLike.professor.universityName).toBeDefined();
    expect(firstLike.matchScore).toBeDefined();
  });

  it("should support super_like type", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Update to super_like
    await db.insert(studentLikes).values({
      studentId: testUserId,
      professorId: testProfessorId,
      likeType: "super_like",
      matchScore: 95,
    }).onDuplicateKeyUpdate({
      set: {
        likeType: "super_like",
        matchScore: 95,
      },
    });

    // Verify super_like was saved
    const savedLike = await db
      .select()
      .from(studentLikes)
      .where(eq(studentLikes.studentId, testUserId))
      .limit(1);

    expect(savedLike[0].likeType).toBe("super_like");
    expect(savedLike[0].matchScore).toBe(95);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db
      .delete(studentLikes)
      .where(eq(studentLikes.studentId, testUserId));
  });
});

describe("Match History - Cover Letter Generation", () => {
  it("should have professor research_field for context", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Verify professors have research_field data
    const professorsWithField = await db
      .select()
      .from(professors)
      .limit(10);

    expect(professorsWithField.length).toBeGreaterThan(0);

    // At least some professors should have research_field
    const withField = professorsWithField.filter(p => p.research_field);
    expect(withField.length).toBeGreaterThan(0);
  });

  it("should have professor tags for personalization", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Verify professors have tags data
    const professorsWithTags = await db
      .select()
      .from(professors)
      .limit(10);

    expect(professorsWithTags.length).toBeGreaterThan(0);

    // At least some professors should have tags
    const withTags = professorsWithTags.filter(p => p.tags && p.tags.length > 0);
    expect(withTags.length).toBeGreaterThan(0);
  });
});
