CREATE TABLE `credit_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`type` enum('purchase','consumption','refund') NOT NULL,
	`amount` int NOT NULL,
	`balance_after` int NOT NULL,
	`description` text,
	`stripe_payment_intent_id` varchar(255),
	`related_feature` varchar(100),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credit_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_credits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`balance` int NOT NULL DEFAULT 0,
	`total_purchased` int NOT NULL DEFAULT 0,
	`total_consumed` int NOT NULL DEFAULT 0,
	`stripe_customer_id` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_credits_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_credits_user_id_unique` UNIQUE(`user_id`)
);
