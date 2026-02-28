import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, unique, json } from "drizzle-orm/mysql-core";

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
  timezone: varchar("timezone", { length: 64 }).default("UTC"),
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
  resumeUrl: text("resume_url"), // URL to uploaded resume file
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
 * Professors (simplified schema - only essential fields)
 */
export const professors = mysqlTable("professors", {
  id: int("id").autoincrement().primaryKey(),
  universityName: varchar("university_name", { length: 255 }).notNull(),
  department: text("department").notNull(), // School/Department name
  name: text("name").notNull(),
  title: text("title"), // e.g., "Professor", "Associate Professor"
  researchAreas: text("research_areas"), // JSON array of research areas
  tags: json("tags").$type<string[]>(), // Research tags for matching algorithm
  research_field: varchar("research_field", { length: 255 }), // Research field category
  research_field_zh: varchar("research_field_zh", { length: 255 }), // Chinese research field name
  department_zh: text("department_zh"), // Chinese department/school name
  tags_zh: json("tags_zh").$type<string[]>(), // Chinese research tags
  imageUrl: text("image_url"), // University/department branded image URL
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Professor = typeof professors.$inferSelect;
export type InsertProfessor = typeof professors.$inferInsert;

/**
 * Cover letters generated for project matches
 * Stores personalized application letters for specific project-user pairs
 */
export const coverLetters = mysqlTable("cover_letters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  matchId: int("match_id"), // Links to project_matches table (optional for professor-based letters)
  
  // Project context (denormalized for easy access)
  projectName: varchar("project_name", { length: 500 }).notNull(),
  professorName: varchar("professor_name", { length: 255 }).notNull(),
  university: varchar("university", { length: 255 }).notNull(),
  
  // Letter content
  content: text("content").notNull(), // The generated cover letter
  tone: mysqlEnum("tone", ["formal", "casual", "enthusiastic"]).default("formal").notNull(),
  
  // Metadata
  viewed: boolean("viewed").default(false),
  downloaded: boolean("downloaded").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CoverLetter = typeof coverLetters.$inferSelect;
export type InsertCoverLetter = typeof coverLetters.$inferInsert;

/**
 * System announcements from admin
 */
export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdBy: int("created_by").notNull(), // Admin user ID
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

/**
 * Frontend error logs for monitoring and debugging
 * Captures JavaScript errors from client-side to help identify and fix issues
 */
export const errorLogs = mysqlTable("error_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id"), // Optional: may be null for unauthenticated users
  
  // Error details
  message: text("message").notNull(), // Error message
  stack: text("stack"), // Stack trace
  errorType: varchar("error_type", { length: 100 }), // e.g., "TypeError", "ReferenceError"
  
  // Context information
  url: varchar("url", { length: 500 }).notNull(), // Page URL where error occurred
  userAgent: text("user_agent"), // Browser user agent
  browserInfo: text("browser_info"), // Browser name, version, OS (JSON)
  
  // Additional metadata
  componentStack: text("component_stack"), // React component stack (if available)
  additionalInfo: text("additional_info"), // JSON for custom data
  
  // Status
  resolved: boolean("resolved").default(false), // Whether the error has been fixed
  resolvedBy: int("resolved_by"), // Admin user ID who marked as resolved
  resolvedAt: timestamp("resolved_at"),
  notes: text("notes"), // Admin notes about the error
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = typeof errorLogs.$inferInsert;

/**
 * Research tags dictionary
 * Stores standardized research tags for each university-major combination
 * Ensures students and professors use the same tag vocabulary
 */
export const researchTagsDictionary = mysqlTable("research_tags_dictionary", {
  id: int("id").autoincrement().primaryKey(),
  universityName: varchar("university_name", { length: 255 }).notNull(),
  majorName: varchar("major_name", { length: 255 }).notNull(),
  tag: varchar("tag", { length: 100 }).notNull(),
  tag_zh: varchar("tag_zh", { length: 100 }), // Chinese translation of the tag
  category: varchar("category", { length: 50 }), // methodology, domain, technology, etc.
  frequency: int("frequency").default(1), // How many professors use this tag
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type ResearchTagsDictionary = typeof researchTagsDictionary.$inferSelect;
export type InsertResearchTagsDictionary = typeof researchTagsDictionary.$inferInsert;

/**
 * Student likes table
 * Stores professors that students have liked (swiped right)
 */
export const studentLikes = mysqlTable("student_likes", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("student_id").notNull().references(() => users.id),
  professorId: int("professor_id").notNull().references(() => professors.id),
  likeType: varchar("like_type", { length: 20 }).notNull().default("like"), // 'like' or 'super_like'
  matchScore: int("match_score"), // Match score at the time of liking (0-100)
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueStudentProfessor: unique().on(table.studentId, table.professorId),
}));

export type StudentLike = typeof studentLikes.$inferSelect;
export type InsertStudentLike = typeof studentLikes.$inferInsert;

/**
 * Student swipes table
 * Stores all swipe actions (pass, like, super_like) to avoid showing the same professor twice
 */
export const studentSwipes = mysqlTable("student_swipes", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("student_id").notNull().references(() => users.id),
  professorId: int("professor_id").notNull().references(() => professors.id),
  action: varchar("action", { length: 20 }).notNull(), // 'pass', 'like', 'super_like'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueStudentProfessor: unique().on(table.studentId, table.professorId),
}));

export type StudentSwipe = typeof studentSwipes.$inferSelect;
export type InsertStudentSwipe = typeof studentSwipes.$inferInsert;

/**
 * Research field images (generic field images)
 * University field images (university-specific field images with mascot branding)
 * Stores university-branded image URLs for different research fields
 */
export const universityFieldImages = mysqlTable("university_field_images", {
  id: int("id").autoincrement().primaryKey(),
  universityName: varchar("university_name", { length: 255 }).notNull(),
  researchFieldName: varchar("research_field_name", { length: 255 }).notNull(),
  researchFieldNameZh: varchar("research_field_name_zh", { length: 255 }), // Chinese research field name
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUniversityField: unique("unique_university_field").on(table.universityName, table.researchFieldName),
}));

export type UniversityFieldImage = typeof universityFieldImages.$inferSelect;
export type InsertUniversityFieldImage = typeof universityFieldImages.$inferInsert;

/**
 * Research field tag mapping
 * Maps research tags to research fields for categorization
 */
export const researchFieldTagMapping = mysqlTable("research_field_tag_mapping", {
  id: int("id").autoincrement().primaryKey(),
  tag: varchar("tag", { length: 100 }).notNull().unique(),
  researchField: varchar("research_field", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ResearchFieldTagMapping = typeof researchFieldTagMapping.$inferSelect;
export type InsertResearchFieldTagMapping = typeof researchFieldTagMapping.$inferInsert;
