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
