import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import type { User } from "../drizzle/schema";

describe("Cover Letter Generation", () => {
  let testUser: User;
  let testMatchId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test user
    const userResult = await db.execute(`
      INSERT INTO users (email, name, role, openId)
      VALUES ('test-coverletter@example.com', 'Test User', 'user', 'test-open-id-cl')
      ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)
    `);
    const userId = Number(userResult[0].insertId);

    const [user] = await db.execute(`SELECT * FROM users WHERE id = ${userId}`);
    testUser = user[0] as User;

    // Create a test student profile
    await db.execute(`
      INSERT INTO student_profiles (user_id, current_university, current_major, academic_level, skills, interests)
      VALUES (${userId}, 'Test University', 'Computer Science', 'undergraduate', '["Python", "Machine Learning"]', '["AI", "Research"]')
      ON DUPLICATE KEY UPDATE user_id=user_id
    `);

    // Create a test activity
    await db.execute(`
      INSERT INTO activities (user_id, title, category, organization, description, start_date, end_date)
      VALUES (${userId}, 'Research Assistant', 'research', 'AI Lab', 'Worked on ML projects', '2023-01-01', '2023-12-31')
    `);

    // Create a test project match
    const matchResult = await db.execute(`
      INSERT INTO project_matches (
        user_id, project_name, professor_name, university, research_direction,
        description, match_score, match_reasons, major
      )
      VALUES (
        ${userId}, 'AI Research Project', 'Dr. Smith', 'MIT',
        'Machine Learning', 'Advanced ML research', 85,
        '["Strong match based on your ML background"]', 'Computer Science'
      )
    `);
    testMatchId = Number(matchResult[0].insertId);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db.execute(`DELETE FROM cover_letters WHERE user_id = ${testUser.id}`);
    await db.execute(`DELETE FROM project_matches WHERE user_id = ${testUser.id}`);
    await db.execute(`DELETE FROM activities WHERE user_id = ${testUser.id}`);
    await db.execute(`DELETE FROM student_profiles WHERE user_id = ${testUser.id}`);
    await db.execute(`DELETE FROM credit_transactions WHERE user_id = ${testUser.id}`);
    await db.execute(`DELETE FROM user_credits WHERE user_id = ${testUser.id}`);
    await db.execute(`DELETE FROM users WHERE id = ${testUser.id}`);
  });

  it("should generate a cover letter successfully", async () => {
    const caller = appRouter.createCaller({
      user: testUser,
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.coverLetter.generate({
      matchId: testMatchId,
      tone: "formal",
    });

    expect(result).toBeDefined();
    expect(result.content).toBeTruthy();
    expect(result.content.length).toBeGreaterThan(100);
    expect(result.projectName).toBe("AI Research Project");
    expect(result.professorName).toBe("Dr. Smith");
    expect(result.university).toBe("MIT");
  }, 30000); // 30 second timeout for LLM generation

  it("should retrieve generated cover letters", async () => {
    const caller = appRouter.createCaller({
      user: testUser,
      req: {} as any,
      res: {} as any,
    });

    const letters = await caller.coverLetter.getMyLetters();

    expect(letters).toBeDefined();
    expect(Array.isArray(letters)).toBe(true);
    expect(letters.length).toBeGreaterThan(0);
    // Note: This test may fail if previous test timed out
    if (letters.length > 0) {
      expect(letters[0].projectName).toBe("AI Research Project");
    }
  });

  it("should deduct credits for cover letter generation", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get initial credits
    const [initialCredits] = await db.execute(`
      SELECT credits FROM user_credits WHERE user_id = ${testUser.id}
    `);
    const initialBalance = initialCredits[0]?.credits || 100;

    const caller = appRouter.createCaller({
      user: testUser,
      req: {} as any,
      res: {} as any,
    });

    await caller.coverLetter.generate({
      matchId: testMatchId,
      tone: "casual",
    });

    // Check credits after generation
    const [finalCredits] = await db.execute(`
      SELECT credits FROM user_credits WHERE user_id = ${testUser.id}
    `);
    const finalBalance = finalCredits[0]?.credits || 0;

    expect(finalBalance).toBe(initialBalance - 10);
  }, 30000); // 30 second timeout for LLM generation

  it("should fail when user has insufficient credits", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Set credits to 0
    await db.execute(`
      UPDATE user_credits SET credits = 0 WHERE user_id = ${testUser.id}
    `);

    const caller = appRouter.createCaller({
      user: testUser,
      req: {} as any,
      res: {} as any,
    });

    await expect(
      caller.coverLetter.generate({
        matchId: testMatchId,
        tone: "formal",
      })
    ).rejects.toThrow("INSUFFICIENT_CREDITS");
  });
});
