CREATE TABLE `research_field_tag_mapping` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tag` varchar(100) NOT NULL,
	`research_field` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `research_field_tag_mapping_id` PRIMARY KEY(`id`),
	CONSTRAINT `research_field_tag_mapping_tag_unique` UNIQUE(`tag`)
);
--> statement-breakpoint
CREATE TABLE `university_field_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`university_name` varchar(255) NOT NULL,
	`research_field_name` varchar(255) NOT NULL,
	`image_url` text NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `university_field_images_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_university_field` UNIQUE(`university_name`,`research_field_name`)
);
--> statement-breakpoint
DROP TABLE `application_letters`;--> statement-breakpoint
DROP TABLE `contact_messages`;--> statement-breakpoint
DROP TABLE `major_normalization`;--> statement-breakpoint
DROP TABLE `notifications`;--> statement-breakpoint
DROP TABLE `professor_url_cache`;--> statement-breakpoint
DROP TABLE `profile_cache`;--> statement-breakpoint
DROP TABLE `project_matches`;--> statement-breakpoint
DROP TABLE `schools`;--> statement-breakpoint
DROP TABLE `scraped_projects`;--> statement-breakpoint
DROP TABLE `universities`;--> statement-breakpoint
DROP TABLE `university_major_cache`;--> statement-breakpoint
DROP TABLE `university_normalization`;--> statement-breakpoint
DROP TABLE `university_url_cache`;