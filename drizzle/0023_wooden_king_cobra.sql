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
