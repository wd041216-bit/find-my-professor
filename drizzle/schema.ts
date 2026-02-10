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
  universityId: int("university_id"),
  universityName: varchar("university_name", { length: 255 }),
  majorName: varchar("major_name", { length: 255 }),
  name: text("name").notNull(),
  email: varchar("email", { length: 320 }),
  department: text("department"),
  title: text("title"),
  researchAreas: text("research_areas"), // JSON array
  tags: json("tags").$type<string[]>(), // 研究tags（用于匹配算法）
  researchField: varchar("research_field", { length: 100 }), // 研究领域分类（用于选择背景图片）
  labName: text("lab_name"),
  labWebsite: text("lab_website"),
  personalWebsite: text("personal_website"),
  sourceUrl: varchar("source_url", { length: 500 }), // 教授主页URL
  bio: text("bio"),
  acceptingStudents: boolean("accepting_students").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Professor = typeof professors.$inferSelect;
export type InsertProfessor = typeof professors.$inferInsert;

/**
 * Research field images
 * Maps research fields to AI-generated background images
 */
export const researchFieldImages = mysqlTable("research_field_images", {
  id: int("id").autoincrement().primaryKey(),
  fieldName: varchar("field_name", { length: 100 }).notNull().unique(), // e.g., "AI & Machine Learning"
  imageUrl: varchar("image_url", { length: 500 }).notNull(), // S3 URL
  prompt: text("prompt"), // AI generation prompt for reference
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResearchFieldImage = typeof researchFieldImages.$inferSelect;
export type InsertResearchFieldImage = typeof researchFieldImages.$inferInsert;

/**
 * Research projects
 */
/**
 * Project matches and scores
 * Stores project details directly from LLM or scraper
 */
export const projectMatches = mysqlTable("project_matches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  projectId: int("project_id"), // Optional: only if linked to research_projects
  
  // Project details (from LLM or scraper)
  projectName: varchar("project_name", { length: 500 }).notNull(),
  professorName: varchar("professor_name", { length: 255 }).notNull(),
  lab: varchar("lab", { length: 255 }),
  researchDirection: varchar("research_direction", { length: 500 }).notNull(),
  description: text("description").notNull(),
  requirements: text("requirements"),
  contactEmail: varchar("contact_email", { length: 255 }),
  url: varchar("url", { length: 500 }),
  university: varchar("university", { length: 255 }).notNull(),
  major: varchar("major", { length: 255 }).notNull(),
  
  // Match metadata
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
 * User profile cache for matching optimization
 * Caches matching results for similar user profiles to reduce LLM calls
 */
export const profileCache = mysqlTable("profile_cache", {
  id: int("id").autoincrement().primaryKey(),
  profileHash: varchar("profile_hash", { length: 64 }).notNull().unique(), // SHA-256 hash of profile key fields
  university: varchar("university", { length: 255 }).notNull(),
  major: varchar("major", { length: 255 }).notNull(),
  
  // Cached profile snapshot (for debugging)
  academicLevel: mysqlEnum("academic_level", ["high_school", "undergraduate", "graduate"]),
  hasSkills: boolean("has_skills").default(false),
  hasActivities: boolean("has_activities").default(false),
  
  // Cached matching results (JSON array of MatchedProject)
  cachedMatches: text("cached_matches").notNull(),
  matchCount: int("match_count").notNull(),
  
  // Cache metadata
  hitCount: int("hit_count").default(0).notNull(), // Number of times this cache was reused
  expiresAt: timestamp("expires_at").notNull(), // Cache expiration (7 days)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProfileCache = typeof profileCache.$inferSelect;
export type InsertProfileCache = typeof profileCache.$inferInsert;

/**
 * Cover letters generated for project matches
 * Stores personalized application letters for specific project-user pairs
 */
export const coverLetters = mysqlTable("cover_letters", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  matchId: int("match_id").notNull(), // Links to project_matches table
  
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
 * Contact messages from users to admin
 */
export const contactMessages = mysqlTable("contact_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  messageType: mysqlEnum("message_type", ["business", "support", "purchase"]).default("support").notNull(),
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
 * User credits for daily free quota system - REMOVED
 * Credits system has been removed from the application
 */
// export const userCredits = mysqlTable("user_credits", {
//   id: int("id").autoincrement().primaryKey(),
//   userId: int("user_id").notNull().unique(),
//   credits: int("credits").notNull().default(100),
//   lastResetDate: varchar("last_reset_date", { length: 10 }).notNull(),
//   totalConsumed: int("total_consumed").notNull().default(0),
//   createdAt: timestamp("createdAt").defaultNow().notNull(),
//   updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
// });

// export type UserCredit = typeof userCredits.$inferSelect;
// export type InsertUserCredit = typeof userCredits.$inferInsert;

/**
 * Credit transactions - REMOVED
 * Credits system has been removed from the application
 */
// export const creditTransactions = mysqlTable("credit_transactions", {
//   id: int("id").autoincrement().primaryKey(),
//   userId: int("user_id").notNull(),
//   type: mysqlEnum("type", ["purchase", "consumption", "refund"]).notNull(),
//   amount: int("amount").notNull(),
//   balanceAfter: int("balance_after").notNull(),
//   description: text("description"),
//   stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
//   relatedFeature: varchar("related_feature", { length: 100 }),
//   metadata: text("metadata"),
//   createdAt: timestamp("createdAt").defaultNow().notNull(),
// });

// export type CreditTransaction = typeof creditTransactions.$inferSelect;
// export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;

/**
 * University URL cache for LLM-generated URLs
 * Stores validated URLs to avoid repeated LLM calls
 */
export const universityUrlCache = mysqlTable("university_url_cache", {
  id: int("id").autoincrement().primaryKey(),
  universityName: varchar("university_name", { length: 255 }).notNull(),
  major: varchar("major", { length: 100 }).notNull().default("computer science"),
  baseUrl: varchar("base_url", { length: 500 }).notNull(),
  source: mysqlEnum("source", ["llm_generated", "manual", "validated"]).notNull(),
  confidence: mysqlEnum("confidence", ["high", "medium", "low"]).notNull().default("medium"),
  isAccessible: boolean("is_accessible").notNull().default(true),
  lastValidated: timestamp("last_validated").defaultNow().notNull(),
  successCount: int("success_count").notNull().default(0), // Number of successful scrapes
  failureCount: int("failure_count").notNull().default(0), // Number of failed scrapes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UniversityUrlCache = typeof universityUrlCache.$inferSelect;
export type InsertUniversityUrlCache = typeof universityUrlCache.$inferInsert;

/**
 * Professor/Project URL Cache
 * Stores validated URLs for professors and research projects to avoid repeated LLM calls
 * Cache key: professor_name + university + department
 */
export const professorUrlCache = mysqlTable("professor_url_cache", {
  id: int("id").autoincrement().primaryKey(),
  professorName: varchar("professor_name", { length: 255 }).notNull(),
  university: varchar("university", { length: 255 }).notNull(),
  department: varchar("department", { length: 255 }).notNull(),
  projectName: varchar("project_name", { length: 500 }), // Optional, for project-specific URLs
  
  // URL information
  url: varchar("url", { length: 500 }).notNull(),
  urlType: mysqlEnum("url_type", ["professor_page", "lab_page", "department_page", "school_page", "university_homepage"]).notNull(),
  isAccessible: boolean("is_accessible").notNull().default(true),
  
  // Cache metadata
  hitCount: int("hit_count").notNull().default(0), // Number of times this cache was reused
  lastValidated: timestamp("last_validated").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(), // Cache expiration (30 days)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  // Unique constraint on professor + university + department
  uniqueKey: unique().on(table.professorName, table.university, table.department),
}));

export type ProfessorUrlCache = typeof professorUrlCache.$inferSelect;
export type InsertProfessorUrlCache = typeof professorUrlCache.$inferInsert;

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
 * Scraped research projects from university websites
 * Stores projects collected by web scraping or generated by LLM
 */
export const scrapedProjects = mysqlTable("scraped_projects", {
  id: int("id").autoincrement().primaryKey(),
  universityName: varchar("university_name", { length: 255 }).notNull(),
  majorName: varchar("major_name", { length: 255 }).notNull(),
  degreeLevel: varchar("degree_level", { length: 50 }).notNull().default("all"),
  professorName: varchar("professor_name", { length: 255 }),
  labName: varchar("lab_name", { length: 255 }),
  researchArea: varchar("research_area", { length: 255 }),
  projectTitle: varchar("project_title", { length: 500 }).notNull(),
  projectDescription: text("project_description"),
  requirements: text("requirements"),
  contactEmail: varchar("contact_email", { length: 255 }),
  sourceUrl: varchar("source_url", { length: 500 }),
  tags: json("tags").$type<string[]>(),  // 教授研究tags（数组）
  source: mysqlEnum("source", ["scraped", "llm_generated"]).default("llm_generated"),
  searchScope: mysqlEnum("search_scope", ["university_wide", "major_specific"]).default("major_specific"),
  scrapedAt: timestamp("scraped_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ScrapedProject = typeof scrapedProjects.$inferSelect;
export type InsertScrapedProject = typeof scrapedProjects.$inferInsert;

/**
 * University-major combination cache
 * Tracks which university-major combinations have been scraped
 */
export const universityMajorCache = mysqlTable("university_major_cache", {
  id: int("id").autoincrement().primaryKey(),
  universityName: varchar("university_name", { length: 255 }).notNull(),
  majorName: varchar("major_name", { length: 255 }).notNull(),
  degreeLevel: varchar("degree_level", { length: 50 }).notNull().default("all"),
  projectCount: int("project_count").default(0),
  cachedAt: timestamp("cached_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  requestCount: int("request_count").default(0),
  lastRequestedAt: timestamp("last_requested_at"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type UniversityMajorCache = typeof universityMajorCache.$inferSelect;
export type InsertUniversityMajorCache = typeof universityMajorCache.$inferInsert;

/**
 * Major name normalization table
 * Maps various major name inputs to standardized names
 */
export const majorNormalization = mysqlTable("major_normalization", {
  id: int("id").autoincrement().primaryKey(),
  rawInput: varchar("raw_input", { length: 255 }).notNull().unique(),
  normalizedName: varchar("normalized_name", { length: 255 }).notNull(),
  majorCategory: varchar("major_category", { length: 100 }),
  majorField: varchar("major_field", { length: 100 }),
  identifiedByLlm: boolean("identified_by_llm").default(true),
  llmModel: varchar("llm_model", { length: 50 }),
  llmConfidence: decimal("llm_confidence", { precision: 3, scale: 2 }),
  llmReasoning: text("llm_reasoning"),
  aliases: text("aliases"), // JSON array of alternative names
  category: varchar("category", { length: 100 }),
  field: varchar("field", { length: 100 }),
  relatedMajors: text("related_majors"), // JSON array
  usageCount: int("usage_count").default(1),
  lastUsedAt: timestamp("last_used_at").defaultNow().onUpdateNow(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("0.95"),
  reasoning: text("reasoning"),
});

export type MajorNormalization = typeof majorNormalization.$inferSelect;
export type InsertMajorNormalization = typeof majorNormalization.$inferInsert;

/**
 * University name normalization table
 * Maps various university name inputs to standardized names
 */
export const universityNormalization = mysqlTable("university_normalization", {
  id: int("id").autoincrement().primaryKey(),
  rawInput: varchar("raw_input", { length: 255 }).notNull().unique(),
  normalizedName: varchar("normalized_name", { length: 255 }).notNull(),
  universityId: int("university_id"), // Links to universities table if exists
  identifiedByLlm: boolean("identified_by_llm").default(true),
  llmModel: varchar("llm_model", { length: 50 }),
  llmConfidence: decimal("llm_confidence", { precision: 3, scale: 2 }),
  llmReasoning: text("llm_reasoning"),
  aliases: text("aliases"), // JSON array of alternative names
  country: varchar("country", { length: 100 }),
  region: varchar("region", { length: 100 }),
  usageCount: int("usage_count").default(1),
  lastUsedAt: timestamp("last_used_at").defaultNow().onUpdateNow(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("0.95"),
  reasoning: text("reasoning"),
});

export type UniversityNormalization = typeof universityNormalization.$inferSelect;
export type InsertUniversityNormalization = typeof universityNormalization.$inferInsert;

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
 * Schools/Departments within universities
 * Stores information about schools/colleges within universities
 */
export const schools = mysqlTable("schools", {
  id: int("id").autoincrement().primaryKey(),
  universityId: int("university_id").notNull(),
  name: text("name").notNull(), // e.g., "Information School", "School of Engineering"
  description: text("description"),
  website: text("website"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type School = typeof schools.$inferSelect;
export type InsertSchool = typeof schools.$inferInsert;

/**
 * School images for professor card backgrounds
 * Each school can have multiple images displayed on professor cards
 */
export const schoolImages = mysqlTable("school_images", {
  id: int("id").autoincrement().primaryKey(),
  schoolId: int("school_id").notNull(),
  imageUrl: text("image_url").notNull(), // S3 URL
  imageOrder: int("image_order").default(0), // For ordering images
  description: text("description"), // Optional description
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SchoolImage = typeof schoolImages.$inferSelect;
export type InsertSchoolImage = typeof schoolImages.$inferInsert;
