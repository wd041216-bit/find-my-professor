import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: role,
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

function createAdminContext(): TrpcContext {
  return createUserContext("admin");
}

describe("contact.send", () => {
  it("validates required fields", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    // Test empty subject
    await expect(
      caller.contact.send({ subject: "", message: "Test message" })
    ).rejects.toThrow();

    // Test empty message
    await expect(
      caller.contact.send({ subject: "Test subject", message: "" })
    ).rejects.toThrow();
  });
});

describe("contact.allMessages (admin only)", () => {
  it("throws error for non-admin users", async () => {
    const ctx = createUserContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(caller.contact.allMessages()).rejects.toThrow(
      "Unauthorized: Admin access required"
    );
  });
});

describe("contact.reply (admin only)", () => {
  it("throws error for non-admin users", async () => {
    const ctx = createUserContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.contact.reply({ messageId: 1, reply: "Test reply" })
    ).rejects.toThrow("Unauthorized: Admin access required");
  });
});

describe("contact.updateStatus (admin only)", () => {
  it("throws error for non-admin users", async () => {
    const ctx = createUserContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.contact.updateStatus({ messageId: 1, status: "read" })
    ).rejects.toThrow("Unauthorized: Admin access required");
  });
});
