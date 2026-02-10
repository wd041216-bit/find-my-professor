CREATE TABLE `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`title` text NOT NULL,
	`category` enum('research','volunteer','competition','internship','project','leadership','other') NOT NULL,
	`organization` text,
	`role` text,
	`description` text,
	`start_date` timestamp,
	`end_date` timestamp,
	`is_current` boolean DEFAULT false,
	`skills` text,
	`achievements` text,
	`source` enum('manual','resume_upload') NOT NULL DEFAULT 'manual',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`start_date` timestamp NOT NULL,
	`end_date` timestamp NOT NULL,
	`created_by` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `application_letters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`project_id` int NOT NULL,
	`content` text NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `application_letters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`message_type` enum('business','support','purchase') NOT NULL DEFAULT 'support',
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`status` enum('pending','read','replied','closed') NOT NULL DEFAULT 'pending',
	`admin_reply` text,
	`replied_at` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contact_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cover_letters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`match_id` int NOT NULL,
	`project_name` varchar(500) NOT NULL,
	`professor_name` varchar(255) NOT NULL,
	`university` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`tone` enum('formal','casual','enthusiastic') NOT NULL DEFAULT 'formal',
	`viewed` boolean DEFAULT false,
	`downloaded` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cover_letters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `error_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`message` text NOT NULL,
	`stack` text,
	`error_type` varchar(100),
	`url` varchar(500) NOT NULL,
	`user_agent` text,
	`browser_info` text,
	`component_stack` text,
	`additional_info` text,
	`resolved` boolean DEFAULT false,
	`resolved_by` int,
	`resolved_at` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `error_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `major_normalization` (
	`id` int AUTO_INCREMENT NOT NULL,
	`raw_input` varchar(255) NOT NULL,
	`normalized_name` varchar(255) NOT NULL,
	`major_category` varchar(100),
	`major_field` varchar(100),
	`identified_by_llm` boolean DEFAULT true,
	`llm_model` varchar(50),
	`llm_confidence` decimal(3,2),
	`llm_reasoning` text,
	`aliases` text,
	`category` varchar(100),
	`field` varchar(100),
	`related_majors` text,
	`usage_count` int DEFAULT 1,
	`last_used_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`confidence` decimal(3,2) DEFAULT '0.95',
	`reasoning` text,
	CONSTRAINT `major_normalization_id` PRIMARY KEY(`id`),
	CONSTRAINT `major_normalization_raw_input_unique` UNIQUE(`raw_input`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`type` enum('new_match','project_update','application_reminder','system') NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`related_project_id` int,
	`read` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `professor_url_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`professor_name` varchar(255) NOT NULL,
	`university` varchar(255) NOT NULL,
	`department` varchar(255) NOT NULL,
	`project_name` varchar(500),
	`url` varchar(500) NOT NULL,
	`url_type` enum('professor_page','lab_page','department_page','school_page','university_homepage') NOT NULL,
	`is_accessible` boolean NOT NULL DEFAULT true,
	`hit_count` int NOT NULL DEFAULT 0,
	`last_validated` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `professor_url_cache_id` PRIMARY KEY(`id`),
	CONSTRAINT `professor_url_cache_professor_name_university_department_unique` UNIQUE(`professor_name`,`university`,`department`)
);
--> statement-breakpoint
CREATE TABLE `professors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`university_id` int,
	`university_name` varchar(255),
	`major_name` varchar(255),
	`name` text NOT NULL,
	`email` varchar(320),
	`department` text,
	`title` text,
	`research_areas` text,
	`tags` json,
	`research_field` varchar(100),
	`lab_name` text,
	`lab_website` text,
	`personal_website` text,
	`source_url` varchar(500),
	`bio` text,
	`accepting_students` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `professors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profile_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profile_hash` varchar(64) NOT NULL,
	`university` varchar(255) NOT NULL,
	`major` varchar(255) NOT NULL,
	`academic_level` enum('high_school','undergraduate','graduate'),
	`has_skills` boolean DEFAULT false,
	`has_activities` boolean DEFAULT false,
	`cached_matches` text NOT NULL,
	`match_count` int NOT NULL,
	`hit_count` int NOT NULL DEFAULT 0,
	`expires_at` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profile_cache_id` PRIMARY KEY(`id`),
	CONSTRAINT `profile_cache_profile_hash_unique` UNIQUE(`profile_hash`)
);
--> statement-breakpoint
CREATE TABLE `project_matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`project_id` int,
	`project_name` varchar(500) NOT NULL,
	`professor_name` varchar(255) NOT NULL,
	`lab` varchar(255),
	`research_direction` varchar(500) NOT NULL,
	`description` text NOT NULL,
	`requirements` text,
	`contact_email` varchar(255),
	`url` varchar(500),
	`university` varchar(255) NOT NULL,
	`major` varchar(255) NOT NULL,
	`match_score` decimal(5,2) NOT NULL,
	`match_reasons` text,
	`viewed` boolean DEFAULT false,
	`saved` boolean DEFAULT false,
	`applied` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `research_field_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`field_name` varchar(100) NOT NULL,
	`image_url` varchar(500) NOT NULL,
	`prompt` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `research_field_images_id` PRIMARY KEY(`id`),
	CONSTRAINT `research_field_images_field_name_unique` UNIQUE(`field_name`)
);
--> statement-breakpoint
CREATE TABLE `research_tags_dictionary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`university_name` varchar(255) NOT NULL,
	`major_name` varchar(255) NOT NULL,
	`tag` varchar(100) NOT NULL,
	`category` varchar(50),
	`frequency` int DEFAULT 1,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `research_tags_dictionary_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `school_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school_id` int NOT NULL,
	`image_url` text NOT NULL,
	`image_order` int DEFAULT 0,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `school_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`university_id` int NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`website` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schools_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scraped_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`university_name` varchar(255) NOT NULL,
	`major_name` varchar(255) NOT NULL,
	`degree_level` varchar(50) NOT NULL DEFAULT 'all',
	`professor_name` varchar(255),
	`lab_name` varchar(255),
	`research_area` varchar(255),
	`project_title` varchar(500) NOT NULL,
	`project_description` text,
	`requirements` text,
	`contact_email` varchar(255),
	`source_url` varchar(500),
	`tags` json,
	`source` enum('scraped','llm_generated') DEFAULT 'llm_generated',
	`search_scope` enum('university_wide','major_specific') DEFAULT 'major_specific',
	`scraped_at` timestamp DEFAULT (now()),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `scraped_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`professor_id` int NOT NULL,
	`like_type` varchar(20) NOT NULL DEFAULT 'like',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `student_likes_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_likes_student_id_professor_id_unique` UNIQUE(`student_id`,`professor_id`)
);
--> statement-breakpoint
CREATE TABLE `student_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`current_university` text,
	`current_major` text,
	`academic_level` enum('high_school','undergraduate','graduate'),
	`gpa` decimal(3,2),
	`target_universities` text,
	`target_majors` text,
	`skills` text,
	`interests` text,
	`bio` text,
	`resume_url` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_swipes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`professor_id` int NOT NULL,
	`action` varchar(20) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `student_swipes_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_swipes_student_id_professor_id_unique` UNIQUE(`student_id`,`professor_id`)
);
--> statement-breakpoint
CREATE TABLE `universities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`country` text NOT NULL,
	`ranking` int,
	`website` text,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `universities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `university_major_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`university_name` varchar(255) NOT NULL,
	`major_name` varchar(255) NOT NULL,
	`degree_level` varchar(50) NOT NULL DEFAULT 'all',
	`project_count` int DEFAULT 0,
	`cached_at` timestamp DEFAULT (now()),
	`expires_at` timestamp,
	`request_count` int DEFAULT 0,
	`last_requested_at` timestamp,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `university_major_cache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `university_normalization` (
	`id` int AUTO_INCREMENT NOT NULL,
	`raw_input` varchar(255) NOT NULL,
	`normalized_name` varchar(255) NOT NULL,
	`university_id` int,
	`identified_by_llm` boolean DEFAULT true,
	`llm_model` varchar(50),
	`llm_confidence` decimal(3,2),
	`llm_reasoning` text,
	`aliases` text,
	`country` varchar(100),
	`region` varchar(100),
	`usage_count` int DEFAULT 1,
	`last_used_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`confidence` decimal(3,2) DEFAULT '0.95',
	`reasoning` text,
	CONSTRAINT `university_normalization_id` PRIMARY KEY(`id`),
	CONSTRAINT `university_normalization_raw_input_unique` UNIQUE(`raw_input`)
);
--> statement-breakpoint
CREATE TABLE `university_url_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`university_name` varchar(255) NOT NULL,
	`major` varchar(100) NOT NULL DEFAULT 'computer science',
	`base_url` varchar(500) NOT NULL,
	`source` enum('llm_generated','manual','validated') NOT NULL,
	`confidence` enum('high','medium','low') NOT NULL DEFAULT 'medium',
	`is_accessible` boolean NOT NULL DEFAULT true,
	`last_validated` timestamp NOT NULL DEFAULT (now()),
	`success_count` int NOT NULL DEFAULT 0,
	`failure_count` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `university_url_cache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`timezone` varchar(64) DEFAULT 'UTC',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `student_likes` ADD CONSTRAINT `student_likes_student_id_users_id_fk` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_likes` ADD CONSTRAINT `student_likes_professor_id_professors_id_fk` FOREIGN KEY (`professor_id`) REFERENCES `professors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_swipes` ADD CONSTRAINT `student_swipes_student_id_users_id_fk` FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_swipes` ADD CONSTRAINT `student_swipes_professor_id_professors_id_fk` FOREIGN KEY (`professor_id`) REFERENCES `professors`(`id`) ON DELETE no action ON UPDATE no action;