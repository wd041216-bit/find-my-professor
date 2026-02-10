CREATE TABLE `research_field_tag_mapping` (
	`id` int AUTO_INCREMENT NOT NULL,
	`research_field_name` varchar(100) NOT NULL,
	`tag` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `research_field_tag_mapping_id` PRIMARY KEY(`id`),
	CONSTRAINT `research_field_tag_mapping_tag_unique` UNIQUE(`tag`)
);
--> statement-breakpoint
CREATE INDEX `field_idx` ON `research_field_tag_mapping` (`research_field_name`);