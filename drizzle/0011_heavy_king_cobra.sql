CREATE TABLE IF NOT EXISTS `cover_letters` (
`id` int AUTO_INCREMENT NOT NULL,
`user_id` int NOT NULL,
`match_id` int NOT NULL,
`project_name` varchar(500) NOT NULL,
`professor_name` varchar(255) NOT NULL,
`university` varchar(255) NOT NULL,
`content` text NOT NULL,
`tone` enum('formal','casual','enthusiastic') NOT NULL DEFAULT 'formal',
`viewed` boolean DEFAULT false,
`downloaded` boolean DEFAULT false,
`createdAt` timestamp NOT NULL DEFAULT (now()),
`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
CONSTRAINT `cover_letters_id` PRIMARY KEY(`id`)
);
