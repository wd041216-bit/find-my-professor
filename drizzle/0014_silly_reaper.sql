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
