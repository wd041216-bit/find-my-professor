ALTER TABLE `professors` MODIFY COLUMN `university_id` int;--> statement-breakpoint
ALTER TABLE `professors` MODIFY COLUMN `department` text;--> statement-breakpoint
ALTER TABLE `professors` ADD `university_name` varchar(255);--> statement-breakpoint
ALTER TABLE `professors` ADD `major_name` varchar(255);--> statement-breakpoint
ALTER TABLE `professors` ADD `tags` json;--> statement-breakpoint
ALTER TABLE `professors` ADD `source_url` varchar(500);