import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Student profiles with academic information
 */
export const studentProfiles = mysqlTable("student_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  currentUniversity: text("current_university"),
  currentMajor: text("current_major"),
  academicLevel: mysqlEnum("academic_level", ["high_school", "undergraduate", "graduate"]),
  gpa: decimal("gpa", { precision: 3, scale: 2 }),
  targetUniversities: text("target_universities"), // JSON array
  targetMajors: text("target_majors"), // JSON array
  skills: text("skills"), // JSON array
  interests: text("interests"), // JSON array
  bio: text("bio"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentProfile = typeof studentProfiles.$inferSelect;
export type InsertStudentProfile = typeof studentProfiles.$inferInsert;

/**
 * Activity experiences (modular storage)
 */
export const activities = mysqlTable("activities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  title: text("title").notNull(),
  category: mysqlEnum("category", ["research", "volunteer", "competition", "internship", "project", "leadership", "other"]).notNull(),
  organization: text("organization"),
  role: text("role"),
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isCurrent: boolean("is_current").default(false),
  skills: text("skills"), // JSON array
  achievements: text("achievements"), // JSON array
  source: mysqlEnum("source", ["manual", "resume_upload"]).default("manual").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

/**
 * Universities
 */
export const universities = mysqlTable("universities", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  ranking: int("ranking"),
  website: text("website"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type University = typeof universities.$inferSelect;
export type InsertUniversity = typeof universities.$inferInsert;

/**
 * Professors and their labs
 */
export const professors = mysqlTable("professors", {
  id: int("id").autoincrement().primaryKey(),
  universityId: int("university_id").notNull(),
  name: text("name").notNull(),
  email: varchar("email", { length: 320 }),
  department: text("department").notNull(),
  title: text("title"),
  researchAreas: text("research_areas"), // JSON array
  labName: text("lab_name"),
  labWebsite: text("lab_website"),
  personalWebsite: text("personal_website"),
  bio: text("bio"),
  acceptingStudents: boolean("accepting_students").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Professor = typeof professors.$inferSelect;
export type InsertProfessor = typeof professors.$inferInsert;

/**
 * Research projects
 */
export const researchProjects = mysqlTable("research_projects", {
  id: int("id").autoincrement().primaryKey(),
  professorId: int("professor_id").notNull(),
  universityId: int("university_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements"), // JSON array
  researchAreas: text("research_areas"), // JSON array
  majors: text("majors"), // JSON array - target majors
  academicLevel: mysqlEnum("academic_level", ["high_school", "undergraduate", "graduate", "all"]).default("all"), // Target academic level
  minGPA: decimal("min_gpa", { precision: 3, scale: 2 }), // Minimum GPA requirement
  maxGPA: decimal("max_gpa", { precision: 3, scale: 2 }), // Maximum GPA requirement
  duration: text("duration"),
  isPaid: boolean("is_paid").default(false),
  isRemote: boolean("is_remote").default(false),
  applicationDeadline: timestamp("application_deadline"),
  status: mysqlEnum("status", ["open", "closed", "filled"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResearchProject = typeof researchProjects.$inferSelect;
export type InsertResearchProject = typeof researchProjects.$inferInsert;

/**
 * Project matches and scores
 */
export const projectMatches = mysqlTable("project_matches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  projectId: int("project_id").notNull(),
  matchScore: decimal("match_score", { precision: 5, scale: 2 }).notNull(), // 0-100
  matchReasons: text("match_reasons"), // JSON array
  viewed: boolean("viewed").default(false),
  saved: boolean("saved").default(false),
  applied: boolean("applied").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProjectMatch = typeof projectMatches.$inferSelect;
export type InsertProjectMatch = typeof projectMatches.$inferInsert;

/**
 * Application letters generated by LLM
 */
export const applicationLetters = mysqlTable("application_letters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  projectId: int("project_id").notNull(),
  content: text("content").notNull(),
  version: int("version").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApplicationLetter = typeof applicationLetters.$inferSelect;
export type InsertApplicationLetter = typeof applicationLetters.$inferInsert;

/**
 * Notifications for users
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  type: mysqlEnum("type", ["new_match", "project_update", "application_reminder", "system"]).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedProjectId: int("related_project_id"),
  read: boolean("read").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Contact messages from users to admin
 */
export const contactMessages = mysqlTable("contact_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  messageType: mysqlEnum("message_type", ["business", "support"]).default("support").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["pending", "read", "replied", "closed"]).default("pending").notNull(),
  adminReply: text("admin_reply"),
  repliedAt: timestamp("replied_at"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;

/**
 * User credits for daily free quota system
 * - Each user gets 100 credits per day
 * - Credits reset daily at midnight (UTC)
 * - Credits do not accumulate across days
 * - Admins are exempt from credit deductions
 */
export const userCredits = mysqlTable("user_credits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  credits: int("credits").notNull().default(100), // Current available credits (max 100)
  lastResetDate: varchar("last_reset_date", { length: 10 }).notNull(), // Date of last credit reset (YYYY-MM-DD)
  totalConsumed: int("total_consumed").notNull().default(0), // Total credits ever consumed (for statistics)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserCredit = typeof userCredits.$inferSelect;
export type InsertUserCredit = typeof userCredits.$inferInsert;

/**
 * Credit transactions (purchases and consumptions)
 */
export const creditTransactions = mysqlTable("credit_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  type: mysqlEnum("type", ["purchase", "consumption", "refund"]).notNull(),
  amount: int("amount").notNull(), // Positive for purchase/refund, negative for consumption
  balanceAfter: int("balance_after").notNull(), // Balance after this transaction
  description: text("description"), // Description of the transaction
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }), // For purchases
  relatedFeature: varchar("related_feature", { length: 100 }), // e.g., "resume_parse", "letter_generation"
  metadata: text("metadata"), // JSON for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;
