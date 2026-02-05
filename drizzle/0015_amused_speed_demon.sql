CREATE TABLE `error_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`message` text NOT NULL,
	`stack` text,
	`error_type` varchar(100),
	`url` varchar(500) NOT NULL,
	`user_agent` text,
	`browser_info` text,
	`component_stack` text,
	`additional_info` text,
	`resolved` boolean DEFAULT false,
	`resolved_by` int,
	`resolved_at` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `error_logs_id` PRIMARY KEY(`id`)
);
