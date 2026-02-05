import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  studentProfiles,
  InsertStudentProfile,
  activities,
  InsertActivity,
  universities,
  InsertUniversity,
  professors,
  InsertProfessor,
  researchProjects,
  InsertResearchProject,
  projectMatches,
  InsertProjectMatch,
  applicationLetters,
  InsertApplicationLetter,
  notifications,
  InsertNotification,
  announcements,
  InsertAnnouncement,
  userCredits,
  creditTransactions,
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
    
    // Grant 100 free credits to new users
    if (isNewUser) {
      const newUser = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
      if (newUser.length > 0) {
        const userId = newUser[0].id;
        // Create user credits with 100 free credits
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        await db.insert(userCredits).values({
          userId,
          credits: 100,
          lastResetDate: today,
          totalConsumed: 0,
        });
        // Record the free credit transaction
        await db.insert(creditTransactions).values({
          userId,
          type: 'purchase',
          amount: 100,
          balanceAfter: 100,
          description: 'Welcome bonus - Free 100 credits for new users',
          metadata: JSON.stringify({ source: 'signup_bonus' }),
        });
      }
    }
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

// ===== University Management =====

export async function getAllUniversities() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(universities).orderBy(universities.ranking);
}

export async function getUniversityById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(universities).where(eq(universities.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUniversity(university: InsertUniversity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(universities).values(university);
  const inserted = await db.select().from(universities).orderBy(desc(universities.id)).limit(1);
  return inserted[0]?.id ?? 0;
}

// ===== Professor Management =====

export async function getProfessorsByUniversity(universityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(professors).where(eq(professors.universityId, universityId));
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

// ===== Research Project Management =====

export async function getAllResearchProjects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(researchProjects)
    .where(eq(researchProjects.status, "open"))
    .orderBy(desc(researchProjects.createdAt));
}

export async function getResearchProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(researchProjects).where(eq(researchProjects.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function searchResearchProjects(filters: {
  universityIds?: number[];
  majors?: string[];
  researchAreas?: string[];
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(researchProjects).where(eq(researchProjects.status, "open"));
  
  // Note: For JSON array filtering, we'll need to handle this in application logic
  // as MySQL JSON functions are complex. Return all open projects for now.
  
  return query.orderBy(desc(researchProjects.createdAt));
}

export async function createResearchProject(project: InsertResearchProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(researchProjects).values(project);
  const inserted = await db.select().from(researchProjects).orderBy(desc(researchProjects.id)).limit(1);
  return inserted[0]?.id ?? 0;
}

// ===== Project Match Management =====

export async function getUserMatches(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projectMatches)
    .where(eq(projectMatches.userId, userId))
    .orderBy(desc(projectMatches.matchScore));
}

export async function deleteUserMatches(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(projectMatches).where(eq(projectMatches.userId, userId));
}

export async function getMatchByUserAndProject(userId: number, projectId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projectMatches)
    .where(and(
      eq(projectMatches.userId, userId),
      eq(projectMatches.projectId, projectId)
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProjectMatch(match: InsertProjectMatch) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(projectMatches).values(match);
  const inserted = await db.select().from(projectMatches).orderBy(desc(projectMatches.id)).limit(1);
  return inserted[0]?.id ?? 0;
}

export async function upsertProjectMatch(match: InsertProjectMatch) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = match.projectId ? await getMatchByUserAndProject(match.userId, match.projectId) : undefined;
  
  if (existing) {
    await db.update(projectMatches)
      .set({ ...match, updatedAt: new Date() })
      .where(eq(projectMatches.id, existing.id));
    return existing.id;
  } else {
    await db.insert(projectMatches).values(match);
    const inserted = await db.select().from(projectMatches).orderBy(desc(projectMatches.id)).limit(1);
    return inserted[0]?.id ?? 0;
  }
}

export async function updateMatchStatus(id: number, updates: { viewed?: boolean; saved?: boolean; applied?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projectMatches).set({ ...updates, updatedAt: new Date() }).where(eq(projectMatches.id, id));
}

// ===== Application Letter Management =====

export async function createApplicationLetter(letter: InsertApplicationLetter) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(applicationLetters).values(letter);
  const inserted = await db.select().from(applicationLetters).orderBy(desc(applicationLetters.id)).limit(1);
  return inserted[0]?.id ?? 0;
}

export async function getUserApplicationLetters(userId: number, projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(applicationLetters)
    .where(and(
      eq(applicationLetters.userId, userId),
      eq(applicationLetters.projectId, projectId)
    ))
    .orderBy(desc(applicationLetters.version));
}

// ===== Notification Management =====

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(notifications).values(notification);
  const inserted = await db.select().from(notifications).orderBy(desc(notifications.id)).limit(1);
  return inserted[0]?.id ?? 0;
}

export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.read, false)
    ));
  return result[0]?.count ?? 0;
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

// ===== Contact Message Management =====

import { contactMessages, InsertContactMessage } from "../drizzle/schema";

export async function createContactMessage(message: InsertContactMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(contactMessages).values(message);
  const inserted = await db.select().from(contactMessages).orderBy(desc(contactMessages.id)).limit(1);
  return inserted[0]?.id ?? 0;
}

export async function getUserContactMessages(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contactMessages)
    .where(eq(contactMessages.userId, userId))
    .orderBy(desc(contactMessages.createdAt));
}

export async function getAllContactMessages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contactMessages)
    .orderBy(desc(contactMessages.createdAt));
}

export async function getContactMessageById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contactMessages).where(eq(contactMessages.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateContactMessageStatus(id: number, status: "pending" | "read" | "replied" | "closed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contactMessages).set({ status, updatedAt: new Date() }).where(eq(contactMessages.id, id));
}

export async function replyToContactMessage(id: number, adminReply: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contactMessages).set({ 
    adminReply, 
    status: "replied",
    repliedAt: new Date(),
    updatedAt: new Date() 
  }).where(eq(contactMessages.id, id));
}

export async function getAdminUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.role, "admin"));
}

// ===== Credits Management =====

export async function getUserCredits(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createUserCredits(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  await db.insert(userCredits).values({
    userId,
    credits: 100,
    lastResetDate: today,
    totalConsumed: 0,
  });
  
  return getUserCredits(userId);
}

export async function updateUserCreditsBalance(userId: number, amount: number, type: 'purchase' | 'consumption' | 'refund', description: string, metadata?: any) {
  const db = await getDb();
  if (!db) return null;
  
  // Get current credits
  let credits = await getUserCredits(userId);
  if (!credits) {
    credits = await createUserCredits(userId);
    if (!credits) return null;
  }
  
  const newBalance = credits.credits + amount;
  
  if (newBalance < 0) {
    throw new Error("Insufficient credits");
  }
  
  // Update credits
  await db.update(userCredits)
    .set({
      credits: newBalance,
      totalConsumed: type === 'consumption' ? credits.totalConsumed + Math.abs(amount) : credits.totalConsumed,
    })
    .where(eq(userCredits.userId, userId));
  
  // Record transaction
  await db.insert(creditTransactions).values({
    userId,
    type,
    amount,
    balanceAfter: newBalance,
    description,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });
  
  return getUserCredits(userId);
}

export async function getCreditTransactions(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(limit);
}

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
