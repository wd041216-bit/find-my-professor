import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import type { User } from "../drizzle/schema";

describe("Cover Letter Generation", () => {
  let testUser: User;
  let testProfessorId: number;

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

    // Get or create a test professor
    const [professors] = await db.execute(`
      SELECT id FROM professors LIMIT 1
    `);
    
    if (professors.length > 0) {
      testProfessorId = professors[0].id;
    } else {
      // Create a test professor if none exists
      const profResult = await db.execute(`
        INSERT INTO professors (universityName, department, name, title, researchAreas, tags, research_field)
        VALUES ('MIT', 'Computer Science', 'Dr. Test Professor', 'Professor', 'Machine Learning, AI', '["AI", "Machine Learning", "Deep Learning"]', 'Artificial Intelligence')
      `);
      testProfessorId = Number(profResult[0].insertId);
    }
  });

  it("should generate cover letter for a professor", async () => {
    const caller = appRouter.createCaller({
      user: testUser,
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.coverLetter.generateForProfessor({
      professorId: testProfessorId,
      tone: "formal",
    });

    expect(result).toBeDefined();
    expect(result.content).toBeTruthy();
    expect(result.content.length).toBeGreaterThan(100);
    expect(result.professorName).toBeTruthy();
    expect(result.university).toBeTruthy();
  }, 30000); // 30 second timeout for LLM call

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
    if (letters.length > 0) {
      expect(letters[0].professorName).toBeTruthy();
      expect(letters[0].content).toBeTruthy();
    }
  });

  it("should get a specific cover letter by ID", async () => {
    const caller = appRouter.createCaller({
      user: testUser,
      req: {} as any,
      res: {} as any,
    });

    // First get all letters to find an ID
    const letters = await caller.coverLetter.getMyLetters();
    expect(letters.length).toBeGreaterThan(0);

    const letterId = letters[0].id;
    const initialViewed = letters[0].viewed;

    // Get by ID should mark as viewed
    const letter = await caller.coverLetter.getById({ id: letterId });

    expect(letter).toBeDefined();
    expect(letter.id).toBe(letterId);
    expect(letter.content).toBeTruthy();
    
    // After getById, it should be marked as viewed
    const updatedLetters = await caller.coverLetter.getMyLetters();
    const updatedLetter = updatedLetters.find(l => l.id === letterId);
    expect(updatedLetter?.viewed).toBe(true);
  });

  it("should delete a cover letter", async () => {
    const caller = appRouter.createCaller({
      user: testUser,
      req: {} as any,
      res: {} as any,
    });

    // Generate a new letter for deletion
    const newLetter = await caller.coverLetter.generateForProfessor({
      professorId: testProfessorId,
      tone: "casual",
    });

    // Delete it
    const deleteResult = await caller.coverLetter.delete({ id: newLetter.id });
    expect(deleteResult.success).toBe(true);

    // Verify it's deleted by trying to get it
    await expect(
      caller.coverLetter.getById({ id: newLetter.id })
    ).rejects.toThrow();
  }, 30000);

  it("should mark cover letter as downloaded", async () => {
    const caller = appRouter.createCaller({
      user: testUser,
      req: {} as any,
      res: {} as any,
    });

    // Get a letter
    const letters = await caller.coverLetter.getMyLetters();
    expect(letters.length).toBeGreaterThan(0);

    const letterId = letters[0].id;

    // Mark as downloaded
    const result = await caller.coverLetter.markDownloaded({ id: letterId });
    expect(result.success).toBe(true);

    // Verify it's marked
    const letter = await caller.coverLetter.getById({ id: letterId });
    expect(letter.downloaded).toBe(true);
  });
});
