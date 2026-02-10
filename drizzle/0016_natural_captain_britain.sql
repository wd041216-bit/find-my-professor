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
