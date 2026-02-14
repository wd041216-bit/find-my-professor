import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  studentProfiles,
  InsertStudentProfile,
  activities,
  InsertActivity,
  professors,
  InsertProfessor,
  announcements,
  InsertAnnouncement,
  // userCredits, // Removed
  // creditTransactions, // Removed
  errorLogs
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ===== User Management =====

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
    const isNewUser = existingUser.length === 0;
    
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
    
    // Credits system removed - all features are now free
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== Student Profile Management =====

export async function getStudentProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertStudentProfile(profile: InsertStudentProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getStudentProfile(profile.userId);
  
  // Filter out undefined values to avoid SQL errors
  const cleanProfile = Object.fromEntries(
    Object.entries(profile).filter(([_, v]) => v !== undefined)
  ) as InsertStudentProfile;
  
  if (existing) {
    await db.update(studentProfiles)
      .set({ ...cleanProfile, updatedAt: new Date() })
      .where(eq(studentProfiles.userId, profile.userId));
    return getStudentProfile(profile.userId);
  } else {
    await db.insert(studentProfiles).values(cleanProfile);
    return getStudentProfile(profile.userId);
  }
}

// ===== Activity Management =====

export async function createActivity(activity: InsertActivity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(activities).values(activity);
  const inserted = await db.select().from(activities).where(eq(activities.userId, activity.userId)).orderBy(desc(activities.id)).limit(1);
  return inserted[0]?.id ?? 0;
}

export async function getUserActivities(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activities).where(eq(activities.userId, userId)).orderBy(desc(activities.startDate));
}

export async function getActivityById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(activities).where(eq(activities.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateActivity(id: number, activity: Partial<InsertActivity>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(activities).set({ ...activity, updatedAt: new Date() }).where(eq(activities.id, id));
  return getActivityById(id);
}

export async function deleteActivity(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(activities).where(eq(activities.id, id));
}


// ===== Professor Management =====

export async function getProfessorsByUniversity(universityName: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(professors).where(eq(professors.universityName, universityName));
}

export async function getProfessorById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(professors).where(eq(professors.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProfessor(professor: InsertProfessor) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(professors).values(professor);
  const inserted = await db.select().from(professors).orderBy(desc(professors.id)).limit(1);
  return inserted[0]?.id ?? 0;
}

// ===== Announcement Management =====

export async function createAnnouncement(announcement: InsertAnnouncement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(announcements).values(announcement);
  const inserted = await db.select().from(announcements).orderBy(desc(announcements.id)).limit(1);
  return inserted[0]?.id ?? 0;
}

export async function getActiveAnnouncements() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return db.select().from(announcements)
    .where(and(
      sql`${announcements.startDate} <= ${now}`,
      sql`${announcements.endDate} >= ${now}`
    ))
    .orderBy(desc(announcements.createdAt));
}

export async function getAllAnnouncements() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(announcements)
    .orderBy(desc(announcements.createdAt));
}

export async function deleteAnnouncement(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(announcements).where(eq(announcements.id, id));
}

export async function getAdminUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.role, "admin"));
}

// ===== Credits Management - REMOVED =====
// Credits system has been removed from the application

// export async function getUserCredits(userId: number) {
//   const db = await getDb();
//   if (!db) return null;
//   const result = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1);
//   return result.length > 0 ? result[0] : null;
// }

// export async function createUserCredits(userId: number) { ... }
// export async function updateUserCreditsBalance(...) { ... }
// export async function getCreditTransactions(...) { ... }

// updateStripeCustomerId removed - payment feature not yet launched

// ===== Error Logs =====

export async function createErrorLog(data: {
  userId: number | null;
  message: string;
  stack: string | null;
  errorType: string | null;
  url: string;
  userAgent: string | null;
  browserInfo: string | null;
  componentStack: string | null;
  additionalInfo: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(errorLogs).values(data);
  
  // Return the created error log
  const [errorLog] = await db.select().from(errorLogs).where(eq(errorLogs.id, Number(result.insertId)));
  return errorLog;
}

export async function getErrorLogs(
  limit: number = 50,
  offset: number = 0,
  resolved?: boolean
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query = db.select().from(errorLogs).orderBy(desc(errorLogs.createdAt)).limit(limit).offset(offset);
  
  if (resolved !== undefined) {
    query = query.where(eq(errorLogs.resolved, resolved)) as any;
  }

  return query;
}

export async function getErrorLogStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(errorLogs);
  const [unresolvedResult] = await db.select({ count: sql<number>`count(*)` }).from(errorLogs).where(eq(errorLogs.resolved, false));
  const [todayResult] = await db.select({ count: sql<number>`count(*)` }).from(errorLogs).where(sql`DATE(${errorLogs.createdAt}) = CURDATE()`);

  return {
    total: Number(totalResult.count),
    unresolved: Number(unresolvedResult.count),
    today: Number(todayResult.count),
  };
}

export async function markErrorResolved(errorId: number, adminId: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(errorLogs)
    .set({
      resolved: true,
      resolvedBy: adminId,
      resolvedAt: new Date(),
      notes: notes || null,
    })
    .where(eq(errorLogs.id, errorId));

  return { success: true };
}

export async function deleteErrorLog(errorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(errorLogs).where(eq(errorLogs.id, errorId));
  return { success: true };
}

// ===== User Timezone Management =====

export async function updateUserTimezone(userId: number, timezone: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users)
    .set({ timezone })
    .where(eq(users.id, userId));
  
  console.log(`[Database] Updated timezone for user ${userId} to ${timezone}`);
  return { success: true };
}

