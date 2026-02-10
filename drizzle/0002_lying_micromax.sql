CREATE TABLE `contact_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`status` enum('pending','read','replied','closed') NOT NULL DEFAULT 'pending',
	`admin_reply` text,
	`replied_at` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contact_messages_id` PRIMARY KEY(`id`)
);
