ALTER TABLE `project_matches` MODIFY COLUMN `project_id` int;--> statement-breakpoint
ALTER TABLE `project_matches` ADD `project_name` varchar(500) NOT NULL;--> statement-breakpoint
ALTER TABLE `project_matches` ADD `professor_name` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `project_matches` ADD `lab` varchar(255);--> statement-breakpoint
ALTER TABLE `project_matches` ADD `research_direction` varchar(500) NOT NULL;--> statement-breakpoint
ALTER TABLE `project_matches` ADD `description` text NOT NULL;--> statement-breakpoint
ALTER TABLE `project_matches` ADD `requirements` text;--> statement-breakpoint
ALTER TABLE `project_matches` ADD `contact_email` varchar(255);--> statement-breakpoint
ALTER TABLE `project_matches` ADD `url` varchar(500);--> statement-breakpoint
ALTER TABLE `project_matches` ADD `university` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `project_matches` ADD `major` varchar(255) NOT NULL;