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
CREATE TABLE `professors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`university_id` int NOT NULL,
	`name` text NOT NULL,
	`email` varchar(320),
	`department` text NOT NULL,
	`title` text,
	`research_areas` text,
	`lab_name` text,
	`lab_website` text,
	`personal_website` text,
	`bio` text,
	`accepting_students` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `professors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`project_id` int NOT NULL,
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
CREATE TABLE `research_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`professor_id` int NOT NULL,
	`university_id` int NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`requirements` text,
	`research_areas` text,
	`majors` text,
	`duration` text,
	`is_paid` boolean DEFAULT false,
	`is_remote` boolean DEFAULT false,
	`application_deadline` timestamp,
	`status` enum('open','closed','filled') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `research_projects_id` PRIMARY KEY(`id`)
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_profiles_id` PRIMARY KEY(`id`)
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
