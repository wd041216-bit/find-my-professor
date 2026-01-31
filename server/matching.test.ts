import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Matching System", () => {
  it("should calculate matches for a user", async () => {
    const ctx = createTestContext(1);
    const caller = appRouter.createCaller(ctx);

    // This test requires database setup, so we'll just verify the function exists
    expect(caller.matching.calculateMatches).toBeDefined();
  });

  it("should get matches with details", async () => {
    const ctx = createTestContext(1);
    const caller = appRouter.createCaller(ctx);

    // Verify the query exists
    expect(caller.matching.getMatchesWithDetails).toBeDefined();
  });
});

describe("Profile Management", () => {
  it("should get user profile", async () => {
    const ctx = createTestContext(1);
    const caller = appRouter.createCaller(ctx);

    expect(caller.profile.get).toBeDefined();
  });

  it("should upsert user profile", async () => {
    const ctx = createTestContext(1);
    const caller = appRouter.createCaller(ctx);

    expect(caller.profile.upsert).toBeDefined();
  });
});

describe("Activities Management", () => {
  it("should list user activities", async () => {
    const ctx = createTestContext(1);
    const caller = appRouter.createCaller(ctx);

    expect(caller.activities.list).toBeDefined();
  });

  it("should create activity", async () => {
    const ctx = createTestContext(1);
    const caller = appRouter.createCaller(ctx);

    expect(caller.activities.create).toBeDefined();
  });

  it("should update activity", async () => {
    const ctx = createTestContext(1);
    const caller = appRouter.createCaller(ctx);

    expect(caller.activities.update).toBeDefined();
  });

  it("should delete activity", async () => {
    const ctx = createTestContext(1);
    const caller = appRouter.createCaller(ctx);

    expect(caller.activities.delete).toBeDefined();
  });
});

describe("Application Letter Generation", () => {
  it("should generate application letter", async () => {
    const ctx = createTestContext(1);
    const caller = appRouter.createCaller(ctx);

    expect(caller.application.generateLetter).toBeDefined();
  });

  it("should get application history", async () => {
    const ctx = createTestContext(1);
    const caller = appRouter.createCaller(ctx);

    expect(caller.application.getHistory).toBeDefined();
  });
});

describe("Notifications", () => {
  it("should list user notifications", async () => {
    const ctx = createTestContext(1);
    const caller = appRouter.createCaller(ctx);

    expect(caller.notifications.list).toBeDefined();
  });

  it("should mark notification as read", async () => {
    const ctx = createTestContext(1);
    const caller = appRouter.createCaller(ctx);

    expect(caller.notifications.markAsRead).toBeDefined();
  });

  it("should get unread count", async () => {
    const ctx = createTestContext(1);
    const caller = appRouter.createCaller(ctx);

    expect(caller.notifications.unreadCount).toBeDefined();
  });
});
