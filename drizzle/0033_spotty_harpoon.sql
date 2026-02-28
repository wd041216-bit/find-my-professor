ALTER TABLE `professors` ADD `research_field_zh` varchar(255);--> statement-breakpoint
ALTER TABLE `professors` ADD `department_zh` text;--> statement-breakpoint
ALTER TABLE `professors` ADD `tags_zh` json;--> statement-breakpoint
ALTER TABLE `research_tags_dictionary` ADD `tag_zh` varchar(100);--> statement-breakpoint
ALTER TABLE `university_field_images` ADD `research_field_name_zh` varchar(255);