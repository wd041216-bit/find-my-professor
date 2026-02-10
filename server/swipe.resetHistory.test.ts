import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { studentSwipes, studentProfiles, users, professors } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import type { TrpcContext } from "./_core/context";

describe("swipe.resetSwipeHistory", () => {
  let testUserId: number;
  let caller: ReturnType<typeof appRouter.createCaller>;
  let professorIds: number[] = [];

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Create a test user (required for foreign key constraint)
    testUserId = 999999;
    await db
      .insert(users)
      .values({
        id: testUserId,
        openId: "test-open-id-999999",
        name: "Test User",
        email: "test999999@example.com",
        role: "user",
      });

    // Create a test user profile
    await db
      .insert(studentProfiles)
      .values({
        userId: testUserId,
        targetUniversities: JSON.stringify(["Test University"]),
        targetMajors: JSON.stringify(["Test Major"]),
        skills: JSON.stringify(["Test Skill"]),
        interests: JSON.stringify(["Test Interest"]),
        bio: "Test bio",
      });

    // Create test caller with mock user
    const ctx: TrpcContext = {
      user: {
        id: testUserId,
        openId: "test-open-id",
        name: "Test User",
        email: "test@example.com",
        avatarUrl: null,
        role: "user",
        createdAt: new Date(),
      },
      req: {} as any,
      res: {} as any,
    };
    caller = appRouter.createCaller(ctx);

    // Get real professor IDs from database
    const realProfessors = await db
      .select({ id: professors.id })
      .from(professors)
      .limit(3);
    
    if (realProfessors.length < 3) {
      throw new Error("Not enough professors in database for testing");
    }
    
    professorIds = realProfessors.map(p => p.id);

    // Insert some test swipe records
    await db.insert(studentSwipes).values([
      {
        studentId: testUserId,
        professorId: professorIds[0],
        action: "like",
      },
      {
        studentId: testUserId,
        professorId: professorIds[1],
        action: "skip",
      },
      {
        studentId: testUserId,
        professorId: professorIds[2],
        action: "like",
      },
    ]);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db.delete(studentSwipes).where(eq(studentSwipes.studentId, testUserId));
    await db.delete(studentProfiles).where(eq(studentProfiles.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should successfully reset swipe history", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Verify swipe records exist before reset
    const swipesBefore = await db
      .select()
      .from(studentSwipes)
      .where(eq(studentSwipes.studentId, testUserId));

    expect(swipesBefore.length).toBe(3);

    // Call resetSwipeHistory
    const result = await caller.swipe.resetSwipeHistory();

    expect(result.success).toBe(true);

    // Verify swipe records are deleted after reset
    const swipesAfter = await db
      .select()
      .from(studentSwipes)
      .where(eq(studentSwipes.studentId, testUserId));

    expect(swipesAfter.length).toBe(0);
  });

  it("should return success status", async () => {
    // Insert test user's swipe records
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    await db.insert(studentSwipes).values([
      {
        studentId: testUserId,
        professorId: professorIds[0],
        action: "like",
      },
      {
        studentId: testUserId,
        professorId: professorIds[1],
        action: "skip",
      },
    ]);

    // Call resetSwipeHistory and verify success response
    const result = await caller.swipe.resetSwipeHistory();

    expect(result).toEqual({ success: true });

    // Verify records are deleted
    const currentUserSwipes = await db
      .select()
      .from(studentSwipes)
      .where(eq(studentSwipes.studentId, testUserId));

    expect(currentUserSwipes.length).toBe(0);
  });
});
